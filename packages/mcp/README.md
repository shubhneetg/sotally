# Sotally MCP Server

Access Sotally tools from any AI agent that supports MCP (Model Context Protocol).

## Setup

1. Get an API token from https://sotally.com/dashboard/settings
2. Add to your Claude Desktop config (`~/.claude/mcp.json`):

```json
{
  "mcpServers": {
    "sotally": {
      "command": "npx",
      "args": ["tsx", "packages/mcp/src/index.ts"],
      "env": {
        "SOTALLY_API_URL": "https://sotally.com/api",
        "SOTALLY_API_TOKEN": "YOUR_TOKEN_HERE"
      }
    }
  }
}
```

## Available Tools

- **sotally_list_tools** — Search and browse the tool marketplace
- **sotally_get_tool** — Get details about a specific tool
- **sotally_run_tool** — Execute a tool with inputs
- **sotally_balance** — Check your credit balance
- **sotally_trending** — See trending tools

## Example

Ask Claude: "Search Sotally for email writing tools and run the LinkedIn Cold Message Writer"
