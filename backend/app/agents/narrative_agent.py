"""Narrative generation: stories, quests, dialogues."""

from __future__ import annotations

import json
import logging
import uuid
from typing import Any

from sqlalchemy import select

from app.agents.base import BaseAgent
from app.agents.schemas import (
    DIALOGUE_SCHEMA_INSTRUCTION,
    QUEST_SCHEMA_INSTRUCTION,
    STORY_SCHEMA_INSTRUCTION,
)
from app.db.models import Character, Event, Faction, Location, Story, Universe
from app.services.embeddings import EmbeddingService
from app.services.llm import LLMError, LLMJSONError

logger = logging.getLogger("dreamforge.narrative")


def _trim(value: Any, fallback: str = "Untitled") -> str:
    if isinstance(value, str) and value.strip():
        return value.strip()
    return fallback


def _ensure_string_list(value: Any) -> list[str]:
    """Flatten the LLM output into plain strings, tolerating object items."""
    if not isinstance(value, list):
        return []
    out: list[str] = []
    for item in value:
        if isinstance(item, str) and item.strip():
            out.append(item.strip())
        elif isinstance(item, dict):
            text = (
                item.get("description")
                or item.get("text")
                or item.get("name")
                or item.get("step")
            )
            if isinstance(text, str) and text.strip():
                out.append(text.strip())
    return out


def _normalize_story(data: dict[str, Any]) -> dict[str, Any]:
    return {
        "kind": "story",
        "title": _trim(data.get("title"), "Untitled Story"),
        "synopsis": _trim(data.get("synopsis"), ""),
        "setting": _trim(data.get("setting"), ""),
        "characters": [
            {
                "name": _trim(c.get("name"), "Unknown"),
                "role": _trim(c.get("role"), ""),
            }
            for c in (data.get("characters") or [])
            if isinstance(c, dict)
        ],
        "beats": [
            {
                "label": _trim(b.get("label"), ""),
                "text": _trim(b.get("text"), ""),
            }
            for b in (data.get("beats") or [])
            if isinstance(b, dict) and (b.get("text") or b.get("label"))
        ],
        "themes": _ensure_string_list(data.get("themes")),
    }


def _normalize_quest(data: dict[str, Any]) -> dict[str, Any]:
    return {
        "kind": "quest",
        "title": _trim(data.get("title"), "Untitled Quest"),
        "synopsis": _trim(data.get("synopsis"), ""),
        "questGiver": _trim(data.get("questGiver") or data.get("quest_giver"), ""),
        "objectives": _ensure_string_list(data.get("objectives")),
        "obstacles": [
            {
                "name": _trim(o.get("name"), "Unknown"),
                "description": _trim(o.get("description"), ""),
            }
            for o in (data.get("obstacles") or [])
            if isinstance(o, dict)
        ],
        "rewards": _ensure_string_list(data.get("rewards")),
        "locations": _ensure_string_list(data.get("locations")),
    }


def _normalize_dialogue(data: dict[str, Any]) -> dict[str, Any]:
    return {
        "kind": "dialogue",
        "title": _trim(data.get("title"), "A Scene"),
        "synopsis": _trim(data.get("synopsis"), ""),
        "setting": _trim(data.get("setting"), ""),
        "characters": [
            {
                "name": _trim(c.get("name"), "Unknown"),
                "role": _trim(c.get("role"), ""),
            }
            for c in (data.get("characters") or [])
            if isinstance(c, dict)
        ],
        "lines": [
            {
                "character": _trim(line.get("character"), "Unknown"),
                "line": _trim(line.get("line") or line.get("text"), ""),
            }
            for line in (data.get("dialogue") or data.get("lines") or [])
            if isinstance(line, dict)
        ],
    }


