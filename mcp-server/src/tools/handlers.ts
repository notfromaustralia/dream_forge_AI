import { z } from "zod";
import { apiCall, consumeSSE, fetchCharacters } from "../api-client.js";
import { config, logger, metrics } from "../config.js";
import { enrichPrompt, enrichSearchQuery } from "../enrichers.js";
import { formatToolResponse } from "../formatters/index.js";
import { WORKFLOW_GUIDE } from "../guide.js";
import {
  CreateCharacterSchema,
  CreateDialogueSchema,
  ExpandStorySchema,
  GenerateQuestSchema,
  GenerateWorldLoreSchema,
  GetTimelineSchema,
  GetUniverseScoresSchema,
  GetWorldContextSchema,
  GetWorkflowGuideSchema,
  ListUniversesSchema,
  PopulateUniverseSchema,
  RunCouncilDebateSchema,
  SearchLoreSchema,
  UpdateOverviewSchema,
  ValidateLoreSchema,
} from "../schemas.js";
import type { ApiError, FormatContext, ToolResult } from "../types.js";
import { TOOL_NAMES } from "./definitions.js";

export async function handleToolCall(
  name: string,
  args: Record<string, unknown> | undefined,
  startTime: number
): Promise<ToolResult> {
  logger.info(`Tool called: ${name}`, args);

  if (config.enableMetrics) {
    metrics.recordToolCall(name);
  }

  try {
    const { result, universeId, formatCtx } = await executeTool(name, args);
    const duration = Date.now() - startTime;
    logger.info(`Tool ${name} completed in ${duration}ms`);

    const ctx: FormatContext = {
      universeId,
      durationMs: duration,
      ...formatCtx,
    };

    return {
      content: [
        {
          type: "text",
          text: formatToolResponse(name, result, ctx),
        },
      ],
    };
  } catch (error) {
    return handleToolError(name, error, startTime);
  }
}

