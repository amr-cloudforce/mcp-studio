/**
 * Quick Add Templates
 * Defines templates for quickly adding pre-configured MCP servers
 */

const quickAddTemplates = {
  "filesystem-server": {
    "name": "Filesystem Server",
    "description": "Access files from specified directories",
    "category": "File Access",
    "icon": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234A56E2'%3E%3Cpath d='M20 6h-8l-2-2H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm0 12H4V8h16v10z'/%3E%3C/svg%3E",
    "userInputs": [
      {
        "name": "directories",
        "displayName": "Directories",
        "description": "Select directories to allow access to",
        "type": "directory-list",
        "required": true
      },
      {
        "name": "initialState",
        "displayName": "Initial State",
        "description": "Whether the server should be active or inactive when added",
        "type": "select",
        "options": ["active", "inactive"],
        "default": "active",
        "advancedOnly": true
      }
    ],
    "config": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem"
        // Directories will be added dynamically
      ]
    }
  },
  "apify-web-adapter": {
    "name": "Apify Web Scraper",
    "description": "Scrape websites using Apify's actors",
    "category": "Web Scraping",
    "icon": "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%23FF8C00'%3E%3Cpath d='M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95C8.08 7.14 9.94 6 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11c1.56.1 2.78 1.41 2.78 2.96 0 1.65-1.35 3-3 3z'/%3E%3C/svg%3E",
    "userInputs": [
      {
        "name": "APIFY_TOKEN",
        "displayName": "Apify API Token",
        "description": "Your Apify API token from apify.com",
        "type": "string",
        "required": true,
        "secret": true
      },
      {
        "name": "actorIds",
        "displayName": "Actor IDs",
        "description": "Add one or more Apify actors to use",
        "type": "actor-list",
        "required": true
      },
      {
        "name": "initialState",
        "displayName": "Initial State",
        "description": "Whether the server should be active or inactive when added",
        "type": "select",
        "options": ["active", "inactive"],
        "default": "active",
        "advancedOnly": true
      }
    ],
    "config": {
      "command": "npx",
      "args": [
        "-y",
        "@apify/actors-mcp-server",
        "--actors",
        "{actorIds}"
      ],
      "env": {
        "APIFY_TOKEN": "{APIFY_TOKEN}"
      }
    }
  },
  "tavily-mcp": {
    "name": "Tavily Search",
    "description": "AI-powered search engine",
    "category": "Search & Research",
    "icon": "https://mintlify.s3-us-west-1.amazonaws.com/tavilyai/_generated/favicon/apple-touch-icon.png?v=3",
    "userInputs": [
      {
        "name": "TAVILY_API_KEY",
        "displayName": "Tavily API Key",
        "description": "Your Tavily API key",
        "type": "string",
        "required": true,
        "secret": true
      },
      {
        "name": "initialState",
        "displayName": "Initial State",
        "description": "Whether the server should be active or inactive when added",
        "type": "select",
        "options": ["active", "inactive"],
        "default": "active",
        "advancedOnly": true
      }
    ],
    "config": {
      "command": "npx",
      "args": [
        "-y",
        "tavily-mcp@0.1.4"
      ],
      "env": {
        "TAVILY_API_KEY": "{TAVILY_API_KEY}"
      }
    }
  }
};

// Export the templates
export default quickAddTemplates;
