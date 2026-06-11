export interface ToolResult {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
  [key: string]: unknown;
}

export interface ApiError extends Error {
  status?: number;
  retryable?: boolean;
}

export interface AgentReasoning {
  thought?: string;
  action?: string;
  observation?: string;
}

export interface CharacterRecord {
  id: string;
  name: string;
  bio?: string;
  motivations?: string;
  personality?: string;
  story_importance?: string;
  era_start?: number;
  faction_id?: string | null;
  location_id?: string | null;
}

export interface SearchResultItem {
  entity_type: string;
  entity_id: string;
  content: string;
  score: number;
}

export interface FormatContext {
  universeId: string;
  durationMs: number;
  characters?: CharacterRecord[];
  worldContext?: Record<string, unknown>;
}
