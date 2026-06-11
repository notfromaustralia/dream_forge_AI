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

export interface Faction {
  id: string;
  name: string;
  ideology: string;
  power_level: string;
  territory: string;
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
  factions: { id: string; name: string; power: string }[];
  locations: { id: string; name: string }[];
  events: { id: string; title: string; year: number }[];
}

export interface Location {
  id: string;
  name: string;
  location_type: string;
  description: string;
  era_start: number;
  era_end: number | null;
}

export const api = {
  listUniverses: () => request<{ universes: Universe[]; total: number }>("/universes"),
  getUniverse: (id: string) => request<Universe>(`/universes/${id}`),
  updateUniverse: (id: string, body: { overview?: string; name?: string; genre?: string }) =>
    request<Universe>(`/universes/${id}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  generateUniverse: (body: { prompt: string; genre: string; style: string; audience: string }) =>
    fetch(`${API_URL}/universes/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  getCharacters: (id: string) => request<Character[]>(`/universes/${id}/characters`),
  generatePortrait: (universeId: string, characterId: string) =>
    request<{ portrait_prompt: string; image_url: string; portrait_status: string }>(
      `/universes/${universeId}/characters/${characterId}/generate-portrait`,
      { method: "POST" }
    ),
  getFactions: (id: string) => request<Faction[]>(`/universes/${id}/factions`),
  getLocations: (id: string) => request<Location[]>(`/universes/${id}/locations`),
  getEvents: (id: string) => request<Event[]>(`/universes/${id}/events`),
  getStories: (id: string) => request<Story[]>(`/universes/${id}/stories`),
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
  generateLore: (id: string, prompt?: string) =>
    request<{ overview?: string; created?: Record<string, string[]>; entity_counts?: Universe["entity_counts"] }>(
      `/universes/${id}/generate/lore`,
      { method: "POST", body: JSON.stringify({ prompt: prompt ?? "" }) }
    ),
  generateWorld: (id: string, body: { prompt?: string; character_prompt?: string; quest_count?: number }) =>
    fetch(`${API_URL}/universes/${id}/generate/world`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }),
  generateQuest: (id: string, prompt: string) =>
    request<unknown>(`/universes/${id}/generate/quest`, {
      method: "POST",
      body: JSON.stringify({ prompt }),
    }),
  validate: (id: string) =>
    request<unknown>(`/universes/${id}/validate`, { method: "POST" }),
  councilDebate: (id: string, topic: string) =>
    fetch(`${API_URL}/universes/${id}/council/debate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topic }),
    }),
  searchLore: (id: string, query: string) =>
    request<{ results: { entity_type: string; entity_id: string; content: string; score: number }[] }>(
      `/universes/${id}/search`,
      { method: "POST", body: JSON.stringify({ query }) }
    ),
};
