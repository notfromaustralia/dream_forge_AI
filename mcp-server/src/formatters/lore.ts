export function formatLoreResponse(
  result: Record<string, unknown>,
  ctx: import("../types.js").FormatContext
): string {
  const created = (result.created ?? {}) as Record<string, string[]>;
  const counts = (result.entity_counts ?? {}) as Record<string, number>;
  const sections: string[] = [
    "## World Lore Generated",
    "",
  ];

  if (result.overview) {
    sections.push(`### Overview\n${result.overview}\n`);
  }

  sections.push("### Created Entities");
  sections.push(`- **Factions:** ${created.factions?.length ?? counts.factions ?? 0}`);
  sections.push(`- **Locations:** ${created.locations?.length ?? counts.locations ?? 0}`);
  sections.push(`- **Events:** ${created.events?.length ?? counts.events ?? 0}`);
  sections.push("");

  sections.push("## Suggested Next Steps");
  sections.push("- Run `create_character` to add characters linked to these factions");
  sections.push("- Run `generate_quest` for epic side quests");
  sections.push("- Check `get_timeline` for historical context");

  return sections.join("\n");
}

export function formatPopulateResponse(
  result: Record<string, unknown>,
  ctx: import("../types.js").FormatContext
): string {
  const sections: string[] = ["## Universe Population Complete\n"];

  const steps = (result.steps ?? []) as string[];
  for (const step of steps) {
    sections.push(`- ${step}`);
  }

  if (result.consensus) {
    sections.push(`\n### Summary\n${result.consensus}`);
  }

  sections.push("\n## Suggested Next Steps");
  sections.push("- Run `get_world_context` to review the full world");
  sections.push("- Run `validate_lore` to check consistency");
  sections.push("- Run `create_dialogue` for key scenes");

  return sections.join("\n");
}
