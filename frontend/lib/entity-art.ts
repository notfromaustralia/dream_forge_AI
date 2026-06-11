import type { CSSProperties } from "react";

/** Deterministic illustrated art — unique per entity, no stock-photo pools. */

export type EntityBannerVariant =
  | "universe"
  | "location"
  | "faction"
  | "story"
  | "event"
  | "era"
  | "character";

export type GenrePalette = {
  hueBase: number;
  from: string;
  via: string;
  to: string;
  accent: string;
  glow: string;
};

export function entityHash(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h;
}

export function entityBannerHue(seed: string): number {
  return entityHash(seed) % 360;
}

export function genrePalette(genre: string, style = ""): GenrePalette {
  const g = `${genre} ${style}`.toLowerCase();
  if (/sci|cyber|neon|tech|future|space/.test(g)) {
    return { hueBase: 195, from: "#0c1929", via: "#1a0a2e", to: "#0a1628", accent: "#22d3ee", glow: "#a855f7" };
  }
  if (/dark|horror|grim|gothic/.test(g)) {
    return { hueBase: 0, from: "#1a0a0a", via: "#0f0f14", to: "#1a1020", accent: "#f87171", glow: "#7c3aed" };
  }
  if (/ancient|egypt|myth|histor/.test(g)) {
    return { hueBase: 38, from: "#1c1408", via: "#1a0f05", to: "#0f1a14", accent: "#fbbf24", glow: "#d97706" };
  }
  if (/epic|high fantasy|fantasy/.test(g)) {
    return { hueBase: 270, from: "#1a0a2e", via: "#0f172a", to: "#052e16", accent: "#a78bfa", glow: "#34d399" };
  }
  return { hueBase: 260, from: "#1e1b4b", via: "#0f172a", to: "#134e4a", accent: "#818cf8", glow: "#2dd4bf" };
}

export function bannerGradientStyle(seed: string, genre: string, style = ""): CSSProperties {
  const palette = genrePalette(genre, style);
  const hueShift = entityBannerHue(seed);
  const h1 = (palette.hueBase + hueShift * 0.4) % 360;
  const h2 = (palette.hueBase + hueShift * 0.7 + 40) % 360;
  return {
    background: `
      radial-gradient(ellipse 80% 60% at 20% 80%, hsla(${h1}, 70%, 45%, 0.35) 0%, transparent 55%),
      radial-gradient(ellipse 70% 50% at 85% 20%, hsla(${h2}, 65%, 50%, 0.3) 0%, transparent 50%),
      linear-gradient(135deg, ${palette.from} 0%, ${palette.via} 45%, ${palette.to} 100%)
    `,
  };
}

export function dicebearAvatarUrl(seed: string, cartoon = true): string {
  const style = cartoon ? "adventurer" : "personas";
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0a0a1a`;
}

export function dicebearPortraitUrl(seed: string, cartoon = true, size = 256): string {
  const style = cartoon ? "adventurer" : "personas";
  return `https://api.dicebear.com/7.x/${style}/png?seed=${encodeURIComponent(seed)}&size=${size}&backgroundColor=0a0a1a`;
}

export function dicebearEmblemUrl(seed: string, size = 128): string {
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${encodeURIComponent(seed)}&backgroundColor=0a0a1a&size=${size}`;
}

export function characterAvatarSeed(characterId: string, characterName: string): string {
  return `${characterId}-${characterName}`;
}

/** Optional AI URLs — only when NEXT_PUBLIC_USE_POLLINATIONS=true */
const USE_POLLINATIONS = process.env.NEXT_PUBLIC_USE_POLLINATIONS === "true";

export function pollinationsImageUrl(prompt: string, seed: string, width: number, height: number): string {
  const encoded = encodeURIComponent(prompt.slice(0, 800));
  const params = new URLSearchParams({
    width: String(width),
    height: String(height),
    nologo: "true",
    seed,
  });
  return `https://image.pollinations.ai/prompt/${encoded}?${params.toString()}`;
}

export function isPollinationsEnabled(): boolean {
  return USE_POLLINATIONS;
}
