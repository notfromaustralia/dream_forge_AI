import { formatCharacterResponse } from "./character.js";
import { formatContextResponse } from "./context.js";
import { formatCouncilResponse } from "./council.js";
import { formatDialogueResponse } from "./dialogue.js";
import { formatGenericResponse } from "./generic.js";
import { formatLoreResponse, formatPopulateResponse } from "./lore.js";
import { formatQuestResponse } from "./quest.js";
import { formatSearchResponse } from "./search.js";
import { formatTimelineResponse } from "./timeline.js";
import type { FormatContext } from "../types.js";

const PRESENTATION_GUIDES: Record<string, string> = {
  create_character:
    "Present this as a rich narrative. Expand on character motivations, weave in faction politics, describe personality through examples, and suggest 2-3 follow-up story hooks. Do not summarize in one sentence.",
  generate_quest:
    "Present this quest as an immersive adventure briefing. Describe stakes, atmosphere, NPC motivations, and branching consequences. Suggest how it connects to existing lore.",
  create_dialogue:
    "Perform the dialogue dramatically. Include stage directions, emotional beats, and subtext. Explain how each character's voice reflects their bio and motivations.",
  get_world_context:
    "Present this as an evocative world primer. Weave factions, characters, and locations into a cohesive narrative picture of the current state of the world.",
  search_lore:
    "Synthesize search results into a coherent lore summary. Connect entities to each other and suggest narrative opportunities.",
  run_council_debate:
    "Present each agent's perspective distinctly, then synthesize the consensus into actionable creative direction.",
  get_timeline:
    "Present timeline events as a historical narrative. Connect events to current world tensions.",
  validate_lore:
    "Explain consistency findings clearly. If issues exist, suggest specific fixes using other tools.",
  expand_story:
    "Present the expanded story as a compelling narrative arc with clear plot progression.",
  list_universes:
    "Introduce each universe with a brief, inviting description.",
  get_universe_scores:
    "Interpret scores narratively — explain what they mean for the world's quality and what to improve.",
  get_workflow_guide:
    "Summarize the key workflows and encourage the user to start a creative session.",
  generate_world_lore:
    "Present the generated world as an immersive setting bible. Describe each faction's politics, key locations, historical events, and how they interconnect.",
  populate_universe:
    "Present the full rebuild as a comprehensive world summary. Highlight factions, characters, quests, and consistency findings.",
  update_overview:
    "Confirm the overview update and suggest how it improves the world's narrative clarity.",
  default:
    "Present this information as a rich, detailed narrative. Expand on context and suggest follow-up actions.",
};

export function formatToolResponse(
  toolName: string,
  result: unknown,
  ctx: FormatContext
): string {
  const data = (result ?? {}) as Record<string, unknown>;

  let markdown: string;
  switch (toolName) {
    case "create_character":
      markdown = formatCharacterResponse(data, ctx);
      break;
    case "generate_quest":
      markdown = formatQuestResponse(data, ctx);
      break;
    case "create_dialogue":
      markdown = formatDialogueResponse(data, ctx);
      break;
    case "get_world_context":
      markdown = formatContextResponse(data, ctx);
      break;
    case "search_lore":
      markdown = formatSearchResponse(data, ctx);
      break;
    case "run_council_debate":
      markdown = formatCouncilResponse(data, ctx);
      break;
    case "get_timeline":
      markdown = formatTimelineResponse(
        result as Record<string, unknown> | unknown[],
        ctx
      );
      break;
    case "get_workflow_guide":
      markdown =
        typeof result === "string"
          ? result
          : formatGenericResponse(toolName, result as Record<string, unknown>, ctx);
      break;
    case "generate_world_lore":
      markdown = formatLoreResponse(data, ctx);
      break;
    case "populate_universe":
      markdown = formatPopulateResponse(data, ctx);
      break;
    case "update_overview":
      markdown = `## Overview Updated\n\n${(data.overview as string) ?? "Overview saved successfully."}`;
      break;
    default:
      markdown = formatGenericResponse(toolName, result, ctx);
  }

  const guide =
    PRESENTATION_GUIDES[toolName] ?? PRESENTATION_GUIDES.default;

  const appendix = {
    _ai_presentation_guide: guide,
    _structured_data: result,
    _metadata: {
      tool: toolName,
      universe_id: ctx.universeId,
      duration_ms: ctx.durationMs,
      generated_at: new Date().toISOString(),
    },
  };

  return `${markdown}\n\n---\n\n## Structured Data\n\n\`\`\`json\n${JSON.stringify(appendix, null, 2)}\n\`\`\``;
}
