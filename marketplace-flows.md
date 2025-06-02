# Marketplace Loading Flows - Complete Lifecycle with Evidence

This document provides comprehensive Mermaid sequence diagrams showing the complete lifecycle of every marketplace operation including external server communication, caching, networking delays, and data traffic. Every step is backed by actual code evidence.

## 1. General Marketplace Complete Lifecycle

```mermaid
sequenceDiagram
    participant User
    participant App
    participant GitHub
    
    Note over User,GitHub: INITIALIZATION PHASE
    User->>App: Opens General Marketplace
    App->>App: Load marketplace.json (local file)
    App->>App: Filter & categorize items
    App->>User: Display marketplace categories
    
    Note over User,GitHub: SEARCH PHASE (Local Only)
    User->>App: Types search query
    App->>App: Filter items locally (no network)
    App->>User: Update display
    
    Note over User,GitHub: DETAILS PHASE
    User->>App: Selects Item
    App->>GitHub: GET README.md (raw content)
    GitHub-->>App: README content
    App->>App: Convert markdown to HTML
    App->>User: Show item details + README
    
    Note over User,GitHub: IMPORT PHASE
    User->>App: Clicks Import
    App->>App: Parse README for server config
    App->>App: Add to Quick Add templates
    App->>User: Show configuration form
    
    Note over User,GitHub: SERVER ADDITION PHASE
    User->>App: Configures & Saves
    App->>App: Save to configuration file
    App->>User: Show restart warning
```

### Step References & Evidence:

**Data Loading (No Cache)**
- File: `js/features/marketplace/data.js:8-18`
- Network: IPC call to read local `marketplace.json` file
- Cache: None - always reads from file

**README Fetching**
- File: `js/features/marketplace/details.js:85-95`
- Network: `ipcRenderer.invoke('fetch-url', url)` → GitHub raw content
- Cache: None - fetches every time

---

## 2. Composio Marketplace Complete Lifecycle

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Cache
    participant ComposioAPI
    
    Note over User,ComposioAPI: INITIALIZATION PHASE
    User->>App: Opens Composio Marketplace
    App->>App: Check API key
    alt No API Key
        App->>User: Show API Key Form
        User->>App: Enters API Key
    end
    
    Note over User,ComposioAPI: DATA LOADING PHASE
    App->>Cache: Check apps cache (24h TTL)
    alt Valid Cache
        Cache-->>App: Return cached toolkits
    else Cache Miss/Expired
        App->>ComposioAPI: POST /v3/toolkits (limit: 100)
        ComposioAPI-->>App: Toolkits JSON response
        App->>Cache: Store with timestamp
    end
    App->>User: Show apps list
    
    Note over User,ComposioAPI: SEARCH PHASE (Local Only)
    User->>App: Types search query
    App->>App: Filter cached data locally
    App->>User: Update display
    
    Note over User,ComposioAPI: CONNECTION PHASE
    User->>App: Selects App & Clicks Connect
    App->>ComposioAPI: GET /v3/connections (check existing)
    ComposioAPI-->>App: Existing connections
    alt Has Existing Connections
        App->>User: Show delete/skip options
        opt Delete All
            App->>ComposioAPI: DELETE /v3/connections/{id}
        end
    end
    
    App->>ComposioAPI: POST /v3/connections (initiate)
    ComposioAPI-->>App: Connection details
    alt OAuth Required
        App->>User: Show OAuth link
        User->>User: Completes OAuth externally
        App->>ComposioAPI: GET /v3/connections/{id} (check status)
    else API Key Required
        App->>User: Show API key prompt
        User->>App: Submits API key
        App->>ComposioAPI: PATCH /v3/connections/{id}
    end
    
    Note over User,ComposioAPI: SERVER CREATION PHASE
    App->>ComposioAPI: POST /v3/mcp-servers
    ComposioAPI-->>App: MCP server config
    App->>App: Save to configuration file
    App->>User: Show success & restart warning
