import json


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


def get_demo_response(key: str, user_prompt: str = "") -> str:
    data = DEMO_RESPONSES.get(key, {"content": user_prompt, "generated": True})
    return json.dumps(data)
