import type { AgentReasoning, CharacterRecord, FormatContext } from "../types.js";

function parsePersonality(personality: string | undefined): string {
  if (!personality) return "Unknown";
  try {
    const parsed = JSON.parse(personality) as {
      traits?: string[];
      flaw?: string;
    };
    const traits = parsed.traits?.join(", ") ?? "";
    const flaw = parsed.flaw ? ` | Flaw: ${parsed.flaw}` : "";
    return traits ? `${traits}${flaw}` : personality;
  } catch {
    return personality;
  }
}

function formatReasoning(reasoning: AgentReasoning | undefined): string {
  if (!reasoning) return "";
  const lines = [
    reasoning.thought && `**Thought:** ${reasoning.thought}`,
    reasoning.action && `**Action:** ${reasoning.action}`,
    reasoning.observation && `**Observation:** ${reasoning.observation}`,
  ].filter(Boolean);
  return lines.length ? `## Agent Reasoning\n\n${lines.join("\n")}` : "";
}

export function formatCharacterResponse(
  result: Record<string, unknown>,
  ctx: FormatContext
): string {
  const characters = ctx.characters ?? [];
  const reasoning = result.reasoning as AgentReasoning | undefined;
  const count = (result.count as number) ?? characters.length;

  const sections: string[] = [`## Characters Created (${count})\n`];

  if (characters.length) {
    for (const char of characters) {
      sections.push(`### ${char.name}`);
      sections.push(
        `**Role:** ${char.story_importance ?? "supporting"} | **ID:** \`${char.id}\``
      );
      if (char.era_start !== undefined) {
        sections.push(`**Era:** ${char.era_start}`);
      }
      if (char.bio) sections.push(`**Bio:** ${char.bio}`);
      if (char.motivations) sections.push(`**Motivations:** ${char.motivations}`);
      if (char.personality) {
        sections.push(`**Personality:** ${parsePersonality(char.personality)}`);
      }
      sections.push("");
    }
  } else if (result.character_ids) {
    const ids = result.character_ids as string[];
    sections.push(`Character IDs created: ${ids.map((id) => `\`${id}\``).join(", ")}`);
    sections.push(
      "_Full character bios were fetched but may not be available yet. Use search_lore to find them._"
    );
  }

  const reasoningSection = formatReasoning(reasoning);
  if (reasoningSection) sections.push(reasoningSection);

  const charNames = characters.map((c) => c.name).filter(Boolean);
  const charIds = characters.map((c) => c.id);
  sections.push(`## Suggested Next Steps`);
  if (charNames.length) {
    sections.push(
      `- Run \`generate_quest\` involving ${charNames.slice(0, 2).join(" and ")}`
    );
    sections.push(
      `- Use \`create_dialogue\` with character_ids: ${JSON.stringify(charIds.slice(0, 3))}`
    );
  }
  sections.push(`- Run \`validate_lore\` to check consistency after creation`);

  return sections.join("\n");
}
