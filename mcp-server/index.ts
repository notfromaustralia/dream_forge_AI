#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  GetPromptRequestSchema,
  ListPromptsRequestSchema,
  ListResourcesRequestSchema,
  ListToolsRequestSchema,
  ReadResourceRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { healthCheck } from "./src/api-client.js";
import { config, logger, metrics } from "./src/config.js";
import { getPrompt, PROMPTS } from "./src/prompts.js";
import { listResources, readResource } from "./src/resources.js";
import { TOOLS } from "./src/tools/definitions.js";
import { handleToolCall } from "./src/tools/handlers.js";

const server = new Server(
  { name: "dreamforge", version: config.version },
  { capabilities: { tools: {}, prompts: {}, resources: {} } }
);

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  const startTime = Date.now();
  return handleToolCall(
    name,
    args as Record<string, unknown> | undefined,
    startTime
  ) as ReturnType<typeof handleToolCall>;
});

server.setRequestHandler(ListPromptsRequestSchema, async () => ({
  prompts: PROMPTS,
}));

server.setRequestHandler(GetPromptRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;
  return getPrompt(name, args as Record<string, string> | undefined);
});

server.setRequestHandler(ListResourcesRequestSchema, async () => ({
  resources: listResources(),
}));

server.setRequestHandler(ReadResourceRequestSchema, async (request) => {
  const { uri } = request.params;
  return readResource(uri);
});

process.on("SIGINT", async () => {
  logger.info("Shutting down gracefully...");
  if (config.enableMetrics) {
    logger.info("Final metrics:", metrics.getStats());
  }
  await server.close();
  process.exit(0);
});

process.on("uncaughtException", (error) => {
  logger.error("Uncaught exception:", error);
  process.exit(1);
});

async function main() {
  try {
    logger.info("Starting DreamForge MCP Server...");
    logger.info(`API URL: ${config.apiUrl}`);
    logger.info(`Default universe: ${config.defaultUniverse}`);
    logger.info(`Log level: ${config.logLevel}`);
    logger.info(`Tools: ${TOOLS.length} | Prompts: ${PROMPTS.length} | Resources: ${listResources().length}`);

    if (process.env.DREAMFORGE_TEST_CONNECTION === "true") {
      logger.info("Testing API connectivity...");
      await healthCheck();
      logger.info("API connection successful");
    }

    const transport = new StdioServerTransport();
    await server.connect(transport);

    logger.info("DreamForge MCP Server ready");
  } catch (error) {
    logger.error("Failed to start server:", error);
    process.exit(1);
  }
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
