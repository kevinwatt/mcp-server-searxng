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
# 建立設定目錄
mkdir -p searxng

# 建立設定檔
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

# 啟動容器
docker run -d \
  --name searxng \
  -p 8080:8080 \
  -v "$(pwd)/searxng:/etc/searxng" \
  searxng/searxng
```

## 測試搜尋功能

```bash
# 使用 curl 測試 JSON API
curl -v 'http://localhost:8080/search?q=test&format=json'

# 或直接在瀏覽器訪問
http://localhost:8080/search?q=test
```

## 管理容器

```bash
# 停止容器
docker stop searxng

# 移除容器
docker rm searxng

# 查看容器日誌
docker logs searxng
```

## 自訂設定

編輯 `searxng/settings.yml` 可以:
- 修改搜尋引擎列表
- 調整安全設定
- 設定 UI 語言
- 更改 API 限制

詳細設定選項請參考 [SearXNG 官方文件](https://docs.searxng.org/)