async function executeTool(
  name: string,
  args: Record<string, unknown> | undefined
): Promise<{
  result: unknown;
  universeId: string;
  formatCtx: Partial<FormatContext>;
}> {
  let result: unknown;
  let universeId = config.defaultUniverse;
  const formatCtx: Partial<FormatContext> = {};

  switch (name) {
    case "create_character": {
      const validated = CreateCharacterSchema.parse(args);
      universeId = validated.universe_id;
      const prompt = enrichPrompt(validated.prompt, {
        detailLevel: validated.detail_level,
      });
      const apiResult = (await apiCall(
        `/universes/${universeId}/generate/character`,
        "POST",
        { prompt }
      )) as Record<string, unknown>;

      const characterIds = apiResult.character_ids as string[] | undefined;
      if (characterIds?.length) {
        formatCtx.characters = await fetchCharacters(universeId, characterIds);
      }
      result = apiResult;
      break;
    }

    case "generate_quest": {
      const validated = GenerateQuestSchema.parse(args);
      universeId = validated.universe_id;
      const prompt = enrichPrompt(validated.prompt, {
        detailLevel: validated.detail_level,
        difficulty: validated.difficulty,
        factionName: validated.faction_name,
      });
      try {
        formatCtx.worldContext = (await apiCall(
          `/universes/${universeId}/context`
        )) as Record<string, unknown>;
      } catch {
        // non-fatal
      }
      result = await apiCall(`/universes/${universeId}/generate/quest`, "POST", {
        prompt,
        faction_name: validated.faction_name,
      });
      break;
    }

    case "get_world_context": {
      const validated = GetWorldContextSchema.parse(args);
      universeId = validated.universe_id;
      const apiResult = (await apiCall(
        `/universes/${universeId}/context`
      )) as Record<string, unknown>;

      result = {
        ...apiResult,
        _presentation_hint: enrichPrompt("", {
          contextDepth: validated.context_depth,
          detailLevel: "exhaustive",
        }),
        _metadata: {
          generated_at: new Date().toISOString(),
          universe_id: universeId,
          include_timeline: validated.include_timeline,
          context_depth: validated.context_depth,
        },
      };

      if (validated.include_timeline) {
        try {
          const timeline = await apiCall(`/universes/${universeId}/timeline`);
          (result as Record<string, unknown>).timeline = timeline;
        } catch {
          // non-fatal
        }
      }
      break;
    }

    case "search_lore": {
      const validated = SearchLoreSchema.parse(args);
      universeId = validated.universe_id;
      const enrichedQuery = enrichSearchQuery(
        validated.query,
        validated.entity_types
      );
      const apiResult = (await apiCall(
        `/universes/${universeId}/search`,
        "POST",
        { query: enrichedQuery, limit: validated.limit }
      )) as { results?: unknown[]; query?: string };

      const results = apiResult.results ?? [];
      result = {
        results,
        query: validated.query,
        result_count: results.length,
        _metadata: { enriched_query: enrichedQuery },
      };
      break;
    }

    case "create_dialogue": {
      const validated = CreateDialogueSchema.parse(args);
      universeId = validated.universe_id;
      const enrichedScene = enrichPrompt(validated.scene, {
        detailLevel: validated.detail_level,
        tone: validated.tone,
        length: validated.length,
      });

      if (validated.character_ids.length) {
        formatCtx.characters = await fetchCharacters(
          universeId,
          validated.character_ids
        );
      }

      result = await apiCall(
        `/universes/${universeId}/generate/dialogue`,
        "POST",
        {
          character_ids: validated.character_ids,
          scene: enrichedScene,
        }
      );
      break;
    }

    case "list_universes": {
      ListUniversesSchema.parse(args);
      result = await apiCall("/universes");
      universeId = config.defaultUniverse;
      break;
    }

    case "get_timeline": {
      const validated = GetTimelineSchema.parse(args);
      universeId = validated.universe_id;
      if (validated.era_year !== undefined) {
        result = await apiCall(
          `/universes/${universeId}/timeline/at/${validated.era_year}`
        );
      } else {
        result = await apiCall(`/universes/${universeId}/timeline`);
      }
      break;
    }

    case "validate_lore": {
      const validated = ValidateLoreSchema.parse(args);
      universeId = validated.universe_id;
      result = await apiCall(`/universes/${universeId}/validate`, "POST");
      break;
    }

    case "expand_story": {
      const validated = ExpandStorySchema.parse(args);
      universeId = validated.universe_id;
      const prompt = enrichPrompt(validated.prompt, {
        detailLevel: validated.detail_level,
      });
      result = await apiCall(`/universes/${universeId}/expand/story`, "POST", {
        prompt,
      });
      break;
    }

    case "get_universe_scores": {
      const validated = GetUniverseScoresSchema.parse(args);
      universeId = validated.universe_id;
      result = await apiCall(`/universes/${universeId}/scores`);
      break;
    }

    case "run_council_debate": {
      const validated = RunCouncilDebateSchema.parse(args);
      universeId = validated.universe_id;
      const context = enrichPrompt(validated.context, {
        detailLevel: validated.detail_level,
      });
      const events = await consumeSSE(
        `/universes/${universeId}/council/debate`,
        { topic: validated.topic, context }
      );

      const debate: Array<{ agent: string; stance: string; reasoning: string }> =
        [];
      let consensus = "";

      for (const event of events) {
        if (event.event === "agent_argument") {
          debate.push({
            agent: event.agent as string,
            stance: event.stance as string,
            reasoning: event.reasoning as string,
          });
        }
        if (event.event === "council_consensus") {
          consensus = event.consensus as string;
        }
      }

      result = { topic: validated.topic, debate, consensus, events };
      break;
    }

    case "get_workflow_guide": {
      GetWorkflowGuideSchema.parse(args);
      result = WORKFLOW_GUIDE;
      universeId = config.defaultUniverse;
      break;
    }

    case "generate_world_lore": {
      const validated = GenerateWorldLoreSchema.parse(args);
      universeId = validated.universe_id;
      const prompt = enrichPrompt(validated.prompt, {
        detailLevel: validated.detail_level,
      });
      result = await apiCall(`/universes/${universeId}/generate/lore`, "POST", {
        prompt,
        genre: validated.genre,
        detail_level: validated.detail_level,
      });
      break;
    }

    case "populate_universe": {
      const validated = PopulateUniverseSchema.parse(args);
      universeId = validated.universe_id;
      const events = await consumeSSE(`/universes/${universeId}/generate/world`, {
        prompt: enrichPrompt(validated.prompt, { detailLevel: validated.detail_level }),
        genre: validated.genre,
        character_prompt: validated.character_prompt,
        quest_count: validated.quest_count,
      });

      const steps: string[] = [];
      let consensus = "";

      for (const event of events) {
        if (event.event === "agent_complete") {
          const agent = event.agent_id as string;
          const agentResult = (event.result ?? {}) as Record<string, unknown>;
          if (agent === "lore" && agentResult.created) {
            const created = agentResult.created as Record<string, string[]>;
            steps.push(
              `Lore: ${created.factions?.length ?? 0} factions, ${created.locations?.length ?? 0} locations, ${created.events?.length ?? 0} events`
            );
          } else if (agent === "character") {
            steps.push(`Characters: ${agentResult.count ?? 0} created`);
          } else if (agent === "narrative") {
            steps.push(`Quest: ${agentResult.title ?? (agentResult.data as Record<string, unknown>)?.title ?? "created"}`);
          } else if (agent === "consistency") {
            steps.push(`Consistency: ${(agentResult.notes as string) ?? "checked"}`);
          }
        }
        if (event.event === "workflow_complete") {
          consensus = "Full world population complete";
        }
      }

      result = { steps, consensus, events };
      break;
    }

    case "update_overview": {
      const validated = UpdateOverviewSchema.parse(args);
      universeId = validated.universe_id;
      result = await apiCall(`/universes/${universeId}`, "PATCH", {
        overview: validated.overview,
      });
      break;
    }

    default:
      throw new Error(
        `Unknown tool: ${name}. Available: ${TOOL_NAMES.join(", ")}`
      );
  }

  return { result, universeId, formatCtx };
}

