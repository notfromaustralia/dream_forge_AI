import type { FormatContext } from "../types.js";

export function formatGenericResponse(
  toolName: string,
  result: unknown,
  ctx: FormatContext
): string {
  const sections: string[] = [`## ${toolName.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}\n`];

  if (result && typeof result === "object") {
    const obj = result as Record<string, unknown>;
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith("_")) continue;
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        sections.push(`**${key}:** ${value}`);
      } else if (Array.isArray(value)) {
        sections.push(`**${key}:** ${value.length} items`);
      } else if (value && typeof value === "object") {
        sections.push(`**${key}:** ${JSON.stringify(value, null, 2)}`);
      }
    }
  } else {
    sections.push(String(result));
  }

  return sections.join("\n");
}
