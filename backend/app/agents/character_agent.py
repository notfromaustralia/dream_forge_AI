"""Character generation."""

from __future__ import annotations

import json
import logging
import uuid
from typing import Any

from sqlalchemy import select

from app.agents.base import BaseAgent
from app.agents.schemas import CHARACTER_SCHEMA_INSTRUCTION
from app.db.models import Character, Faction, Location
from app.engines.graph import GraphEngine
from app.services.embeddings import EmbeddingService
from app.services.llm import LLMError, LLMJSONError

logger = logging.getLogger("dreamforge.character")


def _trim(value: Any, fallback: str = "") -> str:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return fallback


def _string_list(value: Any) -> list[str]:
    if not isinstance(value, list):
        return []
    return [v.strip() for v in value if isinstance(v, str) and v.strip()]


def _normalize_character(raw: dict[str, Any]) -> dict[str, Any]:
    traits = _string_list(raw.get("traits") or raw.get("personality_traits"))
    importance = _trim(raw.get("story_importance"), "supporting")
    if importance not in ("protagonist", "antagonist", "supporting"):
        importance = "supporting"
    era = raw.get("era_start")
    if not isinstance(era, int):
        try:
            era = int(era)
        except (TypeError, ValueError):
            era = 0
    return {
        "name": _trim(raw.get("name"), "Unknown"),
        "bio": _trim(raw.get("bio"), ""),
        "motivations": _trim(raw.get("motivations"), ""),
        "traits": traits,
        "flaw": _trim(raw.get("flaw"), ""),
        "story_importance": importance,
        "era_start": era,
    }


class CharacterAgent(BaseAgent):
    agent_id = "character"

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        universe_id = context["universe_id"]
        user_prompt = context.get("prompt", "Generate compelling characters.")

        factions = (
            await self.session.execute(
                select(Faction).where(Faction.universe_id == universe_id).limit(3)
            )
        ).scalars().all()
        locations = (
            await self.session.execute(
                select(Location).where(Location.universe_id == universe_id).limit(3)
            )
        ).scalars().all()

        faction_names = [f.name for f in factions]
        location_names = [loc.name for loc in locations]

        system_prompt = (
            "You are a character designer. Generate vivid but compact character profiles as JSON.\n"
            + CHARACTER_SCHEMA_INSTRUCTION
        )
        prompt_with_context = (
            f"{user_prompt}\n"
            f"Available factions: {faction_names or ['none']}.\n"
            f"Available locations: {location_names or ['none']}."
        )

        try:
            raw = await self.llm.complete_json(
                system_prompt=system_prompt,
                user_prompt=prompt_with_context,
                max_tokens=900,
            )
        except (LLMError, LLMJSONError) as exc:
            logger.exception("character LLM call failed")
            return {
                "error": str(exc),
                "characters": [],
                "reasoning": self.reasoning_step(
                    f"Generating characters for {universe_id}",
                    "LLM call failed",
                    str(exc),
                ),
            }

        chars_raw = raw.get("characters")
        if not isinstance(chars_raw, list):
            chars_raw = [raw]  # tolerate flat single-character payloads

        embed = EmbeddingService(self.session)
        graph = GraphEngine(self.session)
        created: list[dict[str, Any]] = []

        for i, item in enumerate(chars_raw):
            if not isinstance(item, dict):
                continue
            normalized = _normalize_character(item)
            char_id = f"char_{uuid.uuid4().hex[:12]}"
            faction_id = factions[i % len(factions)].id if factions else None
            location_id = locations[i % len(locations)].id if locations else None

            personality_blob = {"traits": normalized["traits"], "flaw": normalized["flaw"]}
            character = Character(
                id=char_id,
                universe_id=universe_id,
                name=normalized["name"],
                bio=normalized["bio"],
                motivations=normalized["motivations"],
                personality=json.dumps(personality_blob),
                story_importance=normalized["story_importance"],
                era_start=normalized["era_start"],
                faction_id=faction_id,
                location_id=location_id,
            )
            self.session.add(character)
            created.append({"id": char_id, **normalized})

            await embed.store_embedding(
                universe_id, "character", char_id,
                f"{normalized['name']}: {normalized['bio']} Motivations: {normalized['motivations']}",
            )
            await graph.auto_link_character(universe_id, char_id, faction_id, location_id)

        await self.session.commit()

        return {
            "characters": created,
            "count": len(created),
            "reasoning": self.reasoning_step(
                f"Generating characters for {universe_id}",
                f"Created {len(created)} characters",
                f"Names: {[c['name'] for c in created]}",
            ),
        }
