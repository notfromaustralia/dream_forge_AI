import json
import logging
import uuid
from typing import Any

from sqlalchemy import select

from app.agents.base import BaseAgent
from app.db.models import Event, Faction, Location, MagicSystem, Religion, TimelineEntry, Universe
from app.demo.responses import get_demo_response
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


def _truncate(value: Any, max_len: int, fallback: str = "") -> str:
    if not isinstance(value, str):
        return fallback
    text = value.strip()
    if not text:
        return fallback
    return text[:max_len]


_VALID_IMPACTS = ("critical", "major", "moderate", "minor")
_VALID_POWER_LEVELS = ("dominant", "high", "major", "moderate", "medium", "low", "minor")


def _normalize_impact(value: Any) -> str:
    """impact column is varchar(32) — must be a short severity label, not a sentence."""
    if not isinstance(value, str):
        return "moderate"
    lower = value.lower().strip()
    for level in _VALID_IMPACTS:
        if level in lower.split():
            return level
    for level in _VALID_IMPACTS:
        if level in lower:
            return level
    if len(lower) <= 32:
        return lower or "moderate"
    return "moderate"


def _normalize_power_level(value: Any) -> str:
    if not isinstance(value, str):
        return "moderate"
    lower = value.lower().strip()
    mapping = {
        "dominant": "dominant",
        "high": "high",
        "major": "major",
        "moderate": "moderate",
        "medium": "moderate",
        "low": "low",
        "minor": "low",
    }
    for key, normalized in mapping.items():
        if key in lower:
            return normalized
    return _truncate(lower, 32, "moderate")


