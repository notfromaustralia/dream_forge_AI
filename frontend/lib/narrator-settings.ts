export type NarratorSettings = {
  voiceURI: string | null;
  rate: number;
  pitch: number;
};

const STORAGE_KEY = "dreamforge-narrator-settings";

export const DEFAULT_NARRATOR_SETTINGS: NarratorSettings = {
  voiceURI: null,
  rate: 0.92,
  pitch: 0.95,
};

export function loadNarratorSettings(): NarratorSettings {
  if (typeof window === "undefined") return DEFAULT_NARRATOR_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NARRATOR_SETTINGS;
    const parsed = JSON.parse(raw) as Partial<NarratorSettings>;
    return {
      voiceURI: parsed.voiceURI ?? null,
      rate: clamp(parsed.rate ?? DEFAULT_NARRATOR_SETTINGS.rate, 0.6, 1.4),
      pitch: clamp(parsed.pitch ?? DEFAULT_NARRATOR_SETTINGS.pitch, 0.7, 1.3),
    };
  } catch {
    return DEFAULT_NARRATOR_SETTINGS;
  }
}

export function saveNarratorSettings(settings: NarratorSettings): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}

function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Prefer warm, narrator-style voices for storytelling. */
const NARRATOR_HINTS = [
  "Samantha",
  "Daniel",
  "Karen",
  "Moira",
  "Google UK English Female",
  "Google UK English Male",
  "Microsoft Zira",
  "Microsoft David",
  "Alex",
  "Victoria",
  "Fiona",
  "Tessa",
  "Natural",
  "Google",
];

export function pickDefaultNarratorVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  const enPool = voices.filter(
    (v) => v.lang.startsWith("en") || v.lang.startsWith("en-") || v.lang.startsWith("en_")
  );
  const pool = enPool.length ? enPool : voices;

  for (const hint of NARRATOR_HINTS) {
    const match = pool.find((v) => v.name.includes(hint));
    if (match) return match;
  }

  return pool[0] ?? voices[0] ?? null;
}

export function findVoiceByURI(
  voices: SpeechSynthesisVoice[],
  uri: string | null
): SpeechSynthesisVoice | null {
  if (!uri) return null;
  return voices.find((v) => v.voiceURI === uri) ?? null;
}
