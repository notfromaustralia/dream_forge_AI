from typing import Any

from sqlalchemy import select

from app.agents.base import BaseAgent
from app.db.models import Character, Event, Faction


class ConsistencyAgent(BaseAgent):
    agent_id = "consistency"

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        universe_id = context["universe_id"]
        issues: list[dict] = []

        characters = (
            await self.session.execute(select(Character).where(Character.universe_id == universe_id))
        ).scalars().all()
        events = (
            await self.session.execute(select(Event).where(Event.universe_id == universe_id))
        ).scalars().all()
        factions = (
            await self.session.execute(select(Faction).where(Faction.universe_id == universe_id))
        ).scalars().all()

        for char in characters:
            if char.era_end and char.era_start > char.era_end:
                issues.append({
                    "type": "timeline_conflict",
                    "entity": f"character:{char.id}",
                    "message": f"{char.name} era_start ({char.era_start}) is after era_end ({char.era_end})",
                })
            if char.faction_id and not any(f.id == char.faction_id for f in factions):
                issues.append({
                    "type": "broken_reference",
                    "entity": f"character:{char.id}",
                    "message": f"{char.name} references non-existent faction",
                })

        event_years = [e.era_year for e in events]
        if event_years and max(event_years) - min(event_years) > 10000:
            issues.append({
                "type": "timeline_span",
                "entity": "universe",
                "message": "Timeline spans over 10,000 years — verify intentional",
            })

        llm_result = await self.llm.complete_json(
            system_prompt="You are a lore consistency validator. Return JSON with passed, issues, score, notes.",
            user_prompt=f"Validate universe {universe_id}: {len(characters)} characters, {len(events)} events, {len(factions)} factions. Known issues: {issues}",
            demo_key="consistency",
        )

        if issues:
            llm_result["issues"] = issues + llm_result.get("issues", [])
            llm_result["passed"] = len(issues) == 0

        return {
            **llm_result,
            "reasoning": self.reasoning_step(
                f"Validating consistency for {universe_id}",
                f"Checked {len(characters)} characters, {len(events)} events",
                f"Found {len(issues)} issues",
            ),
        }
