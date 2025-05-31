# Smithery Marketplace Integration Workflow

This document provides a comprehensive guide to integrating the Smithery marketplace in MCP Studio, enabling users to browse, search, and install MCP servers from the Smithery registry.

## Table of Contents

1. [Overview](#overview)
2. [API Endpoints](#api-endpoints)
3. [Core Components](#core-components)
4. [Connection Types](#connection-types)
5. [Workflow Sequence](#workflow-sequence)
6. [Implementation Plan](#implementation-plan)

## Overview

The Smithery integration allows users to:
- Browse and search MCP servers from the Smithery registry
- View detailed server information including tools and connection options
- Install servers with either stdio (local) or http (hosted) connections
- Automatically generate proper MCP configuration

### Key Differences from Composio
- **Global credentials**: Single API key + profile for entire marketplace
- **Two connection types**: stdio (local execution) and http (hosted service)
- **Different config format**: Uses `@smithery/cli` commands
- **No per-app authentication**: Credentials are marketplace-level

## API Endpoints

### List Servers
```
GET https://registry.smithery.ai/servers?page=1&pageSize=10
Authorization: Bearer {api_key}
```

**Response:**
```json
{
  "servers": [
    {
      "qualifiedName": "@wonderwhy-er/desktop-commander",
      "displayName": "Desktop Commander",
      "description": "Execute terminal commands and manage files...",
      "createdAt": "2025-01-10T06:39:31.942Z",
      "useCount": 836176,
      "homepage": "https://smithery.ai/server/@wonderwhy-er/desktop-commander"
    }
  ],
  "pagination": {
    "currentPage": 1,
    "pageSize": 10,
    "totalPages": 5,
    "totalCount": 50
  }
}
```

### Search Servers
```
GET https://registry.smithery.ai/servers?q=memory&page=1&pageSize=10
Authorization: Bearer {api_key}
```

### Get Server Details
```
GET https://registry.smithery.ai/servers/@jlia0/servers
Authorization: Bearer {api_key}
```

**Response:**
```json
{
  "qualifiedName": "@jlia0/servers",
  "displayName": "Knowledge Graph Memory Server",
  "remote": false,
  "iconUrl": "https://icons.duckduckgo.com/ip3/modelcontextprotocol.io.ico",
  "connections": [
    {
      "type": "stdio",
      "configSchema": {
        "type": "object",
        "properties": {
          "memoryFilePath": {
            "type": "string",
            "default": "memory.json",
            "description": "Path to the memory storage file"
          }
        }
      },
      "stdioFunction": "config => ({ command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory'] })"
    },
    {
      "type": "http",
      "deploymentUrl": "https://server.smithery.ai/@jlia0/servers/mcp",
      "configSchema": {
        "type": "object",
        "properties": {
          "memoryFilePath": {
            "type": "string",
            "default": "memory.json",
            "description": "Path to the memory storage file"
          }
        }
      }
    }
  ],
  "tools": [
    {
      "name": "create_entities",
      "description": "Create multiple new entities in the knowledge graph",
      "inputSchema": { /* ... */ }
    }
  ]
}
```

## Core Components

### 1. Service Layer (`smithery-service.js`)

```javascript
// Core service functions
function initializeSDK(apiKey, profile) {
  // Store credentials for API calls
}

async function listServers(options = {}) {
  // GET /servers with pagination and search
}

async function getServerDetails(qualifiedName) {
  // GET /servers/{qualifiedName}
}

async function validateCredentials() {
  // Test API call to verify credentials
}
```

### 2. Connection Handler (`smithery-connector.js`)

```javascript
// Handle different connection types
async function handleStdioConnection(server, userConfig) {
  // Process stdio connection with user parameters
}

async function handleHttpConnection(server, apiKey, profile) {
  // Process http connection with global credentials
}

async function generateConfig(server, connectionType, params) {
  // Generate MCP configuration based on connection type
}
```

### 3. UI Components

Following the existing marketplace pattern:
- `js/features/smithery-marketplace/`
  - `index.js` - Main entry point
  - `data.js` - API data fetching
  - `ui.js` - UI rendering
  - `search.js` - Search functionality
  - `details.js` - Server details modal
  - `connector.js` - Installation logic

## Connection Types

### Stdio Connection (Local Execution)

**User Flow:**
1. User selects stdio connection
2. System shows configuration form based on `configSchema`
3. User fills in required parameters
4. System evaluates `stdioFunction` with user config
5. System generates MCP config with resulting command/args

**Example:**
```javascript
// Server provides:
"stdioFunction": "config => ({ command: 'npx', args: ['-y', '@modelcontextprotocol/server-memory'] })"

// User provides:
{ "memoryFilePath": "my-memory.json" }

// System generates:
{
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-memory"]
}
```

### HTTP Connection (Hosted Service)

**User Flow:**
1. User selects http connection
2. System shows deployment URL and explains hosted setup
3. User confirms they want to use hosted version
4. System generates MCP config using `@smithery/cli`

**Example:**
```javascript
// Server provides:
"deploymentUrl": "https://server.smithery.ai/@arjunkmrm/perplexity-search/mcp"

// System generates:
{
  "command": "npx",
  "args": [
    "-y",
    "@smithery/cli@latest",
    "run",
    "@arjunkmrm/perplexity-search",
    "--key",
    "12e10550-7b53-40d0-8ac3-xxx",
    "--profile",
    "legitimate-firefly-bSrBxD"
  ]
}
```

## Workflow Sequence

```mermaid
sequenceDiagram
    participant U as User
    participant UI as Smithery UI
    participant S as Smithery Service
    participant API as Smithery API
    participant CM as Config Manager

    Note over U,CM: Phase 1: Setup Credentials
    U->>UI: Enter API Key + Profile
    UI->>S: initializeSDK(apiKey, profile)
    S->>API: Validate credentials
    API-->>S: Validation result
    S-->>UI: Credentials valid
    UI->>S: listServers()
    S->>API: GET /servers?page=1&pageSize=20
    API-->>S: Server list
    S-->>UI: Display servers

    Note over U,CM: Phase 2: Server Selection
    U->>UI: Select server + click "View Details"
    UI->>S: getServerDetails(qualifiedName)
    S->>API: GET /servers/{qualifiedName}
    API-->>S: Server details + connections
    S-->>UI: Show connection types

    Note over U,CM: Phase 3A: Stdio Installation
    U->>UI: Choose "Local (stdio)" + fill config
    UI->>S: installStdioServer(server, config)
    S->>S: Evaluate stdioFunction with config
    S->>CM: Add server with generated command/args
    CM-->>S: Config saved
    S-->>UI: Installation complete

    Note over U,CM: Phase 3B: HTTP Installation
    U->>UI: Choose "Hosted (http)"
    UI->>S: installHttpServer(server, apiKey, profile)
    S->>S: Generate @smithery/cli command
    S->>CM: Add server with cli command
    CM-->>S: Config saved
    S-->>UI: Installation complete
```

## Implementation Plan

### Phase 1: Core Service Layer
1. Create `smithery-service.js` with API wrapper functions
2. Implement credential validation and storage
3. Add server listing and search functionality
4. Add server details fetching

### Phase 2: Connection Handlers
1. Create `smithery-connector.js` for installation logic
2. Implement stdio connection handler with config evaluation
3. Implement http connection handler with cli generation
4. Add config generation utilities

### Phase 3: UI Integration
1. Create marketplace UI components following existing pattern
2. Add server browsing and search interface
3. Implement server details modal with connection options
4. Add installation flow with parameter collection

### Phase 4: Configuration Integration
1. Integrate with existing config manager
2. Add proper error handling and validation
3. Implement installation status feedback
4. Add server management capabilities

### File Structure
```
js/features/smithery-marketplace/
├── index.js              # Main entry point
├── smithery-service.js   # API service layer
├── smithery-connector.js # Installation logic
├── data.js              # Data fetching utilities
├── ui.js                # UI rendering
├── search.js            # Search functionality
├── details.js           # Server details modal
├── items.js             # Server list items
└── modal.js             # Main marketplace modal
```

### Configuration Examples

**Stdio Server Config:**
```json
{
  "memory-server": {
    "command": "npx",
    "args": ["-y", "@modelcontextprotocol/server-memory"]
  }
}
```

**HTTP Server Config:**
```json
{
  "perplexity-search": {
    "command": "npx",
    "args": [
      "-y",
      "@smithery/cli@latest",
      "run",
      "@arjunkmrm/perplexity-search",
      "--key",
      "12e10550-7b53-40d0-8ac3-xxx",
      "--profile",
      "legitimate-firefly-bSrBxD"
    ]
  }
}
```

This integration will provide users with access to the extensive Smithery marketplace while maintaining consistency with the existing MCP Studio interface and patterns.
