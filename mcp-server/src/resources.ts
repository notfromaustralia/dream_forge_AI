import { apiCall } from "./api-client.js";
import { config } from "./config.js";
import { WORKFLOW_GUIDE } from "./guide.js";

export interface ResourceDef {
  uri: string;
  name: string;
  description: string;
  mimeType: string;
}

export function listResources(): ResourceDef[] {
  return [
    {
      uri: `dreamforge://universe/${config.defaultUniverse}/context`,
      name: "Default Universe Context",
      description: "Live lore snapshot for the default universe",
      mimeType: "application/json",
    },
    {
      uri: `dreamforge://universe/${config.defaultUniverse}/timeline`,
      name: "Default Universe Timeline",
      description: "Historical timeline for the default universe",
      mimeType: "application/json",
    },
    {
      uri: "dreamforge://guide/workflows",
      name: "Workflow Guide",
      description: "DreamForge MCP workflow guide and best practices",
      mimeType: "text/markdown",
    },
  ];
}

export async function readResource(uri: string): Promise<{
  contents: Array<{ uri: string; mimeType: string; text: string }>;
}> {
  const contextMatch = uri.match(/^dreamforge:\/\/universe\/([^/]+)\/context$/);
  if (contextMatch) {
    const universeId = contextMatch[1];
    const data = await apiCall(`/universes/${universeId}/context`);
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  const timelineMatch = uri.match(/^dreamforge:\/\/universe\/([^/]+)\/timeline$/);
  if (timelineMatch) {
    const universeId = timelineMatch[1];
    const data = await apiCall(`/universes/${universeId}/timeline`);
    return {
      contents: [
        {
          uri,
          mimeType: "application/json",
          text: JSON.stringify(data, null, 2),
        },
      ],
    };
  }

  if (uri === "dreamforge://guide/workflows") {
    return {
      contents: [
        {
          uri,
          mimeType: "text/markdown",
          text: WORKFLOW_GUIDE,
        },
      ],
    };
  }

  throw new Error(
    `Unknown resource: ${uri}. Available patterns: dreamforge://universe/{id}/context, dreamforge://universe/{id}/timeline, dreamforge://guide/workflows`
  );
}
