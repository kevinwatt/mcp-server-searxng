# SearXNG MCP Server

An MCP server implementation that integrates with SearXNG, providing privacy-focused meta search capabilities.

## Features

- **Meta Search**: Combines results from multiple search engines
- **Privacy-Focused**: No tracking, no user profiling
- **Multiple Categories**: Support for general, news, science, files, images, videos, and more
- **Language Support**: Search in specific languages or all languages
- **Time Range Filtering**: Filter results by day, week, month, or year
- **Safe Search**: Three levels of safe search filtering
- **Fallback Support**: Multiple SearXNG instances for reliability

## Installation

```bash
npm install -g @modelcontextprotocol/server-searxng
```

## Usage

### Direct Run

```bash
mcp-server-searxng
```

### With Claude Desktop

Add this to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "searxng": {
      "command": "mcp-server-searxng"
    }
  }
}
```

Or using npx:

```json
{
  "mcpServers": {
    "searxng": {
      "command": "npx",
      "args": [
        "-y",
        "@kevinwatt/mcp-server-searxng"
      ]
    }
  }
}
```

## Tool Documentation

- **web_search**
  - Execute meta searches across multiple engines
  - Inputs:
    - `query` (string): Search terms
    - `page` (number, optional): Page number (default: 1)
    - `language` (string, optional): Language code (e.g., 'en', 'all', default: 'all')
    - `categories` (array, optional): Search categories (default: ['general'])
      - Available: "general", "news", "science", "files", "images", "videos", "music", "social media", "it"
    - `time_range` (string, optional): Time filter (day/week/month/year)
    - `safesearch` (number, optional): Safe search level (0: None, 1: Moderate, 2: Strict, default: 1)

## Development

```bash
git clone https://github.com/kevinwatt/mcp-server-searxng.git
cd mcp-server-searxng
npm install
npm run build
npm start
```

## License

This MCP server is licensed under the MIT License. See the LICENSE file for details.