function handleToolError(
  name: string,
  error: unknown,
  startTime: number
): ToolResult {
  const duration = Date.now() - startTime;

  if (config.enableMetrics) {
    metrics.recordError(name);
  }

  if (error instanceof z.ZodError) {
    const validationErrors = error.errors
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join(", ");
    logger.error(`Validation error for ${name}: ${validationErrors}`);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            {
              error: "Invalid input parameters",
              details: validationErrors,
              tool: name,
              suggestion:
                "Check the tool's input schema for required fields and types",
            },
            null,
            2
          ),
        },
      ],
      isError: true,
    };
  }

  const apiError = error as ApiError;
  logger.error(`Error in ${name}: ${apiError.message}`, { duration });

  let suggestion = "";
  if (apiError.status === 404) {
    suggestion =
      "The universe ID may not exist. Use list_universes or get_world_context to find available universes.";
  } else if (apiError.status === 429) {
    suggestion = "Rate limit exceeded. Please wait before making more requests.";
  } else if (apiError.status === 401 || apiError.status === 403) {
    suggestion = "Authentication failed. Check your API credentials.";
  } else if (apiError.message?.includes("timeout")) {
    suggestion = `Request timed out after ${config.timeout}ms. Try a simpler query or increase DREAMFORGE_TIMEOUT_MS.`;
  }

  return {
    content: [
      {
        type: "text",
        text: JSON.stringify(
          {
            error: apiError.message,
            suggestion,
            tool: name,
            timestamp: new Date().toISOString(),
            ...(config.enableMetrics && { request_duration_ms: duration }),
          },
          null,
          2
        ),
      },
    ],
    isError: true,
  };
}
