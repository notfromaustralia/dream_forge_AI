"""Seed demo data: 5 universes, 50 characters, 20 factions, 100 events."""

import asyncio
import json
import random
import uuid

from sqlalchemy import select

from app.config import get_settings
from app.db.database import async_session, init_db
from app.db.models import (
    Character,
    Event,
    Faction,
    GraphEdge,
    Location,
    MagicSystem,
    Religion,
    Story,
    TimelineEntry,
    Universe,
    User,
)
from app.engines.graph import GraphEngine
from app.evaluation.scorer import EvaluationScorer
from app.services.embeddings import EmbeddingService

UNIVERSES = [
    {
        "id": "uni_dark_fantasy",
        "name": "Ashfall Chronicles",
        "genre": "dark fantasy",
        "prompt": "A dark fantasy world where dragons disappeared 1000 years ago.",
        "overview": "A realm scarred by the Dragonfall, where ember magic fades and shadowy guilds vie for ancient secrets.",
    },
    {
        "id": "uni_scifi",
        "name": "Nebula Drift",
        "genre": "sci-fi",
        "prompt": "A galaxy-spanning civilization on the brink of AI singularity.",
        "overview": "Humanity's last stellar empire navigates wormhole politics and rogue AI factions.",
    },
    {
        "id": "uni_cyberpunk",
        "name": "Neon Veil",
        "genre": "cyberpunk",
        "prompt": "A megacity where corporations own memories and hackers fight for identity.",
        "overview": "Rain-soaked towers hide neural black markets and digital ghosts.",
    },
    {
        "id": "uni_horror",
        "name": "Whispering Hollow",
        "genre": "mythic horror",
        "prompt": "A New England town where folklore creatures are real and hungry.",
        "overview": "Every full moon, the boundary between myth and reality thins to nothing.",
    },
    {
        "id": "uni_solarpunk",
        "name": "Verdant Reach",
        "genre": "solarpunk",
        "prompt": "An optimistic future where communities live in harmony with bio-engineered ecosystems.",
        "overview": "Solar orchards and living architecture sustain a post-scarcity society.",
    },
]

CHARACTER_NAMES = [
    "Lyra Nightwhisper", "Commander Vex", "Elder Thorne", "Mira Solwind", "Kael Driftmark",
    "Zara Neon", "Patch Circuit", "Dr. Elara Voss", "Rook Ashveil", "Sable Thorn",
    "Captain Orion", "Nyx Voidwalker", "Hana Greenweave", "Tomas Reed", "Iris Moonfall",
    "Dax Chrome", "Whisper", "Grandmother Elm", "Felix Storm", "Vera Crypt",
    "Ash Kestrel", "Luna Prism", "Garrick Holt", "Sera Dawn", "Bram Shadow",
    "Cassia Flint", "Dorian Vale", "Elowen Star", "Finn Rook", "Greta Moss",
    "Hugo Wraith", "Inara Bloom", "Jasper Coil", "Kira Null", "Leo Ashford",
    "Maeve Crypt", "Nolan Spire", "Opal Verdant", "Pax Meridian", "Quinn Relay",
    "Rhea Hollow", "Silas Ember", "Talia Wire", "Uma Sol", "Vance Thorn",
    "Wren Circuit", "Xander Drift", "Yara Moss", "Zephyr Null", "Aria Veil",
]

FACTION_TEMPLATES = [
    ("Shadow Guild", "Secrets and espionage", "high"),
    ("Iron Covenant", "Military order", "high"),
    ("Order of the Last Scale", "Preserve ancient lore", "moderate"),
    ("Neon Syndicate", "Corporate hacking", "high"),
    ("Verdant Council", "Ecological harmony", "moderate"),
]

LOCATION_TEMPLATES = [
    ("Veilspire City", "city", "Capital built on ancient foundations"),
    ("Ashfall Peaks", "mountain", "Volcanic range of legends"),
    ("The Sunken Archive", "ruin", "Flooded library of lost knowledge"),
    ("Neon District", "district", "Pulsing heart of the megacity"),
    ("Solar Canopy", "region", "Bio-engineered forest canopy"),
]

EVENT_TITLES = [
    "The Great Cataclysm", "Founding of the Capital", "The Silent War", "Rise of the Syndicate",
    "First Contact", "The Memory Purge", "Harvest Festival", "The Hollow Moon",
    "Wormhole Discovery", "The Green Accord", "Dragonfall Remembrance", "Neural Blackout",
    "Council Dissolution", "The Ember Awakening", "Titan's Wake", "Shadow Accords",
    "The Last Broadcast", "Verdant Bloom", "Cipher Revolution", "Storm of a Thousand Years",
]


