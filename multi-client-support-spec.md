# Multi-Client Support Specification

## Overview

Extend MCP Studio to support multiple MCP clients beyond Claude, starting with LibreChat. Instead of directly modifying client configurations, MCP Studio will maintain its own configuration file and sync with multiple client formats.

## Current State

- **Current**: Direct modification of Claude's configuration at `~/.config/claude-desktop/config.json`
- **Limitation**: Only supports Claude Desktop client
- **Format**: JSON with `mcpServers` object

## Proposed Architecture

### 1. Internal Configuration Management

**New Internal Config Location**: `~/.config/mcp-studio/clients-config.json`

```json
{
  "version": "1.0",
  "lastModified": "2025-01-01T12:00:00Z",
  "servers": {
    "github-mcp": {
      "command": "npx",
      "args": [
        "@composio/mcp@latest",
        "start",
        "--url",
        "https://mcp.composio.dev/composio/server/3880766e-8a2d-41c6-a971-d8f700d510ce?transport=sse"
      ],
      "metadata": {
        "composio": {
          "source": "composio",
          "appKey": "unknown",
          "mcpServerId": "3880766e-8a2d-41c6-a971-d8f700d510ce"
        }
      }
    },
    "devto": {
      "command": "uv",
      "args": ["run", "devto-server"]
    }
  },
  "clients": {
    "claude": {
      "enabled": true,
      "configPath": "~/.config/claude-desktop/config.json",
      "format": "json",
      "lastSync": "2025-01-01T12:00:00Z"
    },
    "librechat": {
      "enabled": false,
      "configPath": "~/src/LibreChat/librechat.yaml",
      "format": "yaml",
      "lastSync": null
    }
  }
}
```

### 2. Client Configuration Formats

#### Claude Desktop (JSON)
```json
{
  "mcpServers": {
    "github-mcp": {
      "command": "npx",
      "args": [
        "@composio/mcp@latest",
        "start",
        "--url",
        "https://mcp.composio.dev/composio/server/3880766e-8a2d-41c6-a971-d8f700d510ce?transport=sse"
      ]
    }
  }
}
```

#### LibreChat (YAML)
```yaml
mcpServers:
  github-mcp:
    command: npx
    args:
      - "@composio/mcp@latest"
      - "start"
      - "--url"
      - "https://mcp.composio.dev/composio/server/3880766e-8a2d-41c6-a971-d8f700d510ce?transport=sse"
    composio:
      source: composio
      appKey: unknown
      mcpServerId: 3880766e-8a2d-41c6-a971-d8f700d510ce
  devto:
    command: uv
    args:
      - "run"
      - "devto-server"
```

### 3. UI Changes

#### New Client Management Section

**Location**: Add new tab/section in main interface

**Components**:
1. **Client List**: Show all supported clients with enable/disable toggles
2. **Configuration Paths**: Editable paths for each client
3. **Sync Status**: Last sync time and status for each client
4. **Sync Controls**: Manual sync buttons and auto-sync settings

#### Client Configuration Panel

```
┌─ Clients Configuration ─────────────────────────────┐
│                                                     │
│ ┌─ Claude Desktop ──────────────────────────────┐   │
│ │ ☑ Enabled                                     │   │
│ │ Path: ~/.config/claude-desktop/config.json    │   │
│ │ Format: JSON                                  │   │
│ │ Last Sync: 2025-01-01 12:00:00               │   │
│ │ [Sync Now] [Auto-sync: ☑]                    │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ ┌─ LibreChat ───────────────────────────────────┐   │
│ │ ☐ Enabled                                     │   │
│ │ Path: ~/src/LibreChat/librechat.yaml         │   │
│ │ Format: YAML                                  │   │
│ │ Last Sync: Never                             │   │
│ │ [Sync Now] [Auto-sync: ☐]                    │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ [Add Custom Client]                                 │
└─────────────────────────────────────────────────────┘
```

### 4. Implementation Details

#### File Structure Changes

```
js/
├── config/
│   ├── config-manager.js (existing - modify)
│   ├── client-manager.js (new)
│   ├── sync-manager.js (new)
│   └── formatters/
│       ├── claude-formatter.js (new)
│       ├── librechat-formatter.js (new)
│       └── base-formatter.js (new)
├── ui/
│   ├── client-config-modal.js (new)
│   └── sync-status.js (new)
```

#### Core Classes

