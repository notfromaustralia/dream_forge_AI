"""Strict JSON schemas for generated content.

These shapes are baked into LLM system prompts AND into the database
normalization layer, so frontend can rely on a stable contract.
"""

STORY_SCHEMA_INSTRUCTION = """\
Return ONLY a JSON object with this exact shape:
{
  "title": "string (3-8 words)",
  "synopsis": "string (2-3 sentences summarizing the story)",
  "setting": "string (1-2 sentences describing world/location/era)",
  "characters": [{"name": "string", "role": "string (one phrase)"}],
  "beats": [
    {"label": "Introduction", "text": "string (3-5 sentences of actual narrative prose; describe scenes, action, and dialogue)"},
    {"label": "Conflict",     "text": "string (3-5 sentences of actual narrative prose)"},
    {"label": "Climax",       "text": "string (3-5 sentences of actual narrative prose)"},
    {"label": "Resolution",   "text": "string (3-5 sentences of actual narrative prose)"}
  ],
  "themes": ["string", "string"]
}
CRITICAL: Each beat must contain FULL NARRATIVE PROSE — actual scenes with vivid description, character action, and short dialogue snippets where natural. Do NOT just summarize what happens. WRITE the story. 3-4 characters total. No nested objects beyond what is shown."""

QUEST_SCHEMA_INSTRUCTION = """\
Return ONLY a JSON object with this exact shape:
{
  "title": "string (3-8 words)",
  "synopsis": "string (1-2 sentences)",
  "questGiver": "string (name + one-phrase description)",
  "objectives": ["string (imperative sentence)", "string", "string"],
  "obstacles": [
    {"name": "string", "description": "string (one sentence)"}
  ],
  "rewards": ["string", "string"],
  "locations": ["string", "string"]
}
Exactly 3 objectives, 2-3 obstacles, 2-3 rewards. Keep all text SHORT. No nested objects beyond what is shown."""

CHARACTER_SCHEMA_INSTRUCTION = """\
Return ONLY a JSON object with this exact shape:
{
  "characters": [
    {
      "name": "string (full name)",
      "bio": "string (2-3 sentences)",
      "motivations": "string (one sentence)",
      "traits": ["string", "string", "string"],
      "flaw": "string (one phrase)",
      "story_importance": "protagonist" | "antagonist" | "supporting",
      "era_start": 0
    }
  ]
}
Generate exactly 3 characters. Keep text SHORT. No nested objects beyond what is shown."""

DIALOGUE_SCHEMA_INSTRUCTION = """\
Return ONLY a JSON object with this exact shape:
{
  "title": "string (scene title)",
  "synopsis": "string (one sentence describing the scene)",
  "setting": "string (one sentence)",
  "characters": [{"name": "string", "role": "string"}],
  "dialogue": [
    {"character": "string (name)", "line": "string (a single spoken line)"}
  ]
}
6-10 dialogue lines. Keep each line under 25 words."""
