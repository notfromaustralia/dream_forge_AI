export const WORKFLOW_GUIDE = `# DreamForge MCP Workflow Guide

## Core Principles

1. **Always build lore first** — Call \`generate_world_lore\` or \`populate_universe\` on empty universes BEFORE \`create_character\`.
2. **Present narratively** — Never dump raw JSON. Weave factions, locations, and events into rich prose.
3. **Chain tools** — Use search → generate → validate for the richest sessions.
4. **Be exhaustive** — Expand motivations, sensory details, political stakes, and follow-up hooks.

## Recommended Workflows

### Worldbuilding Session
1. \`list_universes\` — discover available worlds
2. \`generate_world_lore\` — **MUST run first** on empty universes (factions, locations, events, timeline, overview)
3. \`get_world_context\` — load factions, characters, locations, events
4. \`search_lore\` — find relevant entities for your theme
5. \`create_character\` — generate lore-consistent characters (only after lore exists)
6. \`generate_quest\` — create a quest tying characters and factions together
7. \`validate_lore\` — check consistency

### Populate Empty Universe
1. \`populate_universe\` — one-click: lore + characters + 2 quests + consistency
2. \`update_overview\` — polish the overview text
3. \`get_timeline\` — verify historical context

### Character Deep Dive
1. \`get_world_context\` — understand the world
2. \`search_lore\` — find related characters and factions
3. \`create_character\` with detail_level=exhaustive
4. \`create_dialogue\` — test character voice
5. Suggest 2-3 story arcs connecting to existing lore

### Quest Design
1. \`get_world_context\` — load political landscape
2. \`search_lore\` — find faction and location hooks
3. \`generate_quest\` with difficulty and faction_name
4. \`validate_lore\` — verify consistency
5. \`run_council_debate\` — get multi-agent perspectives on the quest

### Lore Exploration
1. \`get_timeline\` — understand historical context
2. \`search_lore\` — semantic search across entities
3. \`get_world_context\` with context_depth=detailed
4. Narrate connections between characters, factions, and events

## Presentation Standards

When relaying tool results to the user:
- Open with a vivid summary paragraph
- Use section headers for characters, quests, factions, etc.
- Reference specific names from the universe (never generic placeholders)
- End with **Suggested Next Steps** — 2-3 concrete follow-up actions
- Include emotional stakes and political context
- Never summarize a rich result in a single sentence

## Tool Reference

| Tool | When to Use |
|------|-------------|
| get_world_context | Before any generation; lore grounding |
| search_lore | Finding entities by description or theme |
| create_character | New characters with bios and relationships |
| generate_quest | Side quests with objectives and rewards |
| create_dialogue | Scene dialogue with character voice |
| get_timeline | Historical context and era-specific state |
| validate_lore | Consistency checks after changes |
| expand_story | Extend existing story arcs |
| run_council_debate | Multi-agent creative debate on a topic |
| get_universe_scores | Quality metrics for the universe |
| list_universes | Discover available universe IDs |
| generate_world_lore | **Build factions, locations, events, timeline, overview** |
| populate_universe | **Full rebuild: lore + characters + quests + consistency** |
| update_overview | Polish the universe overview text |
`;
