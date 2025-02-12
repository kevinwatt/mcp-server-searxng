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
const SEARXNG_INSTANCES = [
  'http://localhost:8080'  // 主要使用本地實例
];

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
        description: "Search language code (e.g. 'en', 'all')",
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
    name: "example-servers/searxng-search",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

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
      
      const response = await fetch(searchUrl.toString(), {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
          'User-Agent': 'MCP-SearXNG/1.0'
        },
        body: new URLSearchParams(searchParams).toString()
      });

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
    } catch (error) {
      logError(`Failed to fetch from ${instance}`, error);
      continue;
    }
  }
  throw new Error("All SearXNG instances failed");
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

    const results = await searchWithFallback(args);
    
    return {
      content: [{ 
        type: "text", 
        text: results.results.map((r: any) => 
          `Title: ${r.title}\nURL: ${r.url}\n${r.content ? `Content: ${r.content}\n` : ''}${r.engine ? `Source: ${r.engine}` : ''}`
        ).join('\n\n')
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

// Start server with error handling
async function runServer() {
  const transport = new StdioServerTransport();
  try {
    await server.connect(transport);
    console.error("SearXNG Search MCP Server running on stdio");
  } catch (error) {
    logError('Fatal error running server', error);
    process.exit(1);
  }
}

runServer();