async def seed_demo_data() -> None:
    settings = get_settings()
    async with async_session() as db:
        existing = await db.execute(select(Universe).limit(1))
        if existing.scalar_one_or_none():
            return

        user = User(
            id=settings.demo_user_id,
            display_name="Demo Dreamer",
            email="demo@dreamforge.app",
        )
        db.add(user)
        await db.commit()

        embed_svc = EmbeddingService(db)
        graph = GraphEngine(db)
        char_idx = 0

        for uni_data in UNIVERSES:
            universe = Universe(
                id=uni_data["id"],
                user_id=settings.demo_user_id,
                name=uni_data["name"],
                genre=uni_data["genre"],
                prompt=uni_data["prompt"],
                overview=uni_data["overview"],
                status="active",
            )
            db.add(universe)
            await db.commit()

            faction_ids = []
            for i, (name, ideology, power) in enumerate(FACTION_TEMPLATES[:4]):
                fac_id = f"fac_{uni_data['id']}_{i}"
                faction = Faction(
                    id=fac_id,
                    universe_id=uni_data["id"],
                    name=f"{name}" if i < 3 else name,
                    ideology=ideology,
                    power_level=power,
                    territory=f"Region {i+1}",
                    era_start=random.randint(0, 100),
                )
                db.add(faction)
                faction_ids.append(fac_id)
                await embed_svc.store_embedding(uni_data["id"], "faction", fac_id, f"{name}: {ideology}")

            location_ids = []
            for i, (name, loc_type, desc) in enumerate(LOCATION_TEMPLATES[:4]):
                loc_id = f"loc_{uni_data['id']}_{i}"
                location = Location(
                    id=loc_id,
                    universe_id=uni_data["id"],
                    name=name,
                    location_type=loc_type,
                    description=desc,
                    era_start=0,
                )
                db.add(location)
                location_ids.append(loc_id)
                await embed_svc.store_embedding(uni_data["id"], "location", loc_id, f"{name}: {desc}")

            for i in range(10):
                char_id = f"char_{uni_data['id']}_{i}"
                name = CHARACTER_NAMES[char_idx % len(CHARACTER_NAMES)]
                char_idx += 1
                character = Character(
                    id=char_id,
                    universe_id=uni_data["id"],
                    name=name,
                    bio=f"A key figure in the {uni_data['name']} universe, shaped by its unique history.",
                    motivations="Seek truth and power in equal measure",
                    personality=json.dumps({"traits": ["determined", "complex"], "flaw": "ambition"}),
                    story_importance="protagonist" if i == 0 else ("antagonist" if i == 1 else "supporting"),
                    era_start=random.randint(0, 900),
                    era_end=random.choice([None, None, random.randint(950, 1100)]),
                    faction_id=faction_ids[i % len(faction_ids)],
                    location_id=location_ids[i % len(location_ids)],
                )
                db.add(character)
                await graph.auto_link_character(
                    uni_data["id"], char_id,
                    faction_ids[i % len(faction_ids)],
                    location_ids[i % len(location_ids)],
                )
                await embed_svc.store_embedding(
                    uni_data["id"], "character", char_id,
                    f"{name}: A key figure in {uni_data['name']}",
                )

            for i in range(20):
                evt_id = f"evt_{uni_data['id']}_{i}"
                event = Event(
                    id=evt_id,
                    universe_id=uni_data["id"],
                    title=EVENT_TITLES[i % len(EVENT_TITLES)],
                    description=f"A pivotal moment in year {i * 50} of the {uni_data['name']} timeline.",
                    era_year=i * 50,
                    event_type=random.choice(["historical", "cataclysm", "founding", "war"]),
                    impact=random.choice(["moderate", "major", "critical"]),
                )
                db.add(event)
                if i % 3 == 0:
                    char_id = f"char_{uni_data['id']}_{i % 10}"
                    await graph.create_edge(
                        uni_data["id"], "event", evt_id, "character", char_id, "involves", 0.7
                    )

            for year in [0, 250, 500, 750, 1000]:
                db.add(TimelineEntry(
                    id=f"tl_{uni_data['id']}_{year}",
                    universe_id=uni_data["id"],
                    era_year=year,
                    label=f"Era {year}",
                ))

            db.add(Religion(
                id=f"rel_{uni_data['id']}",
                universe_id=uni_data["id"],
                name=f"Faith of {uni_data['name'][:10]}",
                beliefs="Ancient beliefs shaping the culture",
            ))
            db.add(MagicSystem(
                id=f"mag_{uni_data['id']}",
                universe_id=uni_data["id"],
                name=f"Power of {uni_data['genre']}",
                rules_json=json.dumps({"source": "world essence", "cost": "energy"}),
                limitations="Weakened over centuries",
            ))
            db.add(Story(
                id=f"story_{uni_data['id']}",
                universe_id=uni_data["id"],
                title=f"The Chronicles of {uni_data['name']}",
                synopsis=f"An epic tale set in {uni_data['overview'][:100]}",
                arc_type="main",
                status="active",
            ))
            await db.commit()

            scorer = EvaluationScorer(db)
            await scorer.calculate(uni_data["id"])


async def main() -> None:
    await init_db()
    await seed_demo_data()
    print("Demo data seeded successfully.")


if __name__ == "__main__":
    asyncio.run(main())
