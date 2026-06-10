export type QuestEnemy = {
  name: string;
  type?: string;
  difficulty?: string;
  count?: number;
};

export type ParsedQuest = {
  kind: "quest";
  title: string;
  description: string;
  objectives: string[];
  locations: string[];
  rewards: string[];
  questGiver: string;
  enemies?: QuestEnemy[];
};

export type ParsedNarrative = {
  kind: "narrative";
  title: string;
  setting: { world?: string; location?: string; era?: string };
  characters: { name: string; role?: string }[];
  plot: {
    introduction?: string;
    conflict?: string;
    climax?: string;
    resolution?: string;
  };
  dialogue?: { character: string; line: string }[];
};

export type ParsedPlain = {
  kind: "plain";
  title: string;
  text: string;
};

export type ParsedStory = ParsedQuest | ParsedNarrative | ParsedPlain;

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((v) => (typeof v === "string" ? v : String(v))).filter(Boolean);
}

function parseQuestObject(quest: Record<string, unknown>, fallbackTitle: string): ParsedQuest {
  const rewardsRaw = quest.rewards;
  let rewards: string[] = [];
  if (Array.isArray(rewardsRaw)) {
    rewards = rewardsRaw.map((r) =>
      typeof r === "string" ? r : typeof r === "object" && r && "item" in r ? String((r as { item: string }).item) : String(r)
    );
  } else if (typeof rewardsRaw === "object" && rewardsRaw) {
    const obj = rewardsRaw as Record<string, unknown>;
    if (obj.gold) rewards.push(`${obj.gold} gold`);
    if (Array.isArray(obj.items)) rewards.push(...asStringArray(obj.items));
  }

  const enemiesRaw = quest.enemies;
  let enemies: QuestEnemy[] | undefined;
  if (Array.isArray(enemiesRaw)) {
    enemies = enemiesRaw.map((e) => {
      if (typeof e === "string") return { name: e };
      const obj = e as Record<string, unknown>;
      return {
        name: String(obj.name ?? "Unknown"),
        type: obj.type ? String(obj.type) : undefined,
        difficulty: obj.difficulty ? String(obj.difficulty) : undefined,
        count: typeof obj.count === "number" ? obj.count : undefined,
      };
    });
  }

  const questGiver = quest.quest_giver ?? quest.questGiver ?? quest.giver;
  return {
    kind: "quest",
    title: String(quest.title ?? fallbackTitle),
    description: String(quest.description ?? ""),
    objectives: asStringArray(quest.objectives),
    locations: asStringArray(quest.locations),
    rewards,
    questGiver: typeof questGiver === "string" ? questGiver : "",
    enemies,
  };
}

function parseNarrativeObject(data: Record<string, unknown>, fallbackTitle: string): ParsedNarrative {
  const settingRaw = data.setting;
  const setting =
    typeof settingRaw === "object" && settingRaw
      ? {
          world: (settingRaw as Record<string, unknown>).world
            ? String((settingRaw as Record<string, unknown>).world)
            : undefined,
          location: (settingRaw as Record<string, unknown>).location
            ? String((settingRaw as Record<string, unknown>).location)
            : undefined,
          era: (settingRaw as Record<string, unknown>).era
            ? String((settingRaw as Record<string, unknown>).era)
            : undefined,
        }
      : {};

  const charsRaw = data.characters;
  const characters = Array.isArray(charsRaw)
    ? charsRaw.map((c) => {
        if (typeof c === "string") return { name: c };
        const obj = c as Record<string, unknown>;
        return { name: String(obj.name ?? "Unknown"), role: obj.role ? String(obj.role) : undefined };
      })
    : [];

  const plotRaw = data.plot;
  const plot =
    typeof plotRaw === "object" && plotRaw
      ? {
          introduction: (plotRaw as Record<string, unknown>).introduction
            ? String((plotRaw as Record<string, unknown>).introduction)
            : undefined,
          conflict: (plotRaw as Record<string, unknown>).conflict
            ? String((plotRaw as Record<string, unknown>).conflict)
            : undefined,
          climax: (plotRaw as Record<string, unknown>).climax
            ? String((plotRaw as Record<string, unknown>).climax)
            : undefined,
          resolution: (plotRaw as Record<string, unknown>).resolution
            ? String((plotRaw as Record<string, unknown>).resolution)
            : undefined,
        }
      : {};

  const dialogueRaw = data.dialogue;
  const dialogue = Array.isArray(dialogueRaw)
    ? dialogueRaw.map((d) => {
        const obj = d as Record<string, unknown>;
        return {
          character: String(obj.character ?? obj.speaker ?? "Unknown"),
          line: String(obj.line ?? obj.text ?? ""),
        };
      })
    : undefined;

  return {
    kind: "narrative",
    title: String(data.title ?? fallbackTitle),
    setting,
    characters,
    plot,
    dialogue,
  };
}

function tryParseJson(text: string): Record<string, unknown> | null {
  try {
    const parsed = JSON.parse(text);
    return typeof parsed === "object" && parsed !== null ? (parsed as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

export function parseStoryContent(
  title: string,
  synopsis: string,
  contentJson?: string
): ParsedStory {
  let data: Record<string, unknown> | null = null;

  if (contentJson && contentJson !== "{}") {
    data = tryParseJson(contentJson);
  }
  if (!data) {
    data = tryParseJson(synopsis);
  }

  if (data) {
    if (data.quest && typeof data.quest === "object") {
      return parseQuestObject(data.quest as Record<string, unknown>, title);
    }
    if ("objectives" in data && ("description" in data || "quest_giver" in data)) {
      return parseQuestObject(data, title);
    }
    if (data.plot || data.setting || data.dialogue) {
      return parseNarrativeObject(data, title);
    }
    if (typeof data.synopsis === "string") {
      return { kind: "plain", title: String(data.title ?? title), text: data.synopsis };
    }
  }

  return { kind: "plain", title, text: synopsis };
}
