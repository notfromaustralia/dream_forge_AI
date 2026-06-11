import type { FormatContext } from "../types.js";

export function formatTimelineResponse(
  result: Record<string, unknown> | unknown[],
  ctx: FormatContext
): string {
  if (Array.isArray(result)) {
    const entries = result as Array<{ era_year: number; label: string; id: string }>;
    const sections: string[] = [`## Timeline — ${ctx.universeId}\n`];

    if (!entries.length) {
      sections.push("_No timeline entries found._");
      return sections.join("\n");
    }

    for (const entry of entries) {
      sections.push(`- **Year ${entry.era_year}:** ${entry.label} (\`${entry.id}\`)`);
    }

    sections.push(`\n## Suggested Next Steps`);
    sections.push(`- Use \`get_timeline\` with era_year for a point-in-time snapshot`);
    sections.push(`- Search lore for events at specific eras`);

    return sections.join("\n");
  }

  const state = result as Record<string, unknown>;
  const eraYear = state.era_year as number;
  const sections: string[] = [`## World State at Year ${eraYear}\n`];

  const formatList = (label: string, items: Array<{ id: string; name: string; bio?: string }>) => {
    if (!items?.length) return;
    sections.push(`### ${label}`);
    for (const item of items) {
      const extra = item.bio ? `: ${item.bio.substring(0, 100)}...` : "";
      sections.push(`- **${item.name}** (\`${item.id}\`)${extra}`);
    }
    sections.push("");
  };

  formatList("Characters", state.characters as Array<{ id: string; name: string; bio?: string }>);
  formatList("Factions", state.factions as Array<{ id: string; name: string }>);
  formatList("Locations", state.locations as Array<{ id: string; name: string }>);
  formatList("Events", state.events as Array<{ id: string; name: string }>);

  return sections.join("\n");
}