def _normalize_event_type(value: Any) -> str:
    return _truncate(str(value).strip().lower().replace(" ", "_"), 64, "historical") if isinstance(value, str) and value.strip() else "historical"


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

    def _expand_prompts(self, focus: str, genre: str, style: str, audience: str) -> tuple[str, str]:
        base = (
            f"You are a world-building expert expanding an existing {genre} universe "
            f"({style} style, {audience} audience). Return ONLY new incremental JSON. "
            "Do not repeat existing entity names. Be brief: 1-2 sentences per field."
        )
        schemas = {
            "factions": (
                f"{base} You MUST add at least 1 new faction.\n"
                'Return JSON: {"overview_addendum": "<1 paragraph>", '
                '"factions": [{"name":"","ideology":"","power_level":"","territory":"","era_start":0,"era_end":null}]}'
            ),
            "timeline": (
                f"{base} You MUST add at least 1 timeline era and 1 historical event.\n"
                'Return JSON: {"overview_addendum": "<1 paragraph>", '
                '"timeline": [{"era_year":0,"label":""}], '
                '"events": [{"title":"","description":"","era_year":0,"event_type":"historical","impact":"moderate"}]}'
            ),
            "locations": (
                f"{base} You MUST add at least 1 new location.\n"
                'Return JSON: {"overview_addendum": "<1 paragraph>", '
                '"locations": [{"name":"","type":"city","description":"","era_start":0}]}'
            ),
        }
        system = schemas.get(
            focus,
            f"{base}\nReturn JSON with overview_addendum and any new: "
            f"{_LORE_JSON_FIELDS.replace('overview, ', '')}.",
        )
        return system, focus

    async def _persist_lore(
        self,
        universe_id: str,
        data: dict[str, Any],
        embed_svc: EmbeddingService,
        default_era: int = 0,
    ) -> dict[str, list]:
        created: dict[str, list] = {
            "locations": [],
            "factions": [],
            "events": [],
            "timeline": [],
        }

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
                name=_truncate(fac.get("name"), 256, "Unknown Faction"),
                ideology=fac.get("ideology", ""),
                power_level=_normalize_power_level(fac.get("power_level", "moderate")),
                territory=_truncate(fac.get("territory"), 256, ""),
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
            impact_raw = evt.get("impact", "moderate")
            description = evt.get("description", "")
            if isinstance(impact_raw, str) and len(impact_raw) > 32 and impact_raw not in description:
                description = f"{description}\n\n{impact_raw}".strip() if description else impact_raw

            event = Event(
                id=evt_id,
                universe_id=universe_id,
                title=_truncate(evt.get("title"), 256, "Unknown Event"),
                description=description,
                era_year=_parse_era(evt.get("era_year"), fallback_era),
                event_type=_normalize_event_type(evt.get("event_type", "historical")),
                impact=_normalize_impact(impact_raw),
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
            created["timeline"].append(entry.id)

        return created

    async def _load_lore_json(
        self,
        system_prompt: str,
        user_prompt: str,
        *,
        max_tokens: int = 2500,
    ) -> dict[str, Any]:
        try:
            return await self.llm.complete_json(
                system_prompt=system_prompt,
                user_prompt=user_prompt,
                max_tokens=max_tokens,
            )
        except (LLMError, LLMJSONError) as exc:
            logger.warning("lore LLM failed, using demo fallback: %s", exc)
            raw = get_demo_response("universe_lore", user_prompt)
            return json.loads(raw)

    def _needs_lore_fallback(self, created: dict[str, list]) -> bool:
        return not (
            created.get("factions")
            and created.get("locations")
            and created.get("timeline")
        )

    async def _merge_demo_lore(
        self,
        universe_id: str,
        prompt: str,
        embed_svc: EmbeddingService,
        existing: dict[str, list],
    ) -> dict[str, list]:
        """Fill missing factions/locations/timeline from demo template when LLM output was sparse."""
        raw = get_demo_response("universe_lore", prompt)
        fallback = json.loads(raw)

        faction_names = {
            f.name
            for f in (
                await self.session.execute(select(Faction).where(Faction.universe_id == universe_id))
            ).scalars().all()
        }
        location_names = {
            loc.name
            for loc in (
                await self.session.execute(select(Location).where(Location.universe_id == universe_id))
            ).scalars().all()
        }
        timeline_labels = {
            t.label
            for t in (
                await self.session.execute(select(TimelineEntry).where(TimelineEntry.universe_id == universe_id))
            ).scalars().all()
        }

        filtered: dict[str, Any] = {"overview": fallback.get("overview", "")}
        if not existing.get("factions"):
            filtered["factions"] = [
                f for f in fallback.get("factions", [])
                if isinstance(f, dict) and f.get("name") not in faction_names
            ]
        if not existing.get("locations"):
            filtered["locations"] = [
                loc for loc in fallback.get("locations", [])
                if isinstance(loc, dict) and loc.get("name") not in location_names
            ]
        if not existing.get("timeline"):
            filtered["timeline"] = [
                tl for tl in fallback.get("timeline", [])
                if isinstance(tl, dict) and tl.get("label") not in timeline_labels
            ]
        if not existing.get("events"):
            filtered["events"] = fallback.get("events", [])

        merged = await self._persist_lore(universe_id, filtered, embed_svc)
        for key in existing:
            existing[key] = existing.get(key, []) + merged.get(key, [])
        return existing

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
            system_prompt, _ = self._expand_prompts(focus, genre, style, audience)

            try:
                data = await self._load_lore_json(
                    system_prompt=system_prompt,
                    user_prompt=(
                        f"Expansion request: {prompt}\n\n"
                        f"Focus area: {focus}\n\n"
                        f"Existing world (do not duplicate these names):\n{existing}"
                    ),
                    max_tokens=1800,
                )
            except (LLMError, LLMJSONError) as exc:
                logger.exception("lore expand LLM call failed")
                return {
                    "error": str(exc),
                    "overview": "",
                    "created": {"locations": [], "factions": [], "events": [], "timeline": []},
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

            summary_parts = []
            if created["factions"]:
                summary_parts.append(f"{len(created['factions'])} factions")
            if created["locations"]:
                summary_parts.append(f"{len(created['locations'])} locations")
            if created["events"]:
                summary_parts.append(f"{len(created['events'])} events")
            if created["timeline"]:
                summary_parts.append(f"{len(created['timeline'])} timeline eras")
            summary = ", ".join(summary_parts) or "no new entities"

            return {
                "overview": addendum,
                "created": created,
                "reasoning": self.reasoning_step(
                    f"Expanding lore for universe {universe_id}",
                    f"Added {summary}",
                    f"Focus: {focus}",
                ),
            }

        system_prompt = (
            f"You are a world-building expert. Generate {genre} world lore "
            f"in a {style} style for a {audience} audience. "
            "Return valid JSON only. Requirements:\n"
            "- overview: 2-3 sentences setting the world\n"
            "- locations: at least 3 entries with name, type, description\n"
            f"- {_FACTION_SCHEMA}\n"
            "- events: at least 2 with title, description, era_year, event_type (short slug e.g. war/founding), "
            "impact (ONLY one of: critical, major, moderate, minor — not a sentence)\n"
            "- timeline: at least 3 eras with era_year and label\n"
            "- religions: 1 entry, magic_systems: 1 entry"
        )
        user_prompt = (
            f"Create world lore for: {prompt}\n"
            f"Return JSON with keys: {_LORE_JSON_FIELDS}."
        )

        data = await self._load_lore_json(system_prompt, user_prompt, max_tokens=2800)

        embed_svc = EmbeddingService(self.session)
        created = await self._persist_lore(universe_id, data, embed_svc)

        if self._needs_lore_fallback(created):
            logger.info("lore sparse after LLM — merging demo fallback entities")
            created = await self._merge_demo_lore(universe_id, prompt, embed_svc, created)
            if not data.get("overview"):
                data["overview"] = json.loads(get_demo_response("universe_lore", prompt)).get("overview", "")

        overview = data.get("overview", "")
        if overview:
            universe = await self.session.get(Universe, universe_id)
            if universe and not universe.overview:
                universe.overview = overview

        await self.session.commit()

        return {
            "overview": overview,
            "created": created,
            "reasoning": self.reasoning_step(
                f"Generating lore for universe {universe_id}",
                "Created locations, factions, events, religions, magic, timeline",
                (
                    f"Created {len(created['locations'])} locations, "
                    f"{len(created['factions'])} factions, "
                    f"{len(created['timeline'])} timeline eras"
                ),
            ),
        }
