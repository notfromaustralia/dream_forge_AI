import type { ParsedContent } from "./story-parser";

function joinSections(sections: (string | undefined | null)[]): string {
  return sections.filter((s) => s && s.trim()).join("\n\n");
}

export function buildNarrationScript(parsed: ParsedContent): string {
  switch (parsed.kind) {
    case "quest": {
      const objectives =
        parsed.objectives.length > 0
          ? `Objectives.\n${parsed.objectives.map((o, i) => `${i + 1}. ${o}`).join("\n")}`
          : "";
      const obstacles =
        parsed.obstacles.length > 0
          ? `Obstacles.\n${parsed.obstacles.map((o) => `${o.name}. ${o.description}`).join("\n")}`
          : "";
      const locations =
        parsed.locations.length > 0 ? `Locations. ${parsed.locations.join(", ")}.` : "";
      const rewards =
        parsed.rewards.length > 0 ? `Rewards. ${parsed.rewards.join(", ")}.` : "";
      const giver = parsed.questGiver ? `Quest giver. ${parsed.questGiver}.` : "";

      return joinSections([
        parsed.title,
        parsed.synopsis,
        giver,
        objectives,
        obstacles,
        locations,
        rewards,
      ]);
    }
    case "story": {
      const setting = parsed.setting ? `Setting. ${parsed.setting}.` : "";
      const characters =
        parsed.characters.length > 0
          ? `Characters. ${parsed.characters.map((c) => (c.role ? `${c.name}, ${c.role}` : c.name)).join(". ")}.`
          : "";
      const beats =
        parsed.beats.length > 0
          ? parsed.beats
              .map((b) => (b.label ? `${b.label}. ${b.text}` : b.text))
              .join("\n\n")
          : "";
      const themes =
        parsed.themes.length > 0 ? `Themes. ${parsed.themes.join(", ")}.` : "";

      return joinSections([parsed.title, parsed.synopsis, setting, characters, beats, themes]);
    }
    case "dialogue": {
      const setting = parsed.setting ? `Setting. ${parsed.setting}.` : "";
      const lines =
        parsed.lines.length > 0
          ? parsed.lines.map((l) => `${l.character} says: ${l.line}`).join("\n\n")
          : "";

      return joinSections([parsed.title, parsed.synopsis, setting, lines]);
    }
    case "plain":
      return joinSections([parsed.title, parsed.text]);
    default:
      return "";
  }
}

/** Rough estimate at ~150 words/min narration pace. */
export function estimateNarrationMinutes(text: string): number {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 150));
}
