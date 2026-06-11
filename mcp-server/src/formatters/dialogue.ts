import type { AgentReasoning, CharacterRecord, FormatContext } from "../types.js";

export function formatDialogueResponse(
  result: Record<string, unknown>,
  ctx: FormatContext
): string {
  const data = (result.data ?? result) as Record<string, unknown>;
  const reasoning = result.reasoning as AgentReasoning | undefined;
  const sections: string[] = ["## Generated Dialogue\n"];

  if (data.scene_summary) {
    sections.push(`**Scene Summary:** ${data.scene_summary}\n`);
  }

  const lines = data.lines as Array<{ speaker: string; text: string }> | undefined;
  if (lines?.length) {
    sections.push(`### Dialogue`);
    for (const line of lines) {
      sections.push(`**${line.speaker}:** "${line.text}"`);
    }
    sections.push("");
  }

  if (ctx.characters?.length) {
    sections.push(`### Characters in Scene`);
    for (const char of ctx.characters) {
      sections.push(
        `- **${char.name}** (\`${char.id}\`): ${char.bio?.substring(0, 120) ?? "No bio"}...`
      );
    }
    sections.push("");
  }

  if (reasoning) {
    sections.push(`## Agent Reasoning`);
    if (reasoning.thought) sections.push(`**Thought:** ${reasoning.thought}`);
    if (reasoning.action) sections.push(`**Action:** ${reasoning.action}`);
    sections.push("");
  }

  sections.push(`## Suggested Next Steps`);
  sections.push(`- Continue the scene with another \`create_dialogue\` call`);
  sections.push(`- Build a \`generate_quest\` around the tensions revealed in this dialogue`);

  return sections.join("\n");
}
