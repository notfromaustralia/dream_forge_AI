import json
import copy


DEMO_RESPONSES: dict[str, dict] = {
    "universe_lore": {
        "overview": "A dark fantasy realm where dragons vanished a millennium ago, leaving power vacuums and ancient mysteries.",
        "locations": [
            {"name": "Ashfall Peaks", "type": "mountain", "description": "Volcanic range where the last dragon was sighted."},
            {"name": "Veilspire City", "type": "city", "description": "Capital built on dragonbone foundations."},
            {"name": "The Sunken Archive", "type": "ruin", "description": "Flooded library holding pre-Dragonfall knowledge."},
        ],
        "factions": [
            {"name": "Shadow Guild", "ideology": "Control through secrets and espionage", "power_level": "high", "territory": "Veilspire undercity"},
            {"name": "Order of the Last Scale", "ideology": "Preserve dragon lore and prevent their return", "power_level": "moderate", "territory": "Ashfall Peaks"},
            {"name": "Iron Covenant", "ideology": "Military expansion and order", "power_level": "high", "territory": "Eastern provinces"},
        ],
        "religions": [
            {"name": "Cult of the Vanished Flame", "beliefs": "Dragons ascended and will return to judge the unworthy."},
        ],
        "magic_systems": [
            {"name": "Ember Weaving", "rules": {"source": "residual dragon essence", "cost": "physical exhaustion"}, "limitations": "Weakened since the Dragonfall"},
        ],
        "events": [
            {"title": "The Dragonfall", "description": "All dragons vanished in a single night of fire.", "era_year": 0, "event_type": "cataclysm", "impact": "critical"},
            {"title": "Founding of Veilspire", "description": "Survivors built a new capital from dragon remains.", "era_year": 50, "event_type": "founding", "impact": "major"},
        ],
        "timeline": [
            {"era_year": 0, "label": "The Dragonfall"},
            {"era_year": 50, "label": "Founding of Veilspire"},
            {"era_year": 500, "label": "Shadow Guild rises"},
            {"era_year": 1000, "label": "Present Era"},
        ],
    },
    "universe_lore_contemporary": {
        "overview": "A contemporary Botswana where indigenous hunter-gatherer traditions and pastoral lifeways coexist with tricycle cooperatives, Uber gig work, drought cycles, and contested sacred trails.",
        "locations": [
            {"name": "Gaborone Mall District", "type": "city", "description": "Peri-urban commercial hub where tricycle blockades meet Uber recruitment vans."},
            {"name": "Kalahari Fringe Settlements", "type": "region", "description": "Semi-arid edge communities practicing foraging and drought survival."},
            {"name": "Okavango Delta Edge", "type": "wetland", "description": "Eco-tourism corridor and water-rights battleground."},
            {"name": "Maun Tricycle Depot", "type": "town", "description": "Worker-owned repair yards and cooperative dispatch center."},
        ],
        "factions": [
            {"name": "The Tricycle Collective", "ideology": "Local mobility sovereignty through worker-owned transport", "power_level": "high", "territory": "Township routes and peri-urban corridors"},
            {"name": "Uber Botswana Expansion Desk", "ideology": "Efficiency, scale, and smartphone-accessible rides", "power_level": "high", "territory": "Gaborone and Francistown"},
            {"name": "The Foragers' Covenant", "ideology": "Land is kin; foraging rights are sacred law", "power_level": "moderate", "territory": "Kalahari fringe and sacred trails"},
            {"name": "The Cattle Keepers' League", "ideology": "Cattle wealth and grazing rights define authority", "power_level": "moderate", "territory": "Pastoral posts and cattle routes"},
            {"name": "The Delta Guides' Brotherhood", "ideology": "Protect wetlands while sustaining ethical tourism", "power_level": "moderate", "territory": "Okavango Delta edge"},
            {"name": "The Township Hustle Crew", "ideology": "Survival through remixing tradition with street enterprise", "power_level": "moderate", "territory": "Township markets and food-cart lanes"},
        ],
        "religions": [
            {"name": "Ancestors of the Songlines", "beliefs": "Sacred trails and foraging grounds hold the memory of the land."},
        ],
        "magic_systems": [
            {"name": "Plant Medicine Knowledge", "rules": {"source": "generational forager training", "cost": "time and elder mentorship"}, "limitations": "Threatened by land fencing and drought."},
        ],
        "events": [
            {"title": "Tricycle Cooperative Founding", "description": "Workers formalize shared repair shops and cargo routes.", "era_year": 2010, "event_type": "founding", "impact": "major"},
            {"title": "Uber Market Entry", "description": "Rideshare apps arrive in Gaborone, triggering price wars.", "era_year": 2018, "event_type": "economic", "impact": "major"},
            {"title": "The Great Drought", "description": "Water scarcity forces foragers and drivers to share routes.", "era_year": 2023, "event_type": "environmental", "impact": "critical"},
            {"title": "Sacred Trail Blockade", "description": "Foragers blockade a proposed road through a songline path.", "era_year": 2024, "event_type": "conflict", "impact": "major"},
        ],
        "timeline": [
            {"era_year": 2010, "label": "Tricycle cooperatives rise"},
            {"era_year": 2018, "label": "Uber enters Botswana"},
            {"era_year": 2023, "label": "Great drought begins"},
            {"era_year": 2024, "label": "Sacred trail conflict"},
            {"era_year": 2025, "label": "Present day"},
        ],
    },
    "characters": {
        "characters": [
            {
                "name": "Lyra Nightwhisper",
                "bio": "A rogue archivist who steals forbidden texts from the Shadow Guild.",
                "motivations": "Uncover the truth about the Dragonfall",
                "personality": {"traits": ["cunning", "curious", "secretive"], "flaw": "trust issues"},
                "story_importance": "protagonist",
                "era_start": 980,
            },
            {
                "name": "Commander Vex Ironhold",
                "bio": "Iron Covenant war leader seeking dragonbone weapons.",
                "motivations": "Unite the realm under military order",
                "personality": {"traits": ["ruthless", "strategic", "honorable"], "flaw": "pride"},
                "story_importance": "antagonist",
                "era_start": 960,
            },
            {
                "name": "Elder Thorne Ashveil",
                "bio": "Last keeper of the Order of the Last Scale.",
                "motivations": "Prevent dragons from returning",
                "personality": {"traits": ["wise", "patient", "cryptic"], "flaw": "fatalism"},
                "story_importance": "mentor",
                "era_start": 800,
            },
        ]
    },
    "characters_contemporary": {
        "characters": [
            {
                "name": "Naledi Kgosana",
                "bio": "Elder tracker and plant-medicine specialist of the Foragers' Covenant on the Kalahari fringe.",
                "motivations": "Protect foraging rights and pass knowledge to the next generation",
                "personality": {"traits": ["wise", "steadfast", "observant"], "flaw": "rigid about tradition"},
                "story_importance": "mentor",
                "era_start": 2020,
            },
            {
                "name": "Thabo Molefe",
                "bio": "Tricycle mechanic and cooperative organizer who keeps cargo fleets running through drought.",
                "motivations": "Build worker-owned mobility that outlasts corporate rideshare",
                "personality": {"traits": ["practical", "charismatic", "defiant"], "flaw": "overextends himself"},
                "story_importance": "protagonist",
                "era_start": 2022,
            },
            {
                "name": "Amantle Keitumetse",
                "bio": "Uber driver torn between sign-up bonuses and loyalty to the Tricycle Collective.",
                "motivations": "Support her family without betraying her community",
                "personality": {"traits": ["resourceful", "conflicted", "quick-witted"], "flaw": "avoids hard choices"},
                "story_importance": "supporting",
                "era_start": 2023,
            },
        ]
    },
    "quest": {
        "title": "Whispers in the Undercity",
        "synopsis": "The Shadow Guild has intercepted a coded message about a hidden dragon egg. Infiltrate their vault beneath Veilspire to recover it before Commander Vex does.",
        "objectives": [
            "Gain entry to the Shadow Guild vault",
            "Decode the ancient dragon cipher",
            "Choose: destroy the egg, protect it, or deliver it to the Order",
        ],
        "rewards": "Ancient Ember Weaving technique, Shadow Guild reputation shift",
        "involved_characters": ["Lyra Nightwhisper", "Commander Vex Ironhold"],
        "involved_locations": ["Veilspire City", "The Sunken Archive"],
    },
    "quest_contemporary": {
        "title": "Water Routes Under Drought",
        "synopsis": "During a severe drought, the Tricycle Collective must negotiate shared water-carrying routes with Foragers' Covenant elders while Uber drivers serve peri-urban townships.",
        "objectives": [
            "Map dry-season wells along sacred trails",
            "Resolve a sabotaged tricycle convoy near Gaborone",
            "Decide whether to accept Uber subcontracting or remain fully independent",
        ],
        "rewards": "Cooperative reputation, forager trust, and access to mongongo nut trade routes",
        "involved_characters": ["Thabo Molefe", "Naledi Kgosana", "Amantle Keitumetse"],
        "involved_locations": ["Gaborone Mall District", "Kalahari Fringe Settlements"],
    },
    "dialogue": {
        "lines": [
            {"speaker": "Lyra Nightwhisper", "text": "The Guild doesn't guard secrets—they hoard them. Tonight, we take back what they stole from history."},
            {"speaker": "Elder Thorne Ashveil", "text": "Child, some doors were sealed for a reason. The Vanished Flame still watches."},
            {"speaker": "Lyra Nightwhisper", "text": "Then let them watch. I'd rather face dragons than ignorance."},
        ],
        "scene_summary": "Lyra confronts Elder Thorne before infiltrating the Shadow Guild vault.",
    },
    "consistency": {
        "passed": True,
        "issues": [],
        "score": 0.92,
        "notes": "Timeline consistent. Character motivations align with faction ideologies.",
    },
    "council": {
        "debate": [
            {"agent": "character_agent", "stance": "Lyra should ally with the Order temporarily", "reasoning": "Her arc requires mentorship before the vault heist."},
            {"agent": "narrative_agent", "stance": "Introduce a betrayal twist", "reasoning": "A Shadow Guild defector adds tension and moral ambiguity."},
            {"agent": "consistency_agent", "stance": "Ensure Ember Weaving rules are respected", "reasoning": "Lyra cannot use powerful magic without exhaustion cost."},
        ],
        "consensus": "Proceed with vault heist arc: Lyra gains Order alliance, encounters defector, pays Ember Weaving cost during climax.",
    },
    "story": {
        "title": "The Last Ember",
        "synopsis": "As dragon essence fades from the world, Lyra races to find the final source of Ember Weaving before the Iron Covenant weaponizes it.",
        "arc_type": "main",
        "plot_points": ["Discovery of fading magic", "Race to Sunken Archive", "Confrontation at Ashfall Peaks"],
    },
}

