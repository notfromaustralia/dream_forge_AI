import { zodToJsonSchema } from "zod-to-json-schema";
import type { z } from "zod";
import { toolSchemas } from "../schemas.js";

interface ToolDef {
  name: keyof typeof toolSchemas;
  description: string;
}

const TOOL_DEFS: ToolDef[] = [
  {
    name: "create_character",
    description: `Create a new character in a DreamForge universe with AI-generated bio, motivations, and relationships.

Features:
- Generates consistent backstory within world lore
- Creates personality traits aligned with universe themes
- Establishes potential relationships with existing characters
- Provides hooks for future quests and conflicts
- Fetches full character bios after creation for rich output

Example prompts:
- "A rogue knight who betrayed their order for love"
- "A merchant who secretly runs the thieves' guild"
- "An oracle whose prophecies always come true, but with terrible consequences"`,
  },
  {
    name: "generate_quest",
    description: `Generate a lore-consistent side quest for a DreamForge universe.

The quest will:
- Respect existing faction relationships and world history
- Include clear objectives, rewards, and complications
- Provide hooks for future adventures
- Balance challenge level with narrative impact

Quest types include: fetch, rescue, investigation, escort, defense, infiltration, and more.
Use difficulty (easy/medium/hard/epic) and detail_level for richer output.`,
  },
  {
    name: "get_world_context",
    description: `Get comprehensive, condensed lore context for a universe.

Returns:
- Active factions and their relationships
- Key characters with recent activity
- Major locations and geographic features
- Recent historical events and timeline
- Current conflicts and tensions
- Available story hooks

Use this before generating any new content to ensure lore consistency.
Use context_depth (minimal/standard/detailed) to control presentation richness.`,
  },
  {
    name: "search_lore",
    description: `Semantic and graph-based search across universe lore.

Can find:
- Characters by description, traits, or relationships
- Factions by ideology, territory, or allies/enemies
- Locations by geography, significance, or history
- Events by date, participants, or consequences
- Connections between any lore elements

Uses hybrid search combining vector similarity and knowledge graph traversal.`,
  },
  {
    name: "create_dialogue",
    description: `Generate natural, character-appropriate dialogue for a scene.

Features:
- Maintains character voice and speaking patterns
- Reflects character knowledge and biases
- Advances scene objectives or reveals information
- Includes stage directions and emotional context
- Fetches character bios for voice consistency

Useful for cutscenes, NPC interactions, or testing character dynamics.`,
  },
  {
    name: "list_universes",
    description: `List all available DreamForge universes. Use this to discover valid universe_id values before calling other tools.`,
  },
  {
    name: "get_timeline",
    description: `Get the historical timeline for a universe, or a point-in-time world state at a specific era_year.

Use for temporal grounding before generating era-specific content.`,
  },
  {
    name: "validate_lore",
    description: `Run consistency validation on a universe. Checks timeline, character motivations, faction ideologies, and lore rules.`,
  },
  {
    name: "expand_story",
    description: `Expand an existing story arc with new plot points, complications, and character development. Use detail_level for richer output.`,
  },
  {
    name: "get_universe_scores",
    description: `Get quality evaluation scores for a universe: consistency, creativity, completeness, and wow factor.`,
  },
  {
    name: "run_council_debate",
    description: `Run a multi-agent World Council debate on a creative topic. Returns perspectives from Character, Narrative, and Consistency agents plus a consensus recommendation.`,
  },
  {
    name: "get_workflow_guide",
    description: `Get the DreamForge workflow guide with best practices for lore-grounded, descriptive AI-assisted worldbuilding. Call this when starting a creative session.`,
  },
  {
    name: "generate_world_lore",
    description: `Build world lore for an existing universe: factions, locations, events, religions, magic systems, timeline entries, and overview text.

CRITICAL: Always call this BEFORE create_character on empty or sparse universes.
Creates the foundation that Time Machine, Graph, and quest generation depend on.`,
  },
  {
    name: "populate_universe",
    description: `Full world rebuild for an existing universe via orchestrated pipeline: lore → characters → 2 quests → consistency.

Use when a universe has characters but no factions, locations, events, or quests.
Returns SSE stream aggregated into a full summary.`,
  },
  {
    name: "update_overview",
    description: `Update the universe overview text. Use to polish or refine the world primer after generation.`,
  },
];

function schemaToInputSchema(schema: z.ZodObject<z.ZodRawShape>) {
  const jsonSchema = zodToJsonSchema(schema, {
    target: "openApi3",
    $refStrategy: "none",
  }) as Record<string, unknown>;

  delete jsonSchema.$schema;
  return jsonSchema;
}

export const TOOLS = TOOL_DEFS.map(({ name, description }) => ({
  name,
  description,
  inputSchema: schemaToInputSchema(toolSchemas[name]),
}));

export const TOOL_NAMES = TOOL_DEFS.map((t) => t.name);
