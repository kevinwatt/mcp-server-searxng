# SearXNG MCP Server
[![smithery badge](https://smithery.ai/badge/@kevinwatt/mcp-server-searxng)](https://smithery.ai/server/@kevinwatt/mcp-server-searxng)

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

### Installing via Smithery

To install SearXNG MCP Server for Claude Desktop automatically via [Smithery](https://smithery.ai/server/@kevinwatt/mcp-server-searxng):

```bash
npx -y @smithery/cli install @kevinwatt/mcp-server-searxng --client claude
```

### Manual Installation
```bash
npm install -g @kevinwatt/mcp-server-searxng
```

## Usage

### Direct Run

```bash
mcp-server-searxng
```

### With Dive Desktop

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

## Prerequisites

You need a local SearXNG instance running. To set it up:

# Run SearXNG with Docker

## Quick Start

```bash
# Create config directory
mkdir -p searxng

# Create config file
tee searxng/settings.yml << EOF
use_default_settings: true

server:
  bind_address: "0.0.0.0"
  port: 8080

search:
  safe_search: 0
  formats:
    - html
    - json

engines:
  - name: google
    engine: google
    shortcut: g

  - name: duckduckgo
    engine: duckduckgo
    shortcut: d

  - name: bing
    engine: bing
    shortcut: b

server.limiter: false
EOF

# Start container
docker run -d \
  --name searxng \
  -p 8080:8080 \
  -v "$(pwd)/searxng:/etc/searxng" \
  searxng/searxng
```

## Test Search Function

```bash
# Test JSON API with curl
curl -v 'http://localhost:8080/search?q=test&format=json'

# Or visit in browser
http://localhost:8080/search?q=test
```

## Container Management

```bash
# Stop container
docker stop searxng

# Remove container
docker rm searxng

# View container logs
docker logs searxng
```

## Custom Configuration

Edit `searxng/settings.yml` to:
- Modify search engine list
- Adjust security settings
- Configure UI language
- Change API limits

For detailed configuration options, see [SearXNG Documentation](https://docs.searxng.org/)
