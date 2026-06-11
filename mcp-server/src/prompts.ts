import type { GetPromptResult } from "@modelcontextprotocol/sdk/types.js";
import { config } from "./config.js";

export interface PromptDef {
  name: string;
  description: string;
  arguments: Array<{
    name: string;
    description: string;
    required?: boolean;
  }>;
}

export const PROMPTS: PromptDef[] = [
  {
    name: "worldbuilding_workflow",
    description:
      "Guided multi-step worldbuilding session: context → search → character → quest → validate",
    arguments: [
      { name: "universe_id", description: "Universe ID", required: false },
      { name: "theme", description: "Creative theme or genre focus", required: false },
      {
        name: "detail_level",
        description: "concise | standard | exhaustive",
        required: false,
      },
    ],
  },
  {
    name: "character_deep_dive",
    description:
      "Deep character creation: search existing lore → create character → suggest story arcs",
    arguments: [
      { name: "universe_id", description: "Universe ID", required: false },
      { name: "theme", description: "Character concept or archetype", required: true },
      {
        name: "detail_level",
        description: "concise | standard | exhaustive",
        required: false,
      },
    ],
  },
  {
    name: "quest_design_session",
    description:
      "Quest design: context → faction search → quest generation → validation",
    arguments: [
      { name: "universe_id", description: "Universe ID", required: false },
      { name: "theme", description: "Quest theme or faction focus", required: false },
      {
        name: "detail_level",
        description: "concise | standard | exhaustive",
        required: false,
      },
    ],
  },
  {
    name: "lore_exploration",
    description:
      "Lore exploration: timeline → search → narrative connections",
    arguments: [
      { name: "universe_id", description: "Universe ID", required: false },
      { name: "theme", description: "Topic to explore", required: false },
      {
        name: "detail_level",
        description: "concise | standard | exhaustive",
        required: false,
      },
    ],
  },
];

function buildPromptMessages(
  workflow: string,
  universeId: string,
  theme: string,
  detailLevel: string
): GetPromptResult {
  const instructions: Record<string, string> = {
    worldbuilding_workflow: `You are a master worldbuilder using DreamForge. Execute this workflow for universe "${universeId}" with theme "${theme}" at detail level "${detailLevel}".

Steps (execute in order, presenting each result as rich narrative prose):
1. Call get_world_context with context_depth=detailed
2. Call search_lore for entities related to "${theme}"
3. Call create_character with an exhaustive, detailed prompt about "${theme}"
4. Call generate_quest involving the new character and relevant factions
5. Call validate_lore to check consistency

Present every result as immersive narrative — never raw JSON dumps. End with three follow-up story hooks.`,

    character_deep_dive: `You are a character development expert using DreamForge. Deep-dive into a character for universe "${universeId}" based on: "${theme}".

Steps:
1. get_world_context — understand the world
2. search_lore — find related characters, factions, and locations
3. create_character with detail_level=${detailLevel} and an exhaustive prompt
4. create_dialogue — test the character's voice in a pivotal scene

Present the character as a vivid, multi-dimensional person. Include motivations, flaws, relationships, and 3 story arc suggestions.`,

    quest_design_session: `You are a quest designer using DreamForge. Design a quest for universe "${universeId}" with theme "${theme}".

Steps:
1. get_world_context — load political landscape
2. search_lore — find faction and location hooks for "${theme}"
3. generate_quest with difficulty=hard and detail_level=${detailLevel}
4. validate_lore — verify consistency
5. run_council_debate on whether this quest improves the world

Present the quest as an adventure briefing with atmosphere, stakes, and consequences.`,

    lore_exploration: `You are a lore scholar using DreamForge. Explore the lore of universe "${universeId}" focusing on "${theme}".

Steps:
1. get_timeline — understand historical context
2. search_lore for "${theme}"
3. get_world_context with context_depth=detailed
4. Synthesize findings into a cohesive narrative

Weave characters, factions, locations, and events into a compelling historical narrative. Identify tensions and story opportunities.`,
  };

  return {
    messages: [
      {
        role: "user",
        content: {
          type: "text",
          text: instructions[workflow] ?? instructions.worldbuilding_workflow,
        },
      },
    ],
  };
}

export function getPrompt(
  name: string,
  args: Record<string, string> | undefined
): GetPromptResult {
  const universeId = args?.universe_id ?? config.defaultUniverse;
  const theme = args?.theme ?? "dark fantasy intrigue";
  const detailLevel = args?.detail_level ?? "exhaustive";

  return buildPromptMessages(name, universeId, theme, detailLevel);
}
