import json
import logging
import uuid
from typing import Any

from sqlalchemy import select

from app.agents.base import BaseAgent
from app.db.models import Event, Faction, Location, MagicSystem, Religion, TimelineEntry, Universe
from app.services.embeddings import EmbeddingService
from app.services.llm import LLMError, LLMJSONError

logger = logging.getLogger("dreamforge.lore")

_FACTION_SCHEMA = (
    "factions(name,ideology,power_level,territory,era_start,era_end) — "
    "always include 2-3 factions with distinct ideologies"
)
_LORE_JSON_FIELDS = (
    "overview, locations(name,type,description), "
    f"{_FACTION_SCHEMA}, "
    "religions(name,beliefs), magic_systems(name,rules,limitations), "
    "events(title,description,era_year,event_type,impact), timeline(era_year,label)"
)


def _parse_era(value: Any, default: int = 0) -> int:
    if isinstance(value, int):
        return value
    try:
        return int(value)
    except (TypeError, ValueError):
        return default


class LoreAgent(BaseAgent):
    agent_id = "lore"

    async def _existing_context(self, universe_id: str) -> str:
        universe = await self.session.get(Universe, universe_id)
        factions = (
            await self.session.execute(select(Faction).where(Faction.universe_id == universe_id))
        ).scalars().all()
        locations = (
            await self.session.execute(select(Location).where(Location.universe_id == universe_id))
        ).scalars().all()
        events = (
            await self.session.execute(select(Event).where(Event.universe_id == universe_id))
        ).scalars().all()
        timeline = (
            await self.session.execute(select(TimelineEntry).where(TimelineEntry.universe_id == universe_id))
        ).scalars().all()

        return (
            f"Current overview: {universe.overview if universe else ''}\n"
            f"Existing factions: {[f.name for f in factions]}\n"
            f"Existing locations: {[loc.name for loc in locations]}\n"
            f"Existing events: {[e.title for e in events]}\n"
            f"Timeline eras: {[(t.era_year, t.label) for t in timeline]}"
        )

    async def _persist_lore(
        self,
        universe_id: str,
        data: dict[str, Any],
        embed_svc: EmbeddingService,
        default_era: int = 0,
    ) -> dict[str, list]:
        created: dict[str, list] = {"locations": [], "factions": [], "events": []}

        timeline_years = [
            _parse_era(tl.get("era_year"), default_era)
            for tl in (data.get("timeline") or [])
            if isinstance(tl, dict)
        ]
        fallback_era = min(timeline_years) if timeline_years else default_era

        for loc in data.get("locations", []):
            if not isinstance(loc, dict):
                continue
            loc_id = f"loc_{uuid.uuid4().hex[:12]}"
            location = Location(
                id=loc_id,
                universe_id=universe_id,
                name=loc.get("name", "Unknown"),
                location_type=loc.get("type", "city"),
                description=loc.get("description", ""),
                era_start=_parse_era(loc.get("era_start"), fallback_era),
                era_end=loc.get("era_end"),
            )
            self.session.add(location)
            created["locations"].append(loc_id)
            await embed_svc.store_embedding(
                universe_id, "location", loc_id,
                f"{loc.get('name')}: {loc.get('description', '')}",
            )

        for fac in data.get("factions", []):
            if not isinstance(fac, dict):
                continue
            fac_id = f"fac_{uuid.uuid4().hex[:12]}"
            era_start = _parse_era(fac.get("era_start"), fallback_era)
            era_end = fac.get("era_end")
            faction = Faction(
                id=fac_id,
                universe_id=universe_id,
                name=fac.get("name", "Unknown Faction"),
                ideology=fac.get("ideology", ""),
                power_level=fac.get("power_level", "moderate"),
                territory=fac.get("territory", ""),
                era_start=era_start,
                era_end=era_end if era_end is not None else None,
            )
            self.session.add(faction)
            created["factions"].append(fac_id)
            await embed_svc.store_embedding(
                universe_id, "faction", fac_id,
                f"{fac.get('name')}: {fac.get('ideology', '')}",
            )

        for rel in data.get("religions", []):
            if not isinstance(rel, dict):
                continue
            religion = Religion(
                id=f"rel_{uuid.uuid4().hex[:12]}",
                universe_id=universe_id,
                name=rel.get("name", "Unknown Faith"),
                beliefs=rel.get("beliefs", ""),
            )
            self.session.add(religion)

        for magic in data.get("magic_systems", []):
            if not isinstance(magic, dict):
                continue
            ms = MagicSystem(
                id=f"mag_{uuid.uuid4().hex[:12]}",
                universe_id=universe_id,
                name=magic.get("name", "Unknown Magic"),
                rules_json=json.dumps(magic.get("rules", {})),
                limitations=magic.get("limitations", ""),
            )
            self.session.add(ms)

        for evt in data.get("events", []):
            if not isinstance(evt, dict):
                continue
            evt_id = f"evt_{uuid.uuid4().hex[:12]}"
            event = Event(
                id=evt_id,
                universe_id=universe_id,
                title=evt.get("title", "Unknown Event"),
                description=evt.get("description", ""),
                era_year=_parse_era(evt.get("era_year"), fallback_era),
                event_type=evt.get("event_type", "historical"),
                impact=evt.get("impact", "moderate"),
            )
            self.session.add(event)
            created["events"].append(evt_id)
            await embed_svc.store_embedding(
                universe_id, "event", evt_id,
                f"{evt.get('title')}: {evt.get('description', '')}",
            )

        for tl in data.get("timeline", []):
            if not isinstance(tl, dict):
                continue
            entry = TimelineEntry(
                id=f"tl_{uuid.uuid4().hex[:12]}",
                universe_id=universe_id,
                era_year=_parse_era(tl.get("era_year"), fallback_era),
                label=tl.get("label", "Era"),
            )
            self.session.add(entry)

        return created

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        universe_id = context["universe_id"]
        prompt = context.get("prompt", "")
        genre = context.get("genre", "fantasy")
        style = context.get("style", "epic")
        audience = context.get("audience", "general")
        mode = context.get("mode", "create")
        focus = context.get("focus", "all")

        if mode == "expand":
            existing = await self._existing_context(universe_id)
            focus_hint = {
                "factions": "Only add new factions and update overview_addendum.",
                "timeline": "Only add new timeline entries and events.",
                "locations": "Only add new locations.",
                "all": "Add any new entities that fit the expansion request.",
            }.get(focus, "Add any new entities that fit the expansion request.")

            try:
                data = await self.llm.complete_json(
                    system_prompt=(
                        f"You are a world-building expert expanding an existing {genre} universe "
                        f"({style} style, {audience} audience). Return ONLY new incremental content as JSON. "
                        "Do not repeat existing entity names. Be brief: 1-2 sentences per field.\n"
                        f"Return JSON with: overview_addendum (1 paragraph), "
                        f"and optionally new {_LORE_JSON_FIELDS.replace('overview, ', '')}."
                    ),
                    user_prompt=(
                        f"Expansion request: {prompt}\n\n"
                        f"Focus: {focus_hint}\n\n"
                        f"Existing world:\n{existing}"
                    ),
                )
            except (LLMError, LLMJSONError) as exc:
                logger.exception("lore expand LLM call failed")
                return {
                    "error": str(exc),
                    "overview": "",
                    "created": {"locations": [], "factions": [], "events": []},
                    "reasoning": self.reasoning_step(
                        f"Expanding lore for {universe_id}",
                        "LLM call failed",
                        str(exc),
                    ),
                }

            embed_svc = EmbeddingService(self.session)
            created = await self._persist_lore(universe_id, data, embed_svc)

            addendum = data.get("overview_addendum", "")
            if addendum:
                universe = await self.session.get(Universe, universe_id)
                if universe:
                    universe.overview = f"{universe.overview}\n\n{addendum}".strip()
            await self.session.commit()

            return {
                "overview": addendum,
                "created": created,
                "reasoning": self.reasoning_step(
                    f"Expanding lore for universe {universe_id}",
                    f"Added {len(created['factions'])} factions, {len(created['events'])} events",
                    f"Focus: {focus}",
                ),
            }

        try:
            data = await self.llm.complete_json(
                system_prompt=(
                    f"You are a world-building expert. Generate concise {genre} world lore "
                    f"in a {style} style for a {audience} audience. "
                    "Be brief: 1-2 sentences per field, max 3 items per array. "
                    f"Always include {_FACTION_SCHEMA}."
                ),
                user_prompt=(
                    f"Create world lore for: {prompt}. "
                    f"Return JSON with: {_LORE_JSON_FIELDS}."
                ),
            )
        except (LLMError, LLMJSONError) as exc:
            logger.exception("lore LLM call failed")
            return {
                "error": str(exc),
                "overview": "",
                "created": {"locations": [], "factions": [], "events": []},
                "reasoning": self.reasoning_step(
                    f"Generating lore for {universe_id}",
                    "LLM call failed",
                    str(exc),
                ),
            }

        embed_svc = EmbeddingService(self.session)
        created = await self._persist_lore(universe_id, data, embed_svc)
        await self.session.commit()

        return {
            "overview": data.get("overview", ""),
            "created": created,
            "reasoning": self.reasoning_step(
                f"Generating lore for universe {universe_id}",
                "Created locations, factions, events, religions, magic, timeline",
                f"Created {len(created['locations'])} locations, {len(created['factions'])} factions",
            ),
        }
