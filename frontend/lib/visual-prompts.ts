import type { ParsedContent, ParsedQuest, ParsedStory, ParsedDialogue, ParsedPlain } from "./story-parser";
import type { Character, Event, Faction, Location, Universe } from "./api";

export type UniverseVisualContext = Pick<
  Universe,
  "name" | "genre" | "style" | "audience" | "overview" | "prompt"
>;

const PROMPT_CONSTRAINTS = "no text, no watermark, no logo";

const CARTOON_KEYWORDS = ["illustration", "cartoon", "anime", "storybook", "stylized", "comic", "whimsical"];
const CINEMATIC_KEYWORDS = ["cinematic", "gritty", "realistic", "photorealistic", "dark", "epic"];

export function universeThemeSnippet(ctx: UniverseVisualContext, maxLen = 180): string {
  const theme = (ctx.overview || ctx.prompt || "").trim();
  return theme.slice(0, maxLen);
}

export function isCartoonStyle(ctx: UniverseVisualContext): boolean {
  const style = `${ctx.style} ${ctx.audience}`.toLowerCase();
  if (CARTOON_KEYWORDS.some((k) => style.includes(k))) return true;
  if (CINEMATIC_KEYWORDS.some((k) => style.includes(k))) return false;
  return style.includes("young") || style.includes("family");
}

export function portraitStylePreset(ctx: UniverseVisualContext): string {
  return isCartoonStyle(ctx)
    ? "cartoon illustration, stylized character portrait, vibrant colors, animated look, clean lines"
    : "cinematic portrait, dramatic lighting, painterly fantasy art, detailed face";
}

export function sceneStylePreset(ctx: UniverseVisualContext): string {
  return isCartoonStyle(ctx)
    ? "illustrated scene, stylized, vibrant, painterly, storybook atmosphere"
    : "cinematic wide shot, dramatic lighting, atmospheric, epic";
}

function buildPrompt(...parts: (string | undefined | false)[]): string {
  return parts.filter(Boolean).join(", ");
}

function parseCharacterTraits(personality: string): { traits: string[]; flaw: string } {
  try {
    const parsed = JSON.parse(personality || "{}");
    if (typeof parsed !== "object" || !parsed) return { traits: [], flaw: "" };
    const traits = Array.isArray(parsed.traits) ? parsed.traits.map(String) : [];
    const flaw = typeof parsed.flaw === "string" ? parsed.flaw : "";
    return { traits, flaw };
  } catch {
    return { traits: [], flaw: "" };
  }
}

export function universeBannerPrompt(ctx: UniverseVisualContext): string {
  return buildPrompt(
    sceneStylePreset(ctx),
    "wide landscape establishing shot",
    ctx.genre,
    ctx.style,
    ctx.name,
    universeThemeSnippet(ctx),
    "epic atmosphere",
    PROMPT_CONSTRAINTS
  );
}

export function characterPortraitPrompt(
  character: Pick<Character, "name" | "bio" | "personality" | "story_importance" | "motivations">,
  ctx: UniverseVisualContext,
  factionName?: string,
  locationName?: string
): string {
  const { traits, flaw } = parseCharacterTraits(character.personality);
  const traitStr = traits.length ? traits.join(", ") : "";
  return buildPrompt(
    portraitStylePreset(ctx),
    ctx.genre,
    universeThemeSnippet(ctx, 120),
    `portrait of ${character.name}`,
    character.story_importance ? `role: ${character.story_importance}` : "",
    traitStr ? `traits: ${traitStr}` : "",
    flaw ? `flaw: ${flaw}` : "",
    character.bio.slice(0, 120),
    character.motivations ? `motivations: ${character.motivations.slice(0, 80)}` : "",
    factionName ? `member of ${factionName}` : "",
    locationName ? `from ${locationName}` : "",
    "character bust, centered",
    PROMPT_CONSTRAINTS
  );
}

export function factionEmblemPrompt(
  faction: Pick<Faction, "name" | "ideology" | "territory" | "power_level">,
  ctx: UniverseVisualContext
): string {
  return buildPrompt(
    "heraldic emblem icon, symbolic crest, centered",
    ctx.genre,
    universeThemeSnippet(ctx, 100),
    faction.name,
    faction.ideology.slice(0, 80),
    faction.territory ? `territory: ${faction.territory}` : "",
    `${faction.power_level} power`,
    PROMPT_CONSTRAINTS
  );
}