CONTEMPORARY_KEYWORDS = {
    "botswana", "gaborone", "tricycle", "uber", "forager", "foraging",
    "hunter-gatherer", "pastoral", "seswaa", "bogobe", "morogo", "mongongo",
    "contemporary", "realism", "cooperative", "drought", "sacred trail",
}


def _is_contemporary_prompt(user_prompt: str) -> bool:
    lower = user_prompt.lower()
    return sum(1 for kw in CONTEMPORARY_KEYWORDS if kw in lower) >= 2


def _resolve_demo_key(key: str, user_prompt: str) -> str:
    if _is_contemporary_prompt(user_prompt):
        contemporary = f"{key}_contemporary"
        if contemporary in DEMO_RESPONSES:
            return contemporary
    return key


def _wrap_with_prompt(data: dict, user_prompt: str) -> dict:
    if not user_prompt.strip():
        return data

    result = copy.deepcopy(data)
    setting_note = user_prompt.strip()[:500]

    if "overview" in result:
        result["overview"] = f"{setting_note}\n\n{result['overview']}"

    return result


def get_demo_response(key: str, user_prompt: str = "") -> str:
    resolved_key = _resolve_demo_key(key, user_prompt)
    data = DEMO_RESPONSES.get(resolved_key)
    if data is None:
        data = {"content": user_prompt, "generated": True}
    else:
        data = _wrap_with_prompt(data, user_prompt)
    return json.dumps(data)
