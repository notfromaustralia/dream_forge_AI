import { z } from "zod";
import { config } from "./config.js";

export const DetailLevelSchema = z
  .enum(["concise", "standard", "exhaustive"])
  .optional()
  .default("exhaustive");

export const UniverseIdSchema = z
  .string()
  .optional()
  .default(config.defaultUniverse);

const baseFields = {
  universe_id: UniverseIdSchema,
  detail_level: DetailLevelSchema,
};

export const CreateCharacterSchema = z.object({
  ...baseFields,
  prompt: z.string().optional().default("Create an interesting character"),
});

export const GenerateQuestSchema = z.object({
  ...baseFields,
  prompt: z.string().optional().default(""),
  faction_name: z.string().optional(),
  difficulty: z.enum(["easy", "medium", "hard", "epic"]).optional(),
});

export const SearchLoreSchema = z.object({
  universe_id: UniverseIdSchema,
  query: z.string().min(1, "Query cannot be empty"),
  limit: z.number().int().min(1).max(50).optional().default(10),
  entity_types: z
    .array(z.enum(["character", "faction", "location", "event", "item"]))
    .optional(),
});

export const CreateDialogueSchema = z.object({
  ...baseFields,
  character_ids: z.array(z.string()).optional().default([]),
  scene: z.string().min(1, "Scene description cannot be empty"),
  tone: z
    .enum(["dramatic", "comedic", "tense", "romantic", "neutral"])
    .optional(),
  length: z.enum(["short", "medium", "long"]).optional().default("medium"),
});

export const GetWorldContextSchema = z.object({
  universe_id: UniverseIdSchema,
  include_timeline: z.boolean().optional().default(false),
  context_depth: z
    .enum(["minimal", "standard", "detailed"])
    .optional()
    .default("standard"),
});

export const ListUniversesSchema = z.object({});

export const GetTimelineSchema = z.object({
  universe_id: UniverseIdSchema,
  era_year: z.number().int().optional(),
});

export const ValidateLoreSchema = z.object({
  universe_id: UniverseIdSchema,
});

export const ExpandStorySchema = z.object({
  ...baseFields,
  prompt: z.string().optional().default("Expand the current story arc"),
});

export const GetUniverseScoresSchema = z.object({
  universe_id: UniverseIdSchema,
});

export const RunCouncilDebateSchema = z.object({
  ...baseFields,
  topic: z.string().min(1, "Topic cannot be empty"),
  context: z.string().optional().default(""),
});

export const GetWorkflowGuideSchema = z.object({});

export const GenerateWorldLoreSchema = z.object({
  universe_id: UniverseIdSchema,
  prompt: z.string().optional().default(""),
  genre: z.string().optional(),
  detail_level: DetailLevelSchema,
});

export const PopulateUniverseSchema = z.object({
  universe_id: UniverseIdSchema,
  prompt: z.string().optional().default(""),
  genre: z.string().optional(),
  character_prompt: z.string().optional().default("Create compelling characters for this world"),
  quest_count: z.number().int().min(1).max(5).optional().default(2),
  detail_level: DetailLevelSchema,
});

export const UpdateOverviewSchema = z.object({
  universe_id: UniverseIdSchema,
  overview: z.string().min(1, "Overview cannot be empty"),
});

export const toolSchemas = {
  create_character: CreateCharacterSchema,
  generate_quest: GenerateQuestSchema,
  get_world_context: GetWorldContextSchema,
  search_lore: SearchLoreSchema,
  create_dialogue: CreateDialogueSchema,
  list_universes: ListUniversesSchema,
  get_timeline: GetTimelineSchema,
  validate_lore: ValidateLoreSchema,
  expand_story: ExpandStorySchema,
  get_universe_scores: GetUniverseScoresSchema,
  run_council_debate: RunCouncilDebateSchema,
  get_workflow_guide: GetWorkflowGuideSchema,
  generate_world_lore: GenerateWorldLoreSchema,
  populate_universe: PopulateUniverseSchema,
  update_overview: UpdateOverviewSchema,
} as const;
