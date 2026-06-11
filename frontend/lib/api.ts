const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(err || `API error ${res.status}`);
  }
  return res.json();
}

export interface Universe {
  id: string;
  name: string;
  genre: string;
  style: string;
  audience: string;
  prompt: string;
  overview: string;
  status: string;
  creativity_score: number;
  consistency_score: number;
  completeness_score: number;
  wow_score: number;
  entity_counts?: {
    characters: number;
    locations: number;
    factions: number;
    events: number;
    stories: number;
    religions: number;
    magic_systems: number;
    graph_edges: number;
  };
}

export interface Character {
  id: string;
  name: string;
  bio: string;
  motivations: string;
  personality: string;
  story_importance: string;
  era_start: number;
  era_end: number | null;
  faction_id: string | null;
  location_id: string | null;
  portrait_prompt?: string;
  portrait_status?: string;
}

export interface Location {
  id: string;
  name: string;
  location_type: string;
  description: string;
  era_start: number;
  era_end: number | null;
  parent_location_id?: string | null;
}

export interface WorldContext {
  universe_id: string;
  name: string;
  overview: string;
  characters: { id: string; name: string; bio: string }[];
  factions: { id: string; name: string; ideology?: string; power_level?: string; territory?: string }[];
  locations: { id: string; name: string }[];
  events: { id: string; title: string; year: number }[];
  stories: { id: string; name: string }[];
}

export interface ExpandLoreResponse {
  overview?: string;
  error?: string;
  created?: {
    locations: string[];
    factions: string[];
    events: string[];
    timeline: string[];
  };
}

export interface Faction {
  id: string;
  name: string;
  ideology: string;
  power_level: string;
  territory: string;
  era_start?: number;
  era_end?: number | null;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  era_year: number;
  event_type: string;
  impact: string;
}

export interface Story {
  id: string;
  title: string;
  synopsis: string;
  content_json?: string;
  arc_type: string;
  status: string;
}

export interface GraphData {
  nodes: { id: string; type: string; label: string; data: Record<string, unknown> }[];
  edges: { id: string; source: string; target: string; label: string; strength: number }[];
}

export interface TimelineEntry {
  id: string;
  era_year: number;
  label: string;
}

export interface TimelineState {
  era_year: number;
  characters: { id: string; name: string; bio: string }[];
  factions: { id: string; name: string; power: string; ideology?: string; territory?: string }[];
  locations: { id: string; name: string }[];
  events: { id: string; title: string; year: number; description?: string }[];
}

export interface TagsSuggestResponse {
  genre: string;
  style: string;
  audience: string;
  genre_alternatives: string[];
  style_alternatives: string[];
  reasoning: string;
}

export const api = {
  listUniverses: () => request<{ universes: Universe[]; total: number }>("/universes"),
  getUniverse: (id: string) => request<Universe>(`/universes/${id}`),
  updateUniverse: (id: string, body: Partial<Pick<Universe, "name" | "overview" | "prompt" | "genre" | "style" | "audience" | "status">>) =>
    request<Universe>(`/universes/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteUniverse: (id: string) =>
    request<{ deleted: boolean }>(`/universes/${id}`, { method: "DELETE" }),
  suggestTags: (prompt: string) =>
    request<TagsSuggestResponse>("/universes/suggest-tags", {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
  generateUniverse: (body: { prompt: string; genre: string; style: string; audience: string }) =>
    fetch(`${API_URL}/universes/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  getCharacters: (id: string) => request<Character[]>(`/universes/${id}/characters`),
  getFaction: (universeId: string, factionId: string) =>
    request<Faction[]>(`/universes/${universeId}/factions`).then(
      (factions) => factions.find((f) => f.id === factionId) ?? Promise.reject(new Error("Faction not found"))
    ),
  generatePortrait: (universeId: string, characterId: string) =>
    request<{ portrait_prompt: string; image_url: string; portrait_status: string }>(
      `/universes/${universeId}/characters/${characterId}/generate-portrait`,
      { method: "POST" }
    ),
  getFactions: (id: string) => request<Faction[]>(`/universes/${id}/factions`),
  getLocations: (id: string) => request<Location[]>(`/universes/${id}/locations`),
  getEvents: (id: string) => request<Event[]>(`/universes/${id}/events`),
  getStories: (id: string) => request<Story[]>(`/universes/${id}/stories`),
  getStory: (universeId: string, storyId: string) =>
    request<Story[]>(`/universes/${universeId}/stories`).then((stories) => {
      const story = stories.find((s) => s.id === storyId);
      if (!story) return Promise.reject(new Error("Story not found"));
      return story;
    }),
  getGraph: (id: string, eraYear?: number) =>
    request<GraphData>(`/universes/${id}/graph${eraYear ? `?era_year=${eraYear}` : ""}`),
  getTimeline: (id: string) => request<TimelineEntry[]>(`/universes/${id}/timeline`),
  getTimelineState: (id: string, year: number) =>
    request<TimelineState>(`/universes/${id}/timeline/at/${year}`),
  getScores: (id: string) =>
    request<{ consistency: number; creativity: number; completeness: number; wow_factor: number }>(
      `/universes/${id}/scores`
    ),
  generateCharacter: (id: string, prompt: string) =>
    request<unknown>(`/universes/${id}/generate/character`, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
  generateQuest: (id: string, prompt: string, factionName?: string) =>
    request<unknown>(`/universes/${id}/generate/quest`, {
      method: "POST",
      body: JSON.stringify({ prompt, faction_name: factionName || null }),
    }),
  expandStory: (id: string, prompt: string) =>
    request<unknown>(`/universes/${id}/expand/story`, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
  expandLore: (id: string, prompt: string, focus: string = "all") =>
    request<ExpandLoreResponse>(`/universes/${id}/expand/lore`, {
      method: "POST",
      body: JSON.stringify({ prompt, focus }),
    }),
  getWorldContext: (id: string) => request<WorldContext>(`/universes/${id}/context`),
  validate: (id: string) =>
    request<unknown>(`/universes/${id}/validate`, { method: "POST" }),
  councilDebate: (id: string, topic: string, context?: string) =>
    fetch(`${API_URL}/universes/${id}/council/debate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic, context: context ?? "" }),
    }),
  searchLore: (id: string, query: string) =>
    request<{ results: { entity_type: string; entity_id: string; content: string; score: number }[] }>(
      `/universes/${id}/search`,
      { method: "POST", body: JSON.stringify({ query }) }
    ),
};