```

### Step References & Evidence:

**Cache Check**
- File: `js/features/composio-marketplace/data.js:15-22`
- Cache Key: `composio-get-apps-cache`
- TTL: 86,400,000ms (24 hours)

**API Calls**
- File: `js/features/composio-marketplace/data.js:53-65`
- Network: `composioService.listToolkits({ limit: 100 })` → POST `/v3/toolkits`
- Network: Connection management via `/v3/connections` endpoints
- Network: MCP server creation via POST `/v3/mcp-servers`

---

## 3. Apify Marketplace Complete Lifecycle

```mermaid
sequenceDiagram
    participant User
    participant App
    participant Cache
    participant ApifyAPI
    
    Note over User,ApifyAPI: INITIALIZATION PHASE
    User->>App: Opens Apify Marketplace
    App->>App: Check API key
    alt No API Key
        App->>User: Show API Key Form
        User->>App: Enters API Key
    end
    
    Note over User,ApifyAPI: DATA LOADING PHASE
    App->>Cache: Check actors cache (24h TTL)
    alt Valid Cache
        Cache-->>App: Return cached actors
    else Cache Miss/Expired
        App->>ApifyAPI: GET /v2/store?limit=200
        Note over App,ApifyAPI: Headers: Authorization Bearer {apiKey}
        alt Invalid API Key
            ApifyAPI-->>App: HTTP 401 Unauthorized
            App->>App: Clear API key
            App->>User: Show error
        else Valid API Key
            ApifyAPI-->>App: JSON actors response
            App->>Cache: Store with timestamp
        end
    end
    App->>App: Load current actor selections from config
    App->>User: Show actors with Add/Remove buttons
    
    Note over User,ApifyAPI: SEARCH PHASE (Local Only)
    User->>App: Types search query
    App->>App: Filter cached data locally
    App->>User: Update display
    
    Note over User,ApifyAPI: ACTOR MANAGEMENT PHASE
    User->>App: Clicks Add/Remove Actor
    App->>App: Update local configuration
    alt Adding Actor
        App->>App: Create/update Apify server config
        App->>App: Add actor to args list
    else Removing Actor
        App->>App: Remove actor from args list
        opt No Actors Left
            App->>App: Remove entire server
        end
    end
    App->>App: Save configuration file
    App->>User: Show success & restart warning
    
    Note over User,ApifyAPI: DETAILS VIEW (Optional)
    User->>App: Views Actor Details
    App->>User: Show stats, categories, pricing (from cache)
```

### Step References & Evidence:

**Cache Check**
- File: `js/features/apify-marketplace/data.js:15-22`
- Cache Key: `apify-get-actors-cache`
- TTL: 86,400,000ms (24 hours)

**API Call**
- File: `js/features/apify-marketplace/data.js:35-50`
- Network: `fetch('https://api.apify.com/v2/store?limit=200')`
- Headers: `Authorization: Bearer {apiKey}`
- Error Handling: HTTP 401 → Clear API key

---

## 4. Smithery Marketplace Complete Lifecycle

```mermaid
sequenceDiagram
    participant User
    participant App
    participant SmitheryAPI
    
    Note over User,SmitheryAPI: INITIALIZATION PHASE
    User->>App: Opens Smithery Marketplace
    App->>App: Check credentials (API key + profile)
    alt No Credentials
        App->>User: Show API Key Form
        User->>App: Enters API Key & Profile
    end
    
    Note over User,SmitheryAPI: DATA LOADING PHASE (No Cache)
    App->>SmitheryAPI: GET /servers?page=1&pageSize=100
    Note over App,SmitheryAPI: Headers: Authentication with API key + profile
    alt Invalid Credentials
        SmitheryAPI-->>App: HTTP 401/403
        App->>App: Clear credentials
        App->>User: Show error
    else Valid Credentials
        SmitheryAPI-->>App: JSON servers list
        App->>User: Show servers list
    end
    
    Note over User,SmitheryAPI: REAL-TIME SEARCH PHASE
    User->>App: Types search query
    App->>SmitheryAPI: GET /servers?q={query}&pageSize=20
    SmitheryAPI-->>App: Search results
    App->>User: Update display with results
    
    Note over User,SmitheryAPI: QUICK INSTALL PHASE
    User->>App: Clicks Quick Install
    App->>App: Generate HTTP config with credentials
    App->>App: Save to configuration file
    App->>User: Show success & restart warning
    
    Note over User,SmitheryAPI: DETAILED INSTALL PHASE
    User->>App: Views Server Details
    App->>SmitheryAPI: GET /servers/{qualifiedName}
    SmitheryAPI-->>App: Detailed server info
    App->>User: Show connection types & parameters
    
    User->>App: Selects connection type & clicks install
    alt HTTP Connection
        App->>App: Generate HTTP config
    else Stdio Connection
        App->>App: Generate stdio config with user params
    end
    App->>App: Save to configuration file
    App->>User: Show success & restart warning
