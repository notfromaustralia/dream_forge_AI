import { config, logger, metrics } from "./config.js";
import type { ApiError } from "./types.js";

export async function apiCall(
  path: string,
  method = "GET",
  body?: unknown,
  retryCount = 0
): Promise<unknown> {
  const url = `${config.apiUrl}${path}`;
  const startTime = Date.now();
  const requestId = Math.random().toString(36).substring(7);

  logger.debug(`[${requestId}] ${method} ${url}`, body ? { body } : "");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout);

  try {
    const response = await fetch(url, {
      method,
      headers: {
        "Content-Type": "application/json",
        "X-Request-ID": requestId,
        "User-Agent": `dreamforge-mcp/${config.version}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latency = Date.now() - startTime;

    if (!response.ok) {
      const text = await response.text();
      const isRetryable = response.status >= 500 || response.status === 429;
      const error = new Error(
        `API ${response.status}: ${text.substring(0, 200)}`
      ) as ApiError;
      error.status = response.status;
      error.retryable = isRetryable;

      if (isRetryable && retryCount < config.maxRetries) {
        const delay = Math.pow(2, retryCount) * 1000;
        logger.warn(
          `[${requestId}] Retryable error ${response.status}, retrying in ${delay}ms (${retryCount + 1}/${config.maxRetries})`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        return apiCall(path, method, body, retryCount + 1);
      }

      throw error;
    }

    const data = await response.json();
    logger.debug(`[${requestId}] Response (${latency}ms)`, data);

    if (config.enableMetrics) {
      const toolName = path.split("/").pop() ?? "unknown";
      metrics.recordLatency(toolName, latency);
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);

    if (error instanceof Error && error.name === "AbortError") {
      const timeoutError = new Error(
        `Request timeout after ${config.timeout}ms`
      ) as ApiError;
      timeoutError.retryable = true;

      if (retryCount < config.maxRetries) {
        logger.warn(
          `[${requestId}] Timeout, retrying (${retryCount + 1}/${config.maxRetries})`
        );
        return apiCall(path, method, body, retryCount + 1);
      }
      throw timeoutError;
    }

    throw error;
  }
}

export async function healthCheck(): Promise<unknown> {
  const url = `${config.apiRoot}/health`;
  const response = await fetch(url, {
    headers: { "User-Agent": `dreamforge-mcp/${config.version}` },
  });
  if (!response.ok) {
    throw new Error(`Health check failed: ${response.status}`);
  }
  return response.json();
}

export async function consumeSSE(
  path: string,
  body?: unknown
): Promise<Record<string, unknown>[]> {
  const url = `${config.apiUrl}${path}`;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), config.timeout * 2);

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "text/event-stream",
        "User-Agent": `dreamforge-mcp/${config.version}`,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const text = await response.text();
      const error = new Error(
        `API ${response.status}: ${text.substring(0, 200)}`
      ) as ApiError;
      error.status = response.status;
      throw error;
    }

    const text = await response.text();
    const events: Record<string, unknown>[] = [];

    for (const line of text.split("\n")) {
      if (line.startsWith("data: ")) {
        try {
          events.push(JSON.parse(line.slice(6)) as Record<string, unknown>);
        } catch {
          // skip malformed SSE lines
        }
      }
    }

    return events;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

export async function fetchCharacters(
  universeId: string,
  characterIds?: string[]
): Promise<import("./types.js").CharacterRecord[]> {
  const all = (await apiCall(
    `/universes/${universeId}/characters`
  )) as import("./types.js").CharacterRecord[];

  if (!characterIds?.length) return all;
  const idSet = new Set(characterIds);
  return all.filter((c) => idSet.has(c.id));
}