export function factionBannerPrompt(
  faction: Pick<Faction, "name" | "ideology" | "territory">,
  ctx: UniverseVisualContext
): string {
  return buildPrompt(
    sceneStylePreset(ctx),
    ctx.genre,
    universeThemeSnippet(ctx, 100),
    faction.name,
    faction.ideology.slice(0, 100),
    faction.territory ? `territory: ${faction.territory}` : "",
    "political drama atmosphere",
    PROMPT_CONSTRAINTS
  );
}

export function locationScenePrompt(
  location: Pick<Location, "name" | "location_type" | "description">,
  ctx: UniverseVisualContext
): string {
  return buildPrompt(
    sceneStylePreset(ctx),
    "landscape establishing shot",
    ctx.genre,
    universeThemeSnippet(ctx, 100),
    location.location_type,
    location.name,
    location.description.slice(0, 120),
    "wide angle",
    PROMPT_CONSTRAINTS
  );
}

export function eventScenePrompt(
  event: Pick<Event, "title" | "description" | "era_year" | "event_type" | "impact">,
  ctx: UniverseVisualContext
): string {
  return buildPrompt(
    sceneStylePreset(ctx),
    "historical moment scene",
    ctx.genre,
    universeThemeSnippet(ctx, 100),
    `year ${event.era_year}`,
    event.title,
    event.description.slice(0, 120),
    event.event_type,
    `${event.impact} impact`,
    PROMPT_CONSTRAINTS
  );
}

export function eraScenePrompt(
  eraYear: number,
  eraLabel: string,
  events: { title: string; description?: string }[],
  ctx: UniverseVisualContext
): string {
  const eventHint = events[0]
    ? `${events[0].title}: ${(events[0].description || "").slice(0, 80)}`
    : eraLabel;
  return buildPrompt(
    sceneStylePreset(ctx),
    "temporal era panorama",
    ctx.genre,
    universeThemeSnippet(ctx, 100),
    `year ${eraYear}`,
    eraLabel,
    eventHint,
    "atmospheric timeline scene",
    PROMPT_CONSTRAINTS
  );
}

function questPrompt(parsed: ParsedQuest, ctx: UniverseVisualContext): string {
  const locations = parsed.locations.slice(0, 2).join(", ");
  const obstacles = parsed.obstacles.slice(0, 2).map((o) => o.name).join(", ");
  return buildPrompt(
    sceneStylePreset(ctx),
    ctx.genre,
    universeThemeSnippet(ctx, 100),
    parsed.title,
    parsed.synopsis.slice(0, 120),
    locations ? `setting: ${locations}` : "",
    obstacles ? `threat: ${obstacles}` : "",
    "quest scene",
    PROMPT_CONSTRAINTS
  );
}

function storyPrompt(parsed: ParsedStory, ctx: UniverseVisualContext): string {
  const beat = parsed.beats.find((b) => /conflict|climax/i.test(b.label))?.text || parsed.beats[0]?.text || "";
  return buildPrompt(
    sceneStylePreset(ctx),
    ctx.genre,
    universeThemeSnippet(ctx, 100),
    parsed.setting,
    parsed.title,
    beat.slice(0, 100),
    "narrative scene",
    PROMPT_CONSTRAINTS
  );
}

function dialoguePrompt(parsed: ParsedDialogue, ctx: UniverseVisualContext): string {
  return buildPrompt(
    sceneStylePreset(ctx),
    ctx.genre,
    universeThemeSnippet(ctx, 80),
    parsed.setting,
    parsed.title,
    parsed.characters.slice(0, 2).map((c) => c.name).join(" and "),
    "character scene",
    PROMPT_CONSTRAINTS
  );
}

function plainPrompt(parsed: ParsedPlain, ctx: UniverseVisualContext): string {
  return buildPrompt(
    sceneStylePreset(ctx),
    ctx.genre,
    universeThemeSnippet(ctx, 80),
    parsed.title,
    parsed.text.slice(0, 150),
    PROMPT_CONSTRAINTS
  );
}

export function storyBannerPrompt(parsed: ParsedContent, ctx: UniverseVisualContext): string {
  switch (parsed.kind) {
    case "quest":
      return questPrompt(parsed, ctx);
    case "story":
      return storyPrompt(parsed, ctx);
    case "dialogue":
      return dialoguePrompt(parsed, ctx);
    default:
      return plainPrompt(parsed, ctx);
  }
}

export function toVisualContext(universe: Universe): UniverseVisualContext {
  return {
    name: universe.name,
    genre: universe.genre,
    style: universe.style,
    audience: universe.audience,
    overview: universe.overview,
    prompt: universe.prompt,
  };
}
