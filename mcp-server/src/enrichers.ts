import type { z } from "zod";
import { DetailLevelSchema } from "./schemas.js";

type DetailLevel = z.infer<typeof DetailLevelSchema>;

const DETAIL_INSTRUCTIONS: Record<DetailLevel, string> = {
  concise: "Keep the response focused and brief while remaining lore-accurate.",
  standard:
    "Provide a well-rounded response with clear structure, motivations, and one or two story hooks.",
  exhaustive:
    "Be extremely detailed and descriptive. Include rich backstory, sensory details, faction politics, emotional stakes, moral complexity, and at least three follow-up story hooks.",
};

const DIFFICULTY_INSTRUCTIONS: Record<string, string> = {
  easy: "Easy difficulty: straightforward objectives, low stakes, minimal complications.",
  medium:
    "Medium difficulty: multi-step objectives, moderate stakes, one meaningful complication.",
  hard: "Hard difficulty: layered objectives, high stakes, moral dilemmas, and faction entanglements.",
  epic: "Epic difficulty: multi-stage objectives, world-shaping consequences, moral dilemmas, faction politics, and long-term narrative impact.",
};

const TONE_INSTRUCTIONS: Record<string, string> = {
  dramatic: "Tone: dramatic — heightened emotions, weighty revelations, cinematic pacing.",
  comedic: "Tone: comedic — wit, banter, and character-driven humor without breaking lore.",
  tense: "Tone: tense — subtext, threats, and escalating pressure throughout the scene.",
  romantic: "Tone: romantic — intimacy, vulnerability, and emotional connection.",
  neutral: "Tone: neutral — balanced, naturalistic conversation.",
};

const LENGTH_INSTRUCTIONS: Record<string, string> = {
  short: "Length: short — 4-6 lines of dialogue with minimal stage direction.",
  medium: "Length: medium — 8-12 lines with stage directions and emotional beats.",
  long: "Length: long — 15+ lines with rich stage direction, subtext, and scene progression.",
};

const CONTEXT_DEPTH_INSTRUCTIONS: Record<string, string> = {
  minimal: "Present only the most essential lore elements.",
  standard: "Present a balanced overview of factions, characters, locations, and conflicts.",
  detailed:
    "Present an exhaustive overview weaving together factions, characters, locations, events, magic systems, religions, and active conflicts with narrative connections.",
};

export interface EnrichOptions {
  detailLevel?: DetailLevel;
  difficulty?: string;
  tone?: string;
  length?: string;
  contextDepth?: string;
  entityTypes?: string[];
  factionName?: string;
}

export function enrichPrompt(base: string, options: EnrichOptions = {}): string {
  const parts = [base.trim()];
  const detailLevel = options.detailLevel ?? "exhaustive";

  parts.push(`\n\nDetail level: ${DETAIL_INSTRUCTIONS[detailLevel]}`);

  if (options.difficulty && DIFFICULTY_INSTRUCTIONS[options.difficulty]) {
    parts.push(`\n${DIFFICULTY_INSTRUCTIONS[options.difficulty]}`);
  }

  if (options.tone && TONE_INSTRUCTIONS[options.tone]) {
    parts.push(`\n${TONE_INSTRUCTIONS[options.tone]}`);
  }

  if (options.length && LENGTH_INSTRUCTIONS[options.length]) {
    parts.push(`\n${LENGTH_INSTRUCTIONS[options.length]}`);
  }

  if (options.contextDepth && CONTEXT_DEPTH_INSTRUCTIONS[options.contextDepth]) {
    parts.push(`\nPresentation: ${CONTEXT_DEPTH_INSTRUCTIONS[options.contextDepth]}`);
  }

  if (options.factionName) {
    parts.push(
      `\nFaction focus: Center the narrative around "${options.factionName}" — their ideology, territory, allies, and enemies.`
    );
  }

  if (options.entityTypes?.length) {
    parts.push(
      `\nSearch focus: Prioritize these entity types: ${options.entityTypes.join(", ")}.`
    );
  }

  return parts.filter(Boolean).join("");
}

export function enrichSearchQuery(query: string, entityTypes?: string[]): string {
  if (!entityTypes?.length) return query;
  return enrichPrompt(query, { entityTypes });
}
