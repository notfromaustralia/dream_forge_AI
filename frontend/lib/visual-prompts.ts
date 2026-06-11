import type { ParsedContent, ParsedQuest, ParsedStory, ParsedDialogue, ParsedPlain } from "./story-parser";
import type { Faction, Location, Universe } from "./api";

function encodePollinations(prompt: string, seed: string, width: number, height: number): string {
  const encoded = encodeURIComponent(prompt.slice(0, 800));
  return `https://image.pollinations.ai/prompt/${encoded}?width=${width}&height=${height}&nologo=true&seed=${encodeURIComponent(seed)}`;
}

export function pollinationsPortraitUrl(prompt: string, seed: string, size = 512): string {
  return encodePollinations(prompt, seed, size, size);
}

export function pollinationsBannerUrl(prompt: string, seed: string): string {
  return encodePollinations(prompt, seed, 800, 320);
}

export function pollinationsEmblemUrl(prompt: string, seed: string): string {
  return encodePollinations(prompt, seed, 256, 256);
}

export function dicebearAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0a0a1a`;
}

export function universeBannerPrompt(universe: Pick<Universe, "prompt" | "genre" | "style" | "overview" | "name">): string {
  const desc = universe.overview || universe.prompt;
  return [
    "cinematic wide landscape",
    universe.genre,
    universe.style,
    universe.name,
    desc.slice(0, 150),
    "epic atmosphere, dramatic lighting, no text, no watermark",
  ].filter(Boolean).join(", ");
}

export function factionEmblemPrompt(faction: Pick<Faction, "name" | "ideology" | "territory" | "power_level">, genre: string): string {
  return [
    "heraldic emblem icon",
    genre,
    faction.name,
    faction.ideology.slice(0, 80),
    faction.territory,
    `${faction.power_level} power`,
    "symbolic crest, centered, dark fantasy, no text",
  ].filter(Boolean).join(", ");
}

export function factionBannerPrompt(faction: Pick<Faction, "name" | "ideology" | "territory">, genre: string): string {
  return [
    "cinematic wide shot",
    genre,
    faction.name,
    faction.ideology.slice(0, 100),
    `territory: ${faction.territory}`,
    "atmospheric, political drama, no text",
  ].filter(Boolean).join(", ");
}

export function locationScenePrompt(
  location: Pick<Location, "name" | "location_type" | "description">,
  genre: string
): string {
  return [
    "cinematic landscape establishing shot",
    genre,
    location.location_type,
    location.name,
    location.description.slice(0, 120),
    "atmospheric, wide angle, no text, no watermark",
  ].filter(Boolean).join(", ");
}

export function eraScenePrompt(
  eraYear: number,
  eraLabel: string,
  events: { title: string; description?: string }[],
  genre: string
): string {
  const eventHint = events[0]
    ? `${events[0].title}: ${(events[0].description || "").slice(0, 80)}`
    : eraLabel;
  return [
    "futuristic time travel portal scene",
    genre,
    `year ${eraYear}`,
    eraLabel,
    eventHint,
    "neon cyan magenta, temporal energy, cinematic, no text",
  ].filter(Boolean).join(", ");
}

function questPrompt(parsed: ParsedQuest): string {
  const locations = parsed.locations.slice(0, 2).join(", ");
  const obstacles = parsed.obstacles.slice(0, 2).map((o) => o.name).join(", ");
  return [
    "dark fantasy cinematic wide shot",
    parsed.title,
    parsed.synopsis.slice(0, 120),
    locations ? `setting: ${locations}` : "",
    obstacles ? `threat: ${obstacles}` : "",
    "atmospheric, no text, no watermark",
  ].filter(Boolean).join(", ");
}

function storyPrompt(parsed: ParsedStory): string {
  const beat = parsed.beats.find((b) => /conflict|climax/i.test(b.label))?.text || parsed.beats[0]?.text || "";
  return [
    "cinematic fantasy landscape",
    parsed.setting,
    parsed.title,
    beat.slice(0, 100),
    "dramatic lighting, wide shot, no text",
  ].filter(Boolean).join(", ");
}

function dialoguePrompt(parsed: ParsedDialogue): string {
  return [
    "cinematic character scene",
    parsed.setting,
    parsed.title,
    parsed.characters.slice(0, 2).map((c) => c.name).join(" and "),
    "intimate framing, dramatic lighting, no text",
  ].filter(Boolean).join(", ");
}

function plainPrompt(parsed: ParsedPlain): string {
  return `fantasy scene, ${parsed.title}, ${parsed.text.slice(0, 150)}, cinematic, no text`;
}

export function storyBannerPrompt(parsed: ParsedContent): string {
  switch (parsed.kind) {
    case "quest":
      return questPrompt(parsed);
    case "story":
      return storyPrompt(parsed);
    case "dialogue":
      return dialoguePrompt(parsed);
    default:
      return plainPrompt(parsed);
  }
}
