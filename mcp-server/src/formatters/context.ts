import type { FormatContext } from "../types.js";

function formatEntityList(
  label: string,
  items: Array<{ id: string; name?: string; title?: string; bio?: string; year?: number }>
): string {
  if (!items.length) return "";
  const lines = [`### ${label}`];
  for (const item of items) {
    const name = item.name ?? item.title ?? item.id;
    const extra = item.bio
      ? `: ${item.bio.substring(0, 150)}${item.bio.length > 150 ? "..." : ""}`
      : item.year !== undefined
        ? ` (year ${item.year})`
        : "";
    lines.push(`- **${name}** (\`${item.id}\`)${extra}`);
  }
  return lines.join("\n") + "\n";
}

export function formatContextResponse(
  result: Record<string, unknown>,
  ctx: FormatContext
): string {
  const sections: string[] = [
    `## ${result.name ?? "Universe"} — World Context`,
    `**Universe ID:** \`${result.universe_id ?? ctx.universeId}\`\n`,
  ];

  if (result.overview) {
    sections.push(`### Overview\n${result.overview}\n`);
  }

  sections.push(
    formatEntityList("Characters", (result.characters as Array<{ id: string; name: string; bio?: string }>) ?? [])
  );
  sections.push(
    formatEntityList("Factions", (result.factions as Array<{ id: string; name: string }>) ?? [])
  );
  sections.push(
    formatEntityList("Locations", (result.locations as Array<{ id: string; name: string }>) ?? [])
  );
  sections.push(
    formatEntityList("Events", (result.events as Array<{ id: string; title: string; year?: number }>) ?? [])
  );
  sections.push(
    formatEntityList("Stories", (result.stories as Array<{ id: string; name: string }>) ?? [])
  );
  sections.push(
    formatEntityList(
      "Magic Systems",
      (result.magic_systems as Array<{ id: string; name: string }>) ?? []
    )
  );
  sections.push(
    formatEntityList(
      "Religions",
      (result.religions as Array<{ id: string; name: string }>) ?? []
    )
  );

  sections.push(`## Suggested Next Steps`);
  sections.push(`- Use \`search_lore\` to find specific entities`);
  sections.push(`- Run \`create_character\` or \`generate_quest\` grounded in this lore`);
  sections.push(`- Check \`get_timeline\` for historical context`);

  return sections.join("\n");
}
