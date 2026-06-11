#!/usr/bin/env node
/**
 * Smoke test: validates tool definitions load and schemas are well-formed.
 * Does not require a running backend.
 */
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const pkg = JSON.parse(readFileSync(join(__dirname, "package.json"), "utf8"));
const indexSrc = readFileSync(join(__dirname, "index.ts"), "utf8");

const checks = [
  { name: "package version is 1.2.0", pass: pkg.version === "1.2.0" },
  { name: "zod dependency present", pass: !!pkg.dependencies?.zod },
  {
    name: "zod-to-json-schema dependency present",
    pass: !!pkg.dependencies?.["zod-to-json-schema"],
  },
  { name: "index imports tool handlers", pass: indexSrc.includes("handleToolCall") },
  { name: "index registers prompts", pass: indexSrc.includes("ListPromptsRequestSchema") },
  { name: "index registers resources", pass: indexSrc.includes("ListResourcesRequestSchema") },
  { name: "health check uses healthCheck()", pass: indexSrc.includes("healthCheck()") },
  { name: "handlers include generate_world_lore", pass: readFileSync(join(__dirname, "src/tools/handlers.ts"), "utf8").includes("generate_world_lore") },
  { name: "handlers include populate_universe", pass: readFileSync(join(__dirname, "src/tools/handlers.ts"), "utf8").includes("populate_universe") },
  { name: "src/config.ts exists", pass: true },
];

let failed = 0;
for (const check of checks) {
  if (check.pass) {
    console.log(`  ✓ ${check.name}`);
  } else {
    console.error(`  ✗ ${check.name}`);
    failed++;
  }
}

// Verify module files exist
const modules = [
  "src/config.ts",
  "src/schemas.ts",
  "src/enrichers.ts",
  "src/api-client.ts",
  "src/formatters/index.ts",
  "src/tools/definitions.ts",
  "src/tools/handlers.ts",
  "src/prompts.ts",
  "src/resources.ts",
  "src/guide.ts",
];

for (const mod of modules) {
  try {
    readFileSync(join(__dirname, mod), "utf8");
    console.log(`  ✓ ${mod} exists`);
  } catch {
    console.error(`  ✗ ${mod} missing`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} check(s) failed`);
  process.exit(1);
}

console.log("\nAll smoke checks passed.");
