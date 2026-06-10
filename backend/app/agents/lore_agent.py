import logging
import uuid
from typing import Any

from app.agents.base import BaseAgent
from app.db.models import Event, Faction, Location, MagicSystem, Religion, TimelineEntry
from app.services.embeddings import EmbeddingService
from app.services.llm import LLMError, LLMJSONError

logger = logging.getLogger("dreamforge.lore")


class LoreAgent(BaseAgent):
    agent_id = "lore"

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        universe_id = context["universe_id"]
        prompt = context.get("prompt", "")
        genre = context.get("genre", "fantasy")

        try:
            data = await self.llm.complete_json(
                system_prompt=f"You are a world-building expert. Generate concise {genre} world lore as JSON. Be brief: 1-2 sentences per field, max 3 items per array.",
                user_prompt=f"Create world lore for: {prompt}. Return JSON with: overview, locations(name,type,description), factions(name,ideology,power_level,territory), religions(name,beliefs), magic_systems(name,rules,limitations), events(title,description,era_year,event_type,impact), timeline(era_year,label).",
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
        created: dict[str, list] = {"locations": [], "factions": [], "events": []}

        for loc in data.get("locations", []):
            loc_id = f"loc_{uuid.uuid4().hex[:12]}"
            location = Location(
                id=loc_id,
                universe_id=universe_id,
                name=loc.get("name", "Unknown"),
                location_type=loc.get("type", "city"),
                description=loc.get("description", ""),
            )
            self.session.add(location)
            created["locations"].append(loc_id)
            await embed_svc.store_embedding(universe_id, "location", loc_id, f"{loc.get('name')}: {loc.get('description', '')}")

        for fac in data.get("factions", []):
            fac_id = f"fac_{uuid.uuid4().hex[:12]}"
            faction = Faction(
                id=fac_id,
                universe_id=universe_id,
                name=fac.get("name", "Unknown Faction"),
                ideology=fac.get("ideology", ""),
                power_level=fac.get("power_level", "moderate"),
                territory=fac.get("territory", ""),
            )
            self.session.add(faction)
            created["factions"].append(fac_id)
            await embed_svc.store_embedding(universe_id, "faction", fac_id, f"{fac.get('name')}: {fac.get('ideology', '')}")

        for rel in data.get("religions", []):
            religion = Religion(
                id=f"rel_{uuid.uuid4().hex[:12]}",
                universe_id=universe_id,
                name=rel.get("name", "Unknown Faith"),
                beliefs=rel.get("beliefs", ""),
            )
            self.session.add(religion)

        for magic in data.get("magic_systems", []):
            import json
            ms = MagicSystem(
                id=f"mag_{uuid.uuid4().hex[:12]}",
                universe_id=universe_id,
                name=magic.get("name", "Unknown Magic"),
                rules_json=json.dumps(magic.get("rules", {})),
                limitations=magic.get("limitations", ""),
            )
            self.session.add(ms)

        for evt in data.get("events", []):
            evt_id = f"evt_{uuid.uuid4().hex[:12]}"
            event = Event(
                id=evt_id,
                universe_id=universe_id,
                title=evt.get("title", "Unknown Event"),
                description=evt.get("description", ""),
                era_year=evt.get("era_year", 0),
                event_type=evt.get("event_type", "historical"),
                impact=evt.get("impact", "moderate"),
            )
            self.session.add(event)
            created["events"].append(evt_id)
            await embed_svc.store_embedding(universe_id, "event", evt_id, f"{evt.get('title')}: {evt.get('description', '')}")

        for tl in data.get("timeline", []):
            entry = TimelineEntry(
                id=f"tl_{uuid.uuid4().hex[:12]}",
                universe_id=universe_id,
                era_year=tl.get("era_year", 0),
                label=tl.get("label", "Era"),
            )
            self.session.add(entry)

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