**ClientManager**
```javascript
class ClientManager {
  constructor() {
    this.clients = new Map();
    this.formatters = new Map();
  }
  
  registerClient(name, config) { }
  enableClient(name) { }
  disableClient(name) { }
  getClientConfig(name) { }
  updateClientPath(name, path) { }
}
```

**SyncManager**
```javascript
class SyncManager {
  constructor(clientManager) {
    this.clientManager = clientManager;
    this.autoSyncEnabled = true;
  }
  
  syncToClient(clientName) { }
  syncFromClient(clientName) { }
  syncAll() { }
  detectConflicts() { }
  resolveConflicts(strategy) { }
}
```

**BaseFormatter**
```javascript
class BaseFormatter {
  format(servers) { }
  parse(content) { }
  validate(content) { }
  merge(existing, servers) { }
}
```

#### Sync Strategies

1. **One-way Sync (MCP Studio → Clients)**
   - Default behavior
   - MCP Studio is source of truth
   - Overwrites client configurations

2. **Conflict Detection**
   - Compare timestamps
   - Detect manual changes in client configs
   - Prompt user for resolution

3. **Merge Strategy**
   - Preserve non-MCP sections in client configs
   - Only update `mcpServers` section
   - Maintain client-specific metadata

### 5. Migration Plan

#### Phase 1: Internal Config
1. Create new internal configuration system
2. Migrate existing Claude config to internal format
3. Maintain backward compatibility

#### Phase 2: Client Abstraction
1. Implement formatter system
2. Add Claude formatter (existing behavior)
3. Test with current Claude users

#### Phase 3: LibreChat Support
1. Implement YAML formatter
2. Add LibreChat client configuration
3. Test YAML generation and parsing

#### Phase 4: UI Enhancement
1. Add client management interface
2. Implement sync controls
3. Add status indicators

### 6. Configuration Examples

#### Internal Config with Metadata
```json
{
  "servers": {
    "composio-github": {
      "command": "npx",
      "args": ["@composio/mcp@latest", "start", "--url", "..."],
      "env": {},
      "metadata": {
        "source": "composio-marketplace",
        "composio": {
          "appKey": "github",
          "mcpServerId": "3880766e-8a2d-41c6-a971-d8f700d510ce"
        },
        "clientSpecific": {
          "librechat": {
            "additionalConfig": {
              "timeout": 30000
            }
          }
        }
      }
    }
  }
}
```

#### LibreChat Output with Metadata
```yaml
mcpServers:
  composio-github:
    command: npx
    args:
      - "@composio/mcp@latest"
      - "start"
      - "--url"
      - "https://mcp.composio.dev/composio/server/3880766e-8a2d-41c6-a971-d8f700d510ce?transport=sse"
    composio:
      source: composio
      appKey: github
      mcpServerId: 3880766e-8a2d-41c6-a971-d8f700d510ce
    timeout: 30000
```

### 7. Error Handling

#### File Access Errors
- Graceful degradation if client config files are inaccessible
- Clear error messages with suggested fixes
- Fallback to internal config only

#### Format Validation
- Validate client configs before writing
- Backup existing configs before modification
- Rollback capability on sync failures

#### Conflict Resolution
- Timestamp-based conflict detection
- User-friendly conflict resolution UI
- Option to choose source of truth per conflict

### 8. Future Extensibility

#### Custom Client Support
- Plugin system for new client formatters
- User-defined client configurations
- Template system for common client types

#### Advanced Sync Features
- Selective server sync (choose which servers to sync to which clients)
- Environment-specific configurations
- Backup and restore functionality

### 9. Testing Strategy

#### Unit Tests
- Formatter classes for each client type
- Sync manager logic
- Configuration validation

#### Integration Tests
- End-to-end sync workflows
- File system operations
- Error scenarios

#### User Acceptance Tests
- Migration from current Claude-only setup
- Adding LibreChat client
- Sync conflict resolution

### 10. Documentation Updates

#### User Guide
- How to configure multiple clients
- Sync strategies and best practices
- Troubleshooting common issues

#### Developer Guide
- Adding new client formatters
- Extending metadata system
- Custom sync strategies

## Implementation Priority

1. **High Priority**: Internal config system, Claude formatter
2. **Medium Priority**: LibreChat formatter, basic UI
3. **Low Priority**: Advanced sync features, custom clients

## Success Criteria

- [ ] Seamless migration from current Claude-only setup
- [ ] Successful LibreChat YAML generation and sync
- [ ] No data loss during sync operations
- [ ] Intuitive UI for managing multiple clients
- [ ] Comprehensive error handling and recovery
