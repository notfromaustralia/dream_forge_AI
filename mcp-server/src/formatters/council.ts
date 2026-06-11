import type { FormatContext } from "../types.js";

export function formatCouncilResponse(
  result: Record<string, unknown>,
  ctx: FormatContext
): string {
  const debate = (result.debate ?? []) as Array<{
    agent: string;
    stance: string;
    reasoning: string;
  }>;
  const consensus = (result.consensus ?? "") as string;
  const topic = (result.topic ?? "") as string;

  const sections: string[] = [
    `## World Council Debate`,
    `**Topic:** ${topic}\n`,
  ];

  for (const entry of debate) {
    const agentLabel = entry.agent.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
    sections.push(`### ${agentLabel}`);
    sections.push(`**Stance:** ${entry.stance}`);
    if (entry.reasoning) sections.push(`**Reasoning:** ${entry.reasoning}`);
    sections.push("");
  }

  if (consensus) {
    sections.push(`## Council Consensus\n${consensus}\n`);
  }

  sections.push(`## Suggested Next Steps`);
  sections.push(`- Implement the council's consensus in a \`generate_quest\` or \`expand_story\``);
  sections.push(`- Run \`validate_lore\` to check the proposed direction`);

  return sections.join("\n");
}
