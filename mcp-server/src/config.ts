export const config = {
  apiUrl: process.env.DREAMFORGE_API_URL ?? "http://localhost:8000/api/v1",
  apiRoot: (process.env.DREAMFORGE_API_URL ?? "http://localhost:8000/api/v1").replace(
    /\/api\/v1\/?$/,
    ""
  ),
  defaultUniverse: process.env.DREAMFORGE_UNIVERSE_ID ?? "uni_dark_fantasy",
  timeout: parseInt(process.env.DREAMFORGE_TIMEOUT_MS ?? "30000", 10),
  maxRetries: parseInt(process.env.DREAMFORGE_MAX_RETRIES ?? "3", 10),
  logLevel: process.env.DREAMFORGE_LOG_LEVEL ?? "info",
  enableMetrics: process.env.DREAMFORGE_ENABLE_METRICS === "true",
  version: "1.2.0",
};

export const logger = {
  debug: (...args: unknown[]) =>
    config.logLevel === "debug" && console.error("[DEBUG]", ...args),
  info: (...args: unknown[]) =>
    ["info", "debug"].includes(config.logLevel) && console.error("[INFO]", ...args),
  warn: (...args: unknown[]) => console.error("[WARN]", ...args),
  error: (...args: unknown[]) => console.error("[ERROR]", ...args),
};

export const metrics = {
  toolCalls: new Map<string, number>(),
  toolErrors: new Map<string, number>(),
  apiLatency: new Map<string, number[]>(),

  recordToolCall(toolName: string) {
    this.toolCalls.set(toolName, (this.toolCalls.get(toolName) ?? 0) + 1);
  },

  recordError(toolName: string) {
    this.toolErrors.set(toolName, (this.toolErrors.get(toolName) ?? 0) + 1);
  },

  recordLatency(toolName: string, ms: number) {
    const latencies = this.apiLatency.get(toolName) ?? [];
    latencies.push(ms);
    if (latencies.length > 100) latencies.shift();
    this.apiLatency.set(toolName, latencies);
  },

  getStats() {
    return {
      toolCalls: Object.fromEntries(this.toolCalls),
      toolErrors: Object.fromEntries(this.toolErrors),
      avgLatency: Object.fromEntries(
        Array.from(this.apiLatency.entries()).map(([tool, latencies]) => [
          tool,
          latencies.reduce((a, b) => a + b, 0) / latencies.length,
        ])
      ),
    };
  },
};
