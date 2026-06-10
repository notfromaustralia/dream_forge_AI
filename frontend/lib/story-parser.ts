/**
 * Story content parser.
 *
 * The backend now emits one of three shapes inside Story.content_json,
 * tagged by a `kind` discriminator. This parser is intentionally thin:
 * the backend has already normalized the LLM output, so we just read it.
 *
 * Legacy rows (created before the schema lockdown) may have a different
 * shape — those fall back to a generic plain rendering.
 */

export type StoryBeat = { label: string; text: string };
export type StoryCharacter = { name: string; role?: string };
export type Obstacle = { name: string; description: string };
export type DialogueLine = { character: string; line: string };

export type ParsedQuest = {
  kind: "quest";
  title: string;
  synopsis: string;
  questGiver: string;
  objectives: string[];
  obstacles: Obstacle[];
  rewards: string[];
  locations: string[];
};

export type ParsedStory = {
  kind: "story";
  title: string;
  synopsis: string;
  setting: string;
  characters: StoryCharacter[];
  beats: StoryBeat[];
  themes: string[];
};

export type ParsedDialogue = {
  kind: "dialogue";
  title: string;
  synopsis: string;
  setting: string;
  characters: StoryCharacter[];
  lines: DialogueLine[];
};

export type ParsedPlain = {
  kind: "plain";
  title: string;
  text: string;
};

export type ParsedContent = ParsedQuest | ParsedStory | ParsedDialogue | ParsedPlain;

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" && v.trim() ? v.trim() : fallback;
}

function strArr(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const obj = item as Record<string, unknown>;
        return str(obj.description) || str(obj.text) || str(obj.name);
      }
      return "";
    })
    .filter(Boolean);
}

function charArr(v: unknown): StoryCharacter[] {
  if (!Array.isArray(v)) return [];
  const out: StoryCharacter[] = [];
  for (const item of v) {
    if (!item || typeof item !== "object") continue;
    const obj = item as Record<string, unknown>;
    const name = str(obj.name);
    if (!name) continue;
    const role = str(obj.role);
    out.push(role ? { name, role } : { name });
  }
  return out;
}

function obstacleArr(v: unknown): Obstacle[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      return { name: str(obj.name, "Unknown"), description: str(obj.description) };
    })
    .filter((o): o is Obstacle => o !== null);
}

function beatArr(v: unknown): StoryBeat[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const text = str(obj.text);
      const label = str(obj.label);
      if (!text && !label) return null;
      return { label, text };
    })
    .filter((b): b is StoryBeat => b !== null);
}

function dialogueArr(v: unknown): DialogueLine[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const obj = item as Record<string, unknown>;
      const line = str(obj.line) || str(obj.text);
      const character = str(obj.character) || str(obj.speaker);
      if (!line) return null;
      return { character: character || "Unknown", line };
    })
    .filter((d): d is DialogueLine => d !== null);
}

function tryParse(json: string | undefined): Record<string, unknown> | null {
  if (!json || json === "{}") return null;
  try {
    const parsed = JSON.parse(json);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

export function parseStoryContent(
  fallbackTitle: string,
  synopsis: string,
  contentJson?: string,
): ParsedContent {
  const data = tryParse(contentJson);
  if (!data) {
    return { kind: "plain", title: fallbackTitle, text: synopsis };
  }

  const kind = str(data.kind);
  const title = str(data.title, fallbackTitle);

  if (kind === "quest" || ("objectives" in data && "questGiver" in data)) {
    return {
      kind: "quest",
      title,
      synopsis: str(data.synopsis, synopsis),
      questGiver: str(data.questGiver) || str(data.quest_giver),
      objectives: strArr(data.objectives),
      obstacles: obstacleArr(data.obstacles),
      rewards: strArr(data.rewards),
      locations: strArr(data.locations),
    };
  }

  if (kind === "dialogue" || ("lines" in data && "characters" in data)) {
    return {
      kind: "dialogue",
      title,
      synopsis: str(data.synopsis, synopsis),
      setting: str(data.setting),
      characters: charArr(data.characters),
      lines: dialogueArr(data.lines || data.dialogue),
    };
  }

  if (kind === "story" || "beats" in data) {
    return {
      kind: "story",
      title,
      synopsis: str(data.synopsis, synopsis),
      setting: str(data.setting),
      characters: charArr(data.characters),
      beats: beatArr(data.beats),
      themes: strArr(data.themes),
    };
  }

  return { kind: "plain", title, text: str(data.synopsis, synopsis) };
}
