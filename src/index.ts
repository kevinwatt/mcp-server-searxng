#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';

// Add console error wrapper
function logError(message: string, error?: unknown) {
  console.error(`Error: ${message}`, error ? `\n${error}` : '');
}

// Primary SearXNG instances for fallback
let SEARXNG_INSTANCES = process.env.SEARXNG_INSTANCES 
  ? process.env.SEARXNG_INSTANCES.split(',')
  : ['http://localhost:8080'];  // Default to localhost if not specified

const WEB_SEARCH_TOOL: Tool = {
  name: "web_search",
  description: 
    "Performs a web search using SearXNG, ideal for general queries, news, articles and online content. " +
    "Supports multiple search categories, languages, time ranges and safe search filtering. " +
    "Returns relevant results from multiple search engines combined.",
  inputSchema: {
    type: "object",
    properties: {
      query: {
        type: "string",
        description: "Search query"
      },
      page: {
        type: "number", 
        description: "Page number (default 1)",
        default: 1
      },
      language: {
        type: "string",
        description: "Search language code (e.g. 'en', 'zh', 'jp', 'all')",
        default: "all"
      },
      categories: {
        type: "array",
        items: {
          type: "string",
          enum: ["general", "news", "science", "files", "images", "videos", "music", "social media", "it"]
        },
        default: ["general"]
      },
      time_range: {
        type: "string",
        enum: ["", "day", "week", "month", "year"],
        default: ""
      },
      safesearch: {
        type: "number",
        description: "0: None, 1: Moderate, 2: Strict",
        default: 1
      }
    },
    required: ["query"]
  }
};

// Server implementation
const server = new Server(
  {
    name: "kevinwatt/mcp-server-searxng",
    version: "0.3.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

// HTTP headers configuration
const DEFAULT_HEADERS = {
  'Accept': 'application/json',
  'Content-Type': 'application/x-www-form-urlencoded',
  'User-Agent': process.env.SEARXNG_USER_AGENT || 'MCP-SearXNG/1.0'
};

// Helper function to try different instances
async function searchWithFallback(params: any) {
  const searchParams = {
    q: params.query,
    pageno: params.page || 1,
    language: params.language || 'all',
    categories: params.categories?.join(',') || 'general',
    time_range: params.time_range || '',
    safesearch: params.safesearch ?? 1,
    format: 'json'
  };

  for (const instance of SEARXNG_INSTANCES) {
    try {
      const searchUrl = new URL('/search', instance);
      
      // Add timeout control
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 seconds timeout

      try {
        const response = await fetch(searchUrl.toString(), {
          method: 'POST',
          headers: DEFAULT_HEADERS,
          body: new URLSearchParams(searchParams).toString(),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          logError(`${instance} returned ${response.status}`);
          continue;
        }

        const data = await response.json();
        if (!data.results?.length) {
          logError(`${instance} returned no results`);
          continue;
        }

        return data;
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      logError(`Failed to fetch from ${instance}`, error);
      continue;
    }
  }
  throw new Error("All SearXNG instances failed");
}

interface SearchResult {
  title: string;
  content?: string;
  url: string;
  engine?: string;
}

// Format search result
function formatSearchResult(result: SearchResult) {
  const parts = [
    `Title: ${result.title}`,
    `URL: ${result.url}`
  ];

  if (result.content) {
    parts.push(`Content: ${result.content}`);
  }

  if (result.engine) {
    parts.push(`Source: ${result.engine}`);
  }

  return parts.join('\n');
}

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [WEB_SEARCH_TOOL],
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (name !== "web_search" || !args) {
      throw new Error("Invalid tool or arguments");
    }

    if (!isWebSearchArgs(args)) {
      throw new Error("Invalid arguments for web_search");
    }

    const results = await searchWithFallback(args);
    
    return {
      content: [{ 
        type: "text", 
        text: results.results.map(formatSearchResult).join('\n\n')
      }],
      isError: false,
    };
  } catch (error) {
    logError('Search failed', error);
    return {
      content: [{ type: "text", text: String(error) }],
      isError: true,
    };
  }
});

function isWebSearchArgs(args: unknown): args is {
  query: string;
  page?: number;
  language?: string;
  categories?: string[];
  time_range?: string;
  safesearch?: number;
} {
  return (
    typeof args === "object" &&
    args !== null &&
    "query" in args &&
    typeof (args as { query: string }).query === "string"
  );
}

// 修改 runServer 為可選的運行
export async function runServer() {
  const transport = new StdioServerTransport();
  try {
    await server.connect(transport);
    console.error("SearXNG Search MCP Server running on stdio");
  } catch (error) {
    logError('Fatal error running server', error);
    process.exit(1);
  }
}

// 只在直接運行時執行
if (import.meta.url === `file://${process.argv[1]}`) {
  runServer();
}

export { 
  formatSearchResult, 
  isWebSearchArgs, 
  searchWithFallback,
  SEARXNG_INSTANCES
};