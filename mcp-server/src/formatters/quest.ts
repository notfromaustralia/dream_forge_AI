import type { AgentReasoning, FormatContext } from "../types.js";

export function formatQuestResponse(
  result: Record<string, unknown>,
  ctx: FormatContext
): string {
  const data = (result.data ?? result) as Record<string, unknown>;
  const reasoning = result.reasoning as AgentReasoning | undefined;
  const sections: string[] = [];

  const title = (data.title ?? result.title ?? "Untitled Quest") as string;
  sections.push(`## ${title}\n`);

  if (data.synopsis) {
    sections.push(`**Synopsis:** ${data.synopsis}\n`);
  }

  const objectives = data.objectives as string[] | undefined;
  if (objectives?.length) {
    sections.push(`### Objectives`);
    objectives.forEach((obj, i) => sections.push(`${i + 1}. ${obj}`));
    sections.push("");
  }

  if (data.rewards) sections.push(`**Rewards:** ${data.rewards}\n`);

  const involvedChars = data.involved_characters as string[] | undefined;
  if (involvedChars?.length) {
    sections.push(`**Involved Characters:** ${involvedChars.join(", ")}\n`);
  }

  const involvedLocs = data.involved_locations as string[] | undefined;
  if (involvedLocs?.length) {
    sections.push(`**Involved Locations:** ${involvedLocs.join(", ")}\n`);
  }

  if (result.story_id) {
    sections.push(`**Story ID:** \`${result.story_id}\`\n`);
  }

  if (reasoning) {
    sections.push(`## Agent Reasoning`);
    if (reasoning.thought) sections.push(`**Thought:** ${reasoning.thought}`);
    if (reasoning.action) sections.push(`**Action:** ${reasoning.action}`);
    if (reasoning.observation)
      sections.push(`**Observation:** ${reasoning.observation}`);
    sections.push("");
  }

  if (ctx.worldContext) {
    const factions = (ctx.worldContext.factions as Array<{ name: string }>) ?? [];
    if (factions.length) {
      sections.push(
        `**World Context:** This quest exists within a world featuring factions such as ${factions
          .slice(0, 3)
          .map((f) => f.name)
          .join(", ")}.`
      );
      sections.push("");
    }
  }

  sections.push(`## Suggested Next Steps`);
  sections.push(`- Run \`create_dialogue\` for a key scene in this quest`);
  sections.push(`- Run \`validate_lore\` to verify quest consistency`);
  sections.push(`- Run \`run_council_debate\` on whether players should accept this quest`);

  return sections.join("\n");
}
