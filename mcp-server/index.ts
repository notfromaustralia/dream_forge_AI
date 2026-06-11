#!/usr/bin/env node
/**
 * DreamForge MCP server
 *
 * Exposes the DreamForge worldbuilding API as MCP tools over stdio.
 * Requires Node 18 or newer (global fetch and AbortSignal.timeout).
 *
 * Configuration via environment variables:
 *   DREAMFORGE_API_URL            Base URL of the API (default http://localhost:8000/api/v1)
 *   DREAMFORGE_UNIVERSE_ID        Default universe when a tool call omits one (default uni_dark_fantasy)
 *   DREAMFORGE_API_KEY            Optional bearer token sent as an Authorization header
 *   DREAMFORGE_TIMEOUT_MS         Per request timeout in ms (default 30000)
 *   DREAMFORGE_MAX_RETRIES        Extra attempts for idempotent GET calls (default 2)
 *   DREAMFORGE_MAX_RESULT_CHARS   Truncation limit for tool output (default 40000)
 *   DREAMFORGE_LOG_LEVEL          debug | info | warn | error (default info)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

/* ===================== Configuration ===================== */

type LogLevel = "debug" | "info" | "warn" | "error";
const LOG_LEVELS: readonly LogLevel[] = ["debug", "info", "warn", "error"];

function intFromEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const parsed = Number.parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function levelFromEnv(fallback: LogLevel): LogLevel {
  const raw = process.env.DREAMFORGE_LOG_LEVEL as LogLevel | undefined;
  return raw && LOG_LEVELS.includes(raw) ? raw : fallback;
}

const CONFIG = {
  apiUrl: (process.env.DREAMFORGE_API_URL ?? "http://localhost:8000/api/v1").replace(/\/+$/, ""),
  defaultUniverse: process.env.DREAMFORGE_UNIVERSE_ID ?? "uni_dark_fantasy",
  apiKey: process.env.DREAMFORGE_API_KEY,
  timeoutMs: intFromEnv("DREAMFORGE_TIMEOUT_MS", 30_000),
  maxRetries: intFromEnv("DREAMFORGE_MAX_RETRIES", 2),
  maxResultChars: intFromEnv("DREAMFORGE_MAX_RESULT_CHARS", 40_000),
  logLevel: levelFromEnv("info"),
} as const;

/* ===================== Logging ===================== */
/* stdout carries the MCP protocol on stdio transport. Every log line must
   go to stderr or the JSON RPC stream gets corrupted. Never console.log here. */

const LEVEL_RANK: Record<LogLevel, number> = { debug: 10, info: 20, warn: 30, error: 40 };

function log(level: LogLevel, message: string, extra?: Record<string, unknown>): void {
  if (LEVEL_RANK[level] < LEVEL_RANK[CONFIG.logLevel]) return;
  const line = JSON.stringify({ time: new Date().toISOString(), level, message, ...extra });
  process.stderr.write(line + "\n");
}

/* ===================== API client ===================== */

class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: string,
  ) {
    super(`DreamForge API responded with status ${status}`);
    this.name = "ApiError";
  }
}

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
const backoffMs = (attempt: number) =>
  Math.min(250 * 2 ** (attempt - 1), 2_000) + Math.floor(Math.random() * 100);

interface ApiCallOptions {
  method?: "GET" | "POST";
  body?: unknown;
}

/**
 * Calls the DreamForge API with a timeout. Only idempotent GET requests are
 * retried; POSTs hit generation endpoints where a retry could silently create
 * duplicate (and expensive) entities.
 */
async function apiCall<T = unknown>(
  path: string,
  { method = "GET", body }: ApiCallOptions = {},
): Promise<T> {
  const url = `${CONFIG.apiUrl}${path}`;
  const idempotent = method === "GET";
  const maxAttempts = idempotent ? CONFIG.maxRetries + 1 : 1;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          ...(CONFIG.apiKey ? { Authorization: `Bearer ${CONFIG.apiKey}` } : {}),
        },
        body: body === undefined ? undefined : JSON.stringify(body),
        signal: AbortSignal.timeout(CONFIG.timeoutMs),
      });

      if (!res.ok) {
        const errBody = (await res.text().catch(() => "")).slice(0, 2_000);
        if (idempotent && RETRYABLE_STATUS.has(res.status) && attempt < maxAttempts) {
          log("warn", "retrying after API error", { url, status: res.status, attempt });
          await sleep(backoffMs(attempt));
          continue;
        }
        throw new ApiError(res.status, errBody);
      }

      return (await res.json()) as T;
    } catch (err) {
      if (err instanceof ApiError) throw err;

      const timedOut = err instanceof Error && err.name === "TimeoutError";
      if (idempotent && attempt < maxAttempts) {
        log("warn", "retrying after network failure", { url, attempt, timedOut });
        await sleep(backoffMs(attempt));
        continue;
      }

      const cause = (err as { cause?: { code?: string } }).cause?.code;
      throw new Error(
        timedOut
          ? `DreamForge API timed out after ${CONFIG.timeoutMs}ms (${method} ${path})`
          : `DreamForge API unreachable at ${CONFIG.apiUrl} (${method} ${path}): ` +
            `${err instanceof Error ? err.message : String(err)}${cause ? ` [${cause}]` : ""}`,
      );
    }
  }

  throw new Error("unreachable");
}

/* ===================== Tool result helpers ===================== */

/**
 * Tool output lands directly in a model context window, so it is capped.
 * A full world context dump can otherwise crowd out everything else.
 */
function ok(data: unknown): CallToolResult {
  let text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
  if (text.length > CONFIG.maxResultChars) {
    const omitted = text.length - CONFIG.maxResultChars;
    text =
      text.slice(0, CONFIG.maxResultChars) +
      `\n\n[truncated: ${omitted} characters omitted. Narrow the request or raise DREAMFORGE_MAX_RESULT_CHARS.]`;
  }
  return { content: [{ type: "text", text }] };
}

