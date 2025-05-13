/**
 * Quick Add Templates
 * Defines templates for quickly adding pre-configured MCP servers
 */

const quickAddTemplates = {
  "filesystem-server": {
    "name": "Filesystem Server",
    "description": "Access files from specified directories",
    "category": "File Access",
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
        "name": "actorId",
        "displayName": "Actor ID (optional)",
        "description": "Apify actor to use (default: filip_cicvarek/meetup-scraper)",
        "type": "string",
        "required": false,
        "default": "filip_cicvarek/meetup-scraper",
        "advancedOnly": true
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
        "{actorId}"
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