class NarrativeAgent(BaseAgent):
    agent_id = "narrative"

    async def _build_world_context(self, universe_id: str) -> str:
        universe = await self.session.get(Universe, universe_id)
        overview = universe.overview if universe else ""

        factions = (
            await self.session.execute(
                select(Faction).where(Faction.universe_id == universe_id).limit(5)
            )
        ).scalars().all()
        characters = (
            await self.session.execute(
                select(Character).where(Character.universe_id == universe_id).limit(5)
            )
        ).scalars().all()
        locations = (
            await self.session.execute(
                select(Location).where(Location.universe_id == universe_id).limit(5)
            )
        ).scalars().all()
        events = (
            await self.session.execute(
                select(Event)
                .where(Event.universe_id == universe_id)
                .order_by(Event.era_year.desc())
                .limit(3)
            )
        ).scalars().all()

        faction_lines = [
            f"- {f.name} ({f.power_level}): {f.ideology[:120]}; territory: {f.territory}"
            for f in factions
        ]
        char_lines = [f"- {c.name}: {c.bio[:100]}" for c in characters]
        loc_lines = [f"- {loc.name}: {loc.description[:80]}" for loc in locations]
        event_lines = [f"- {e.title} (year {e.era_year}): {e.description[:80]}" for e in events]

        return (
            f"World overview: {overview[:500]}\n"
            f"Factions:\n{chr(10).join(faction_lines) or '- none'}\n"
            f"Characters:\n{chr(10).join(char_lines) or '- none'}\n"
            f"Locations:\n{chr(10).join(loc_lines) or '- none'}\n"
            f"Recent events:\n{chr(10).join(event_lines) or '- none'}"
        )

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        universe_id = context["universe_id"]
        intent = context.get("intent", "story")
        user_prompt = context.get("prompt", "")

        if intent == "quest":
            schema = QUEST_SCHEMA_INSTRUCTION
            normalize = _normalize_quest
            arc_type = "side"
            max_tokens = 900
        elif intent == "dialogue":
            schema = DIALOGUE_SCHEMA_INSTRUCTION
            normalize = _normalize_dialogue
            arc_type = "scene"
            max_tokens = 900
        elif intent == "expand_story":
            schema = STORY_SCHEMA_INSTRUCTION
            normalize = _normalize_story
            arc_type = "main"
            max_tokens = 2200
        else:
            schema = STORY_SCHEMA_INSTRUCTION
            normalize = _normalize_story
            arc_type = "main"
            max_tokens = 2200

        world_context = await self._build_world_context(universe_id)
        prompt_with_context = (
            f"{user_prompt or f'Generate a {intent}.'}\n\n"
            f"--- Existing world context (stay consistent) ---\n{world_context}"
        )

        system_prompt = (
            "You are a vivid storyteller. Generate narrative content as JSON. "
            "Write actual prose — scenes, action, and dialogue — not just summaries. "
            "Use the provided world context — reference real factions, characters, and locations.\n"
            + schema
        )

        try:
            raw = await self.llm.complete_json(
                system_prompt=system_prompt,
                user_prompt=prompt_with_context,
                max_tokens=max_tokens,
            )
        except (LLMError, LLMJSONError) as exc:
            logger.exception("narrative LLM call failed")
            return {
                "error": str(exc),
                "reasoning": self.reasoning_step(
                    f"Generating {intent}",
                    "LLM call failed",
                    str(exc),
                ),
            }

        story = normalize(raw)

        story_id = f"story_{uuid.uuid4().hex[:12]}"
        if intent != "dialogue":
            row = Story(
                id=story_id,
                universe_id=universe_id,
                title=story["title"],
                synopsis=story["synopsis"],
                content_json=json.dumps(story),
                arc_type=arc_type,
                status="draft",
            )
            self.session.add(row)
            await self.session.commit()

            embed = EmbeddingService(self.session)
            await embed.store_embedding(
                universe_id, "story", story_id,
                f"{story['title']}: {story['synopsis']}",
            )

        return {
            "story_id": story_id if intent != "dialogue" else None,
            "title": story["title"],
            "data": story,
            "reasoning": self.reasoning_step(
                f"Generating {intent} for {universe_id}",
                f"Normalized {intent} payload",
                f"Title: {story['title']}",
            ),
        }