function fail(err: unknown): CallToolResult {
  const text =
    err instanceof ApiError
      ? `DreamForge API error ${err.status}: ${err.body || "(no response body)"}`
      : err instanceof Error
        ? err.message
        : String(err);
  return { content: [{ type: "text", text }], isError: true };
}

/** Wraps a tool handler with uniform error handling and timing logs. */
function handle<Args>(name: string, fn: (args: Args) => Promise<unknown>) {
  return async (args: Args): Promise<CallToolResult> => {
    const started = Date.now();
    try {
      const data = await fn(args);
      log("debug", "tool succeeded", { tool: name, ms: Date.now() - started });
      return ok(data);
    } catch (err) {
      log("error", "tool failed", {
        tool: name,
        ms: Date.now() - started,
        error: err instanceof Error ? err.message : String(err),
      });
      return fail(err);
    }
  };
}

function universePath(universeId: string | undefined): string {
  return `/universes/${encodeURIComponent(universeId ?? CONFIG.defaultUniverse)}`;
}

/* ===================== Input schemas ===================== */
/* zod schemas are enforced at runtime by the SDK before handlers run.
   The previous JSON Schema "required" markers were never actually enforced. */

const UniverseId = z
  .string()
  .min(1)
  .describe("Universe ID; omit to use the configured default universe");

const CreateCharacterInput = z.object({
  universe_id: UniverseId.optional(),
  prompt: z
    .string()
    .min(1)
    .describe("Character concept or creation brief, e.g. 'a disgraced knight seeking redemption'"),
});

const GenerateQuestInput = z.object({
  universe_id: UniverseId.optional(),
  prompt: z.string().min(1).describe("Quest premise or requirements"),
  faction_name: z
    .string()
    .min(1)
    .optional()
    .describe("Faction to involve, e.g. Shadow Guild"),
});

const GetWorldContextInput = z.object({
  universe_id: UniverseId.optional(),
});

const SearchLoreInput = z.object({
  universe_id: UniverseId.optional(),
  query: z.string().min(1).describe("Natural language search query"),
  limit: z.number().int().min(1).max(50).default(10).describe("Maximum results to return"),
});

const CreateDialogueInput = z.object({
  universe_id: UniverseId.optional(),
  character_ids: z
    .array(z.string().min(1))
    .default([])
    .describe("Character IDs present in the scene; an empty list defers to the backend"),
  scene: z.string().min(1).describe("Scene description"),
});

/* ===================== Server and tools ===================== */

const server = new McpServer({ name: "dreamforge", version: "1.1.0" });

server.registerTool(
  "create_character",
  {
    title: "Create character",
    description:
      "Create a new character in a DreamForge universe with AI generated bio, motivations, and relationships.",
    inputSchema: CreateCharacterInput.shape,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  handle("create_character", async (args: z.infer<typeof CreateCharacterInput>) =>
    apiCall(`${universePath(args.universe_id)}/generate/character`, {
      method: "POST",
      body: { prompt: args.prompt },
    }),
  ),
);

server.registerTool(
  "generate_quest",
  {
    title: "Generate quest",
    description:
      "Generate a lore consistent side quest for a DreamForge universe, optionally involving a faction.",
    inputSchema: GenerateQuestInput.shape,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  handle("generate_quest", async (args: z.infer<typeof GenerateQuestInput>) =>
    apiCall(`${universePath(args.universe_id)}/generate/quest`, {
      method: "POST",
      body: { prompt: args.prompt, faction_name: args.faction_name },
    }),
  ),
);

server.registerTool(
  "get_world_context",
  {
    title: "Get world context",
    description:
      "Get condensed lore context for a universe including characters, factions, locations, and events.",
    inputSchema: GetWorldContextInput.shape,
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  handle("get_world_context", async (args: z.infer<typeof GetWorldContextInput>) =>
    apiCall(`${universePath(args.universe_id)}/context`),
  ),
);

server.registerTool(
  "search_lore",
  {
    title: "Search lore",
    description: "Search universe lore using hybrid graph and semantic search.",
    inputSchema: SearchLoreInput.shape,
    annotations: { readOnlyHint: true, idempotentHint: true },
  },
  handle("search_lore", async (args: z.infer<typeof SearchLoreInput>) =>
    apiCall(`${universePath(args.universe_id)}/search`, {
      method: "POST",
      body: { query: args.query, limit: args.limit },
    }),
  ),
);

server.registerTool(
  "create_dialogue",
  {
    title: "Create dialogue",
    description: "Generate character dialogue for a scene in a universe.",
    inputSchema: CreateDialogueInput.shape,
    annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false },
  },
  handle("create_dialogue", async (args: z.infer<typeof CreateDialogueInput>) =>
    apiCall(`${universePath(args.universe_id)}/generate/dialogue`, {
      method: "POST",
      body: { character_ids: args.character_ids, scene: args.scene },
    }),
  ),
);

/* ===================== Lifecycle ===================== */

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  log("info", "DreamForge MCP server connected", {
    apiUrl: CONFIG.apiUrl,
    defaultUniverse: CONFIG.defaultUniverse,
    timeoutMs: CONFIG.timeoutMs,
  });
}

for (const signal of ["SIGINT", "SIGTERM"] as const) {
  process.on(signal, () => {
    log("info", "shutting down", { signal });
    void server.close().finally(() => process.exit(0));
  });
}

main().catch((err) => {
  log("error", "fatal startup error", {
    error: err instanceof Error ? err.message : String(err),
  });
  process.exit(1);
});