import type { FormatContext, SearchResultItem } from "../types.js";

export function formatSearchResponse(
  result: Record<string, unknown>,
  ctx: FormatContext
): string {
  const results = (result.results ?? []) as SearchResultItem[];
  const query = (result.query ?? "") as string;
  const count = (result.result_count as number) ?? results.length;

  const sections: string[] = [
    `## Lore Search Results`,
    `**Query:** "${query}"`,
    `**Results:** ${count}\n`,
  ];

  if (!results.length) {
    sections.push(
      "_No results found. Try broadening your query or use get_world_context for an overview._"
    );
    return sections.join("\n");
  }

  const grouped = new Map<string, SearchResultItem[]>();
  for (const item of results) {
    const group = grouped.get(item.entity_type) ?? [];
    group.push(item);
    grouped.set(item.entity_type, group);
  }

  for (const [entityType, items] of grouped) {
    sections.push(`### ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}s`);
    for (const item of items) {
      sections.push(
        `- **${item.entity_id}** (score: ${item.score.toFixed(2)}): ${item.content}`
      );
    }
    sections.push("");
  }

  sections.push(`## Suggested Next Steps`);
  sections.push(`- Use entity IDs above in \`create_dialogue\` or \`generate_quest\``);
  sections.push(`- Run \`get_world_context\` for broader lore grounding`);

  return sections.join("\n");
}
