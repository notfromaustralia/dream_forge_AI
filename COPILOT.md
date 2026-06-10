# DreamForge + GitHub Copilot

DreamForge integrates with GitHub Copilot via an MCP (Model Context Protocol) server, enabling creative workflows directly from VS Code.

## MCP Server

The MCP server at `mcp-server/index.ts` exposes 5 tools:

| Tool | Description |
|------|-------------|
| `create_character` | AI-generate a character with bio, motivations, relationships |
| `generate_quest` | Create lore-consistent side quests |
| `get_world_context` | Retrieve condensed universe lore for grounding |
| `search_lore` | Hybrid semantic + graph lore search |
| `create_dialogue` | Generate character dialogue for scenes |

## Setup

1. Start the backend: `make backend` or `docker compose up`
2. MCP is configured in `.vscode/mcp.json`
3. In Copilot Chat, try: *"Create a side quest involving the Shadow Guild"*

## How Copilot Was Used

- **Architecture design**: Copilot assisted with FastAPI router patterns and React component structure
- **MCP tool definitions**: Tool schemas and API proxy logic
- **Agent prompts**: System prompts for Lore, Character, Consistency, and Narrative agents
- **Demo data**: Seed script character names and event templates

## Demo Flow

```
User in VS Code: "Create a side quest involving the Shadow Guild"
  → Copilot calls get_world_context(universe_id)
  → Copilot calls generate_quest(universe_id, faction_name="Shadow Guild")
  → Returns quest with objectives, involved characters, and locations
```
