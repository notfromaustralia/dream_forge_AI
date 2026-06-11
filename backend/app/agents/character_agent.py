import json
import uuid
from typing import Any

from sqlalchemy import select

from app.agents.base import BaseAgent
from app.db.models import Character, Faction, Location, Universe
from app.engines.graph import GraphEngine
from app.services.embeddings import EmbeddingService
from app.services.portrait import generate_character_portrait


class CharacterAgent(BaseAgent):
    agent_id = "character"

    async def run(self, context: dict[str, Any]) -> dict[str, Any]:
        universe_id = context["universe_id"]
        prompt = context.get("prompt", "Generate compelling characters")

        factions = (
            await self.session.execute(select(Faction).where(Faction.universe_id == universe_id).limit(3))
        ).scalars().all()
        locations = (
            await self.session.execute(select(Location).where(Location.universe_id == universe_id).limit(3))
        ).scalars().all()

        faction_names = [f.name for f in factions]
        location_names = [loc.name for loc in locations]

        data = await self.llm.complete_json(
            system_prompt="You are a character creation expert. Generate characters as JSON with a 'characters' array.",
            user_prompt=f"{prompt}. Available factions: {faction_names}. Available locations: {location_names}.",
            demo_key="characters_contemporary" if any(
                kw in prompt.lower() for kw in ("botswana", "tricycle", "uber", "forager", "gaborone")
            ) else "characters",
        )

        embed_svc = EmbeddingService(self.session)
        graph = GraphEngine(self.session)
        created_ids: list[str] = []
        created_characters: list[dict] = []

        for i, char_data in enumerate(data.get("characters", [])):
            char_id = f"char_{uuid.uuid4().hex[:12]}"
            faction_id = factions[i % len(factions)].id if factions else None
            location_id = locations[i % len(locations)].id if locations else None

            character = Character(
                id=char_id,
                universe_id=universe_id,
                name=char_data.get("name", "Unknown"),
                bio=char_data.get("bio", ""),
                motivations=char_data.get("motivations", ""),
                personality=json.dumps(char_data.get("personality", {})),
                story_importance=char_data.get("story_importance", "supporting"),
                era_start=char_data.get("era_start", 0),
                faction_id=faction_id,
                location_id=location_id,
            )
            self.session.add(character)
            created_ids.append(char_id)
            created_characters.append({
                "id": char_id,
                "name": char_data.get("name", "Unknown"),
                "bio": char_data.get("bio", ""),
                "motivations": char_data.get("motivations", ""),
                "personality": char_data.get("personality", {}),
                "story_importance": char_data.get("story_importance", "supporting"),
                "era_start": char_data.get("era_start", 0),
                "faction_id": faction_id,
                "location_id": location_id,
            })
            await embed_svc.store_embedding(
                universe_id, "character", char_id,
                f"{char_data.get('name')}: {char_data.get('bio', '')} Motivations: {char_data.get('motivations', '')}",
            )
            await graph.auto_link_character(universe_id, char_id, faction_id, location_id)

        await self.session.commit()

        universe = await self.session.get(Universe, universe_id)
        if universe:
            for char_id in created_ids:
                character = await self.session.get(Character, char_id)
                if character:
                    try:
                        await generate_character_portrait(self.session, character, universe)
                    except Exception:
                        character.portrait_status = "fallback"
                        await self.session.commit()

        return {
            "character_ids": created_ids,
            "characters": created_characters,
            "count": len(created_ids),
            "reasoning": self.reasoning_step(
                f"Generating characters for {universe_id}",
                f"Created {len(created_ids)} characters with faction/location links",
                f"Character IDs: {created_ids}",
            ),
        }