```

### Step References & Evidence:

**No Caching**
- Evidence: No cache-related code found in Smithery files
- All API calls are direct to `registry.smithery.ai`

**API Calls**
- File: `js/features/smithery-marketplace/smithery-api.js:15-30`
- Network: `GET https://registry.smithery.ai/servers?page=1&pageSize=100`
- Network: `GET https://registry.smithery.ai/servers?q={query}&pageSize=20` (real-time search)
- Network: `GET https://registry.smithery.ai/servers/{qualifiedName}` (details)

---

## 5. Common Configuration Management Flow

```mermaid
sequenceDiagram
    participant App
    participant FileSystem
    
    App->>App: addServer(name, config, state)
    App->>App: Check if server name exists
    alt Name Exists
        App->>App: Generate unique name
    end
    
    App->>App: Determine target section (active/inactive)
    App->>FileSystem: Save to ~/.config/mcp-studio/config.json
    FileSystem-->>App: Confirm save
    App->>App: Notify change listeners
    App->>App: Update server list display
    App->>App: Show restart warning
```

### Step References & Evidence:

**Configuration Save**
- File: `js/config/config-manager.js:25-35`
- File Path: `~/.config/mcp-studio/config.json`

---

## Network Traffic Summary

| Marketplace | Initial Load | Search | Details | Caching | External Endpoints |
|-------------|--------------|--------|---------|---------|-------------------|
| **General** | Local File | Local | GitHub API | None | `github.com/raw/` |
| **Composio** | V3 API | Local | Local | 24h Cache | `api.composio.dev/v3/` |
| **Apify** | Store API | Local | Local | 24h Cache | `api.apify.com/v2/store` |
| **Smithery** | Registry API | Real-time API | Registry API | None | `registry.smithery.ai/` |

## Cache Keys & TTL

| Service | Cache Key | TTL | Storage Type | Evidence File |
|---------|-----------|-----|--------------|---------------|
| Composio | `composio-get-apps-cache` | 86,400,000ms (24h) | localStorage | `composio-marketplace/data.js:15-22` |
| Apify | `apify-get-actors-cache` | 86,400,000ms (24h) | localStorage | `apify-marketplace/data.js:15-22` |
| Smithery | None | N/A | None | No cache code found |
| General | None | N/A | None | Always reads from file |

## API Endpoints

| Service | Endpoint | Method | Purpose | Evidence |
|---------|----------|--------|---------|----------|
| Composio | `/v3/toolkits` | POST | List toolkits | `composio-marketplace/data.js:58` |
| Composio | `/v3/connections` | GET/POST/DELETE | Manage connections | `composio-connector.js` |
| Composio | `/v3/mcp-servers` | POST | Create MCP server | `composio-connector.js` |
| Apify | `/v2/store?limit=200` | GET | List actors | `apify-marketplace/data.js:37` |
| Smithery | `/servers?page=1&pageSize=100` | GET | List servers | `smithery-api.js:20` |
| Smithery | `/servers?q={query}` | GET | Search servers | `smithery-api.js:55` |
| Smithery | `/servers/{qualifiedName}` | GET | Server details | `smithery-api.js:40` |
| GitHub | Raw content URLs | GET | README files | `marketplace/details.js:87` |
