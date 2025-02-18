#!/usr/bin/env node

import type { Response } from 'node-fetch';
import fetch from 'node-fetch';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import { Agent } from 'node:https';

// Add console error wrapper
function logError(message: string, error?: unknown) {
  console.error(`Error: ${message}`, error ? `\n${error}` : '');
}

// Primary SearXNG instances for fallback
const SEARXNG_INSTANCES = process.env.SEARXNG_INSTANCES 
  ? process.env.SEARXNG_INSTANCES.split(',')
  : ['http://localhost:8080'];

// HTTP headers with user agent from env
const USER_AGENT = process.env.SEARXNG_USER_AGENT || 'MCP-SearXNG/1.0';

// Add HTTPS agent configuration
const httpsAgent = new Agent({
  rejectUnauthorized: process.env.NODE_TLS_REJECT_UNAUTHORIZED !== '0'
});

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
    version: "0.3.5",
    description: "SearXNG meta search integration for MCP"
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
          'User-Agent': USER_AGENT
        },
        agent: httpsAgent,
        body: new URLSearchParams(searchParams).toString()
      });

      if (!response.ok) {
        logError(`${instance} returned ${response.status}. Please check if SearXNG is running.`);
        continue;
      }

      const data = await response.json();
      if (!data.results?.length) {
        logError(`${instance} returned no results`);
        continue;
      }

      return data;
    } catch (error) {
      logError(`Failed to connect to ${instance}. Please check if SearXNG is running.`, error);
      continue;
    }
  }
  throw new Error("All SearXNG instances failed. Please ensure SearXNG is running on one of these instances: " + SEARXNG_INSTANCES.join(', '));
}

interface SearchResult {
  title: string;
  content?: string;
  url: string;
  engine?: string;
}

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

// Tool handlers
server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: [WEB_SEARCH_TOOL]
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  try {
    const { name, arguments: args } = request.params;

    if (name !== "web_search" || !args) {
      throw new Error("Invalid tool or arguments: expected 'web_search'");
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

runServer();

export { 
  formatSearchResult, 
  isWebSearchArgs, 
  searchWithFallback,
  SEARXNG_INSTANCES
};
