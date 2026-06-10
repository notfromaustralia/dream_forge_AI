import json

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import (
    Character,
    EvaluationScore,
    Event,
    Faction,
    GraphEdge,
    Location,
    MagicSystem,
    Religion,
    Story,
    Universe,
)


class EvaluationScorer:
    def __init__(self, session: AsyncSession) -> None:
        self.session = session

    async def _count(self, model, universe_id: str) -> int:
        result = await self.session.execute(
            select(func.count()).select_from(model).where(model.universe_id == universe_id)
        )
        return result.scalar() or 0

    async def calculate(self, universe_id: str) -> dict:
        char_count = await self._count(Character, universe_id)
        fac_count = await self._count(Faction, universe_id)
        loc_count = await self._count(Location, universe_id)
        evt_count = await self._count(Event, universe_id)
        story_count = await self._count(Story, universe_id)
        rel_count = await self._count(Religion, universe_id)
        magic_count = await self._count(MagicSystem, universe_id)

        edge_result = await self.session.execute(
            select(func.count()).select_from(GraphEdge).where(GraphEdge.universe_id == universe_id)
        )
        edge_count = edge_result.scalar() or 0

        completeness_checks = {
            "has_geography": loc_count >= 1,
            "has_characters": char_count >= 3,
            "has_factions": fac_count >= 2,
            "has_timeline": evt_count >= 2,
            "has_magic_or_religion": magic_count >= 1 or rel_count >= 1,
            "has_stories": story_count >= 1,
        }
        completeness = sum(completeness_checks.values()) / len(completeness_checks) * 100

        entity_total = char_count + fac_count + loc_count + evt_count + story_count
        diversity = min(100, (fac_count + loc_count) / max(entity_total, 1) * 200)
        narrative_depth = min(100, story_count * 15 + char_count * 3)
        creativity = (diversity + narrative_depth) / 2

        max_edges = max(entity_total * 2, 1)
        graph_density = min(100, edge_count / max_edges * 100)
        wow_factor = (graph_density + min(100, char_count * 5)) / 2

        consistency = 85.0
        if char_count > 0 and fac_count > 0:
            consistency = min(98, 70 + fac_count * 5 + evt_count * 2)

        details = {
            "completeness_checks": completeness_checks,
            "counts": {
                "characters": char_count,
                "factions": fac_count,
                "locations": loc_count,
                "events": evt_count,
                "stories": story_count,
                "graph_edges": edge_count,
            },
        }

        universe = await self.session.get(Universe, universe_id)
        if universe:
            universe.consistency_score = consistency
            universe.creativity_score = creativity
            universe.completeness_score = completeness
            universe.wow_score = wow_factor

        score_row = EvaluationScore(
            universe_id=universe_id,
            consistency=consistency,
            creativity=creativity,
            completeness=completeness,
            wow_factor=wow_factor,
            details_json=json.dumps(details),
        )
        self.session.add(score_row)
        await self.session.commit()

        return {
            "consistency": round(consistency, 1),
            "creativity": round(creativity, 1),
            "completeness": round(completeness, 1),
            "wow_factor": round(wow_factor, 1),
            "details": details,
        }
