#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";

const API_URL = process.env.DREAMFORGE_API_URL ?? "http://localhost:8000/api/v1";
const DEFAULT_UNIVERSE = process.env.DREAMFORGE_UNIVERSE_ID ?? "uni_dark_fantasy";

async function apiCall(path: string, method = "GET", body?: unknown) {
  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text}`);
  }
  return res.json();
}

const server = new Server(
  { name: "dreamforge", version: "1.0.0" },
  { capabilities: { tools: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [
    {
      name: "create_character",
      description: "Create a new character in a DreamForge universe with AI-generated bio, motivations, and relationships.",
      inputSchema: {
        type: "object",
        properties: {
          universe_id: { type: "string", description: "Universe ID (default: demo dark fantasy)" },
          prompt: { type: "string", description: "Character creation prompt" },
        },
      },
    },
    {
      name: "generate_quest",
      description: "Generate a lore-consistent side quest for a DreamForge universe, optionally involving a faction.",
      inputSchema: {
        type: "object",
        properties: {
          universe_id: { type: "string", description: "Universe ID" },
          prompt: { type: "string", description: "Quest description or requirements" },
          faction_name: { type: "string", description: "Faction to involve (e.g. Shadow Guild)" },
        },
      },
    },
    {
      name: "get_world_context",
      description: "Get condensed lore context for a universe including characters, factions, locations, and events.",
      inputSchema: {
        type: "object",
        properties: {
          universe_id: { type: "string", description: "Universe ID" },
        },
      },
    },
    {
      name: "search_lore",
      description: "Search universe lore using hybrid graph and semantic search.",
      inputSchema: {
        type: "object",
        properties: {
          universe_id: { type: "string", description: "Universe ID" },
          query: { type: "string", description: "Natural language search query" },
        },
        required: ["query"],
      },
    },
    {
      name: "create_dialogue",
      description: "Generate character dialogue for a scene in a universe.",
      inputSchema: {
        type: "object",
        properties: {
          universe_id: { type: "string", description: "Universe ID" },
          character_ids: { type: "array", items: { type: "string" }, description: "Character IDs" },
          scene: { type: "string", description: "Scene description" },
        },
        required: ["scene"],
      },
    },
  ],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const universeId = (args?.universe_id as string) ?? DEFAULT_UNIVERSE;

  try {
    let result: unknown;

    switch (name) {
      case "create_character":
        result = await apiCall(`/universes/${universeId}/generate/character`, "POST", {
          prompt: args?.prompt ?? "Create an interesting character",
        });
        break;
      case "generate_quest":
        result = await apiCall(`/universes/${universeId}/generate/quest`, "POST", {
          prompt: args?.prompt ?? "",
          faction_name: args?.faction_name,
        });
        break;
      case "get_world_context":
        result = await apiCall(`/universes/${universeId}/context`);
        break;
      case "search_lore":
        result = await apiCall(`/universes/${universeId}/search`, "POST", {
          query: args?.query,
          limit: 10,
        });
        break;
      case "create_dialogue":
        result = await apiCall(`/universes/${universeId}/generate/dialogue`, "POST", {
          character_ids: args?.character_ids ?? [],
          scene: args?.scene ?? "A tense confrontation",
        });
        break;
      default:
        throw new Error(`Unknown tool: ${name}`);
    }

    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    };
  } catch (err) {
    return {
      content: [{ type: "text", text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
      isError: true,
    };
  }
});

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
