"""AI World Council — multi-persona debate without mutating universe entities."""

from __future__ import annotations

import logging
from typing import Any

from sqlalchemy import select

from app.agents.base import BaseAgent
from app.db.models import Character, Event, Faction, Location, Universe
from app.services.llm import LLMError, LLMJSONError

logger = logging.getLogger("dreamforge.council")

PERSONAS = [
    {
        "id": "lore_keeper",
        "title": "Lore Keeper",
        "role": "Historian who defends canonical facts, cultures, and established power structures.",
    },
    {
        "id": "story_architect",
        "title": "Story Architect",
        "role": "Narrative designer who pushes for drama, character arcs, and compelling consequences.",
    },
    {
        "id": "continuity_judge",
        "title": "Continuity Judge",
        "role": "Editor who flags contradictions, timeline issues, and lore-breaking proposals.",
    },
]


class CouncilAgent(BaseAgent):
    agent_id = "council"

    async def _build_world_context(self, universe_id: str) -> str:
        universe = await self.session.get(Universe, universe_id)
        if not universe:
            return ""

        factions = (
            await self.session.execute(
                select(Faction).where(Faction.universe_id == universe_id).limit(8)
            )
        ).scalars().all()
        characters = (
            await self.session.execute(
                select(Character).where(Character.universe_id == universe_id).limit(8)
            )
        ).scalars().all()
        locations = (
            await self.session.execute(
                select(Location).where(Location.universe_id == universe_id).limit(8)
            )
        ).scalars().all()
        events = (
            await self.session.execute(
                select(Event)
                .where(Event.universe_id == universe_id)
                .order_by(Event.era_year.desc())
                .limit(6)
            )
        ).scalars().all()

        lines = [
            f"Universe: {universe.name}",
            f"Genre: {universe.genre} | Style: {universe.style}",
            f"Overview: {universe.overview[:800]}",
            "Factions: " + ", ".join(f"{f.name} ({f.power_level})" for f in factions) or "none",
            "Characters: " + ", ".join(c.name for c in characters) or "none",
            "Locations: " + ", ".join(loc.name for loc in locations) or "none",
            "Recent events: "
            + ", ".join(f"{e.title} (year {e.era_year})" for e in events)
            or "none",
        ]
        return "\n".join(lines)

    async def _debate_persona(
        self,
        persona: dict[str, str],
        topic: str,
        world_context: str,
        extra_context: str,
        prior_arguments: list[dict[str, str]],
    ) -> dict[str, str]:
        prior_text = ""
        if prior_arguments:
            prior_text = "\n\nPrior council arguments:\n" + "\n".join(
                f"- {a['title']}: {a['stance']} — {a['reasoning'][:200]}"
                for a in prior_arguments
            )

        system_prompt = (
            f"You are the {persona['title']} on an AI World Council for a fictional universe. "
            f"{persona['role']} "
            "Debate the topic from your perspective using ONLY the provided world context. "
            "Return JSON: {\"stance\": \"<your position in one sentence>\", "
            "\"reasoning\": \"<2-4 sentences citing specific world details>\"}"
        )
        user_prompt = (
            f"Topic: {topic}\n\n"
            f"World context:\n{world_context}\n"
            f"{f'Additional context: {extra_context}' if extra_context else ''}"
            f"{prior_text}"
        )

        try:
            raw = await self.llm.complete_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=400,
                temperature=0.7,
            )
        except (LLMError, LLMJSONError) as exc:
            logger.warning("council persona %s failed: %s", persona["id"], exc)
            return {
                "agent": persona["id"],
                "title": persona["title"],
                "stance": "Unable to form a position (LLM unavailable).",
                "reasoning": str(exc),
            }

        stance = raw.get("stance") if isinstance(raw.get("stance"), str) else "No stance returned."
        reasoning = raw.get("reasoning") if isinstance(raw.get("reasoning"), str) else ""
        return {
            "agent": persona["id"],
            "title": persona["title"],
            "stance": stance.strip(),
            "reasoning": reasoning.strip(),
        }

    async def _synthesize_consensus(
        self,
        topic: str,
        world_context: str,
        debate: list[dict[str, str]],
    ) -> str:
        arguments = "\n".join(
            f"{d['title']}: {d['stance']}\n  Reasoning: {d['reasoning']}"
            for d in debate
        )
        try:
            raw = await self.llm.complete_json(
                system_prompt=(
                    "You are the Council Moderator. Synthesize a clear, actionable consensus "
                    "from the council debate. Reference the universe context. "
                    'Return JSON: {"consensus": "<2-4 sentences with a recommended direction>"}'
                ),
                user_prompt=(
                    f"Topic: {topic}\n\nWorld:\n{world_context[:600]}\n\nDebate:\n{arguments}"
                ),
                max_tokens=300,
                temperature=0.5,
            )
            consensus = raw.get("consensus")
            if isinstance(consensus, str) and consensus.strip():
                return consensus.strip()
        except (LLMError, LLMJSONError) as exc:
            logger.warning("council consensus failed: %s", exc)

        return (
            "The council could not reach a synthesized consensus. "
            "Review individual arguments and decide based on your creative priorities."
        )

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        universe_id = context["universe_id"]
        topic = context.get("topic", "What should happen next in this world?")
        extra_context = context.get("context", "")

        world_context = await self._build_world_context(universe_id)
        debate: list[dict[str, str]] = []

        for persona in PERSONAS:
            argument = await self._debate_persona(
                persona, topic, world_context, extra_context, debate
            )
            debate.append(argument)

        consensus = await self._synthesize_consensus(topic, world_context, debate)

        return {
            "topic": topic,
            "debate": debate,
            "consensus": consensus,
            "reasoning": self.reasoning_step(
                f"Council debate on: {topic}",
                f"Collected {len(debate)} arguments",
                consensus[:120],
            ),
        }
