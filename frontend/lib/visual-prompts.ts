import type { ParsedStory } from "./story-parser";

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

export function dicebearAvatarUrl(seed: string): string {
  return `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0a0a1a`;
}

export function questScenePrompt(parsed: Extract<ParsedStory, { kind: "quest" }>): string {
  const locations = parsed.locations.slice(0, +2).join(", ");
  const enemies = parsed.enemies?.slice(0, 2).map((e) => e.name).join(", ");
  const parts = [
    "dark fantasy cinematic wide shot",
    parsed.title,
    parsed.description.slice(0, 120),
    locations ? `setting: ${locations}` : "",
    enemies ? `threat: ${enemies}` : "",
    "atmospheric, no text, no watermark",
  ].filter(Boolean);
  return parts.join(", ");
}

export function narrativeScenePrompt(parsed: Extract<ParsedStory, { kind: "narrative" }>): string {
  const setting = parsed.setting.world || parsed.setting.location || "";
  const conflict = parsed.plot.conflict?.slice(0, 100) || "";
  const parts = [
    "cinematic fantasy landscape",
    setting,
    conflict,
    "dramatic lighting, wide shot, no text",
  ].filter(Boolean);
  return parts.join(", ");
}

export function plainScenePrompt(parsed: Extract<ParsedStory, { kind: "plain" }>): string {
  return `fantasy scene, ${parsed.title}, ${parsed.text.slice(0, 150)}, cinematic, no text`;
}

export function storyBannerPrompt(parsed: ParsedStory): string {
  switch (parsed.kind) {
    case "quest":
      return questScenePrompt(parsed);
    case "narrative":
      return narrativeScenePrompt(parsed);
    default:
      return plainScenePrompt(parsed);
  }
}
