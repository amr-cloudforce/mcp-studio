# Multi-Client Support Specification

## Overview

Extend MCP Studio to support multiple MCP clients beyond Claude, starting with LibreChat. MCP Studio will maintain its own configuration and one-way sync the `mcpServers` section to client configurations.

## Current State

- **Current**: Direct modification of Claude's configuration at `~/.config/claude-desktop/config.json`
- **Limitation**: Only supports Claude Desktop client
- **Format**: JSON with `mcpServers` object

## Simplified Requirements

1. **One-way sync only**: MCP Studio → Client configs (overwrite `mcpServers` section only)
2. **Auto-detection**: Detect installed clients at default locations
3. **Auto-sync**: Checkbox to enable automatic syncing
4. **No migration**: Keep existing behavior, just add multi-client support
5. **Automatic backups**: Create up to 3 backups before any changes for restore capability

## Client Detection & Default Paths

### Auto-Detection Logic

On app startup, scan for installed clients at default locations:

```javascript
const DEFAULT_CLIENT_PATHS = {
  claude: {
    name: "Claude Desktop",
    paths: [
      "~/.config/claude-desktop/config.json",           // Linux/macOS
      "%APPDATA%/Claude/config.json"                    // Windows
    ],
    format: "json"
  },
  librechat: {
    name: "LibreChat", 
    paths: [
      "~/src/LibreChat/librechat.yaml",                 // Default dev location
      "~/LibreChat/librechat.yaml",                     // Alternative location
      "/opt/LibreChat/librechat.yaml"                   // System installation
    ],
    format: "yaml"
  }
};
```

### Admin Configuration

**Location**: `~/.config/mcp-studio/client-paths.json`

```json
{
  "claude": {
    "enabled": true,
    "autoSync": true,
    "customPath": null,
    "detectedPath": "~/.config/claude-desktop/config.json"
  },
  "librechat": {
    "enabled": false,
    "autoSync": false, 
    "customPath": "~/my-custom/LibreChat/librechat.yaml",
    "detectedPath": null
  }
}
```

## Architecture

### 1. Internal Configuration (Unchanged)

Keep existing `~/.config/mcp-studio/config.json` format:

```json
{
  "mcpServers": {
    "active": {
      "github-mcp": {
        "command": "npx",
        "args": ["@composio/mcp@latest", "start", "--url", "..."]
      }
    },
    "inactive": {}
  }
}
```

### 2. One-Way Sync Strategy

**Principle**: Only overwrite the `mcpServers` section in client configs, preserve everything else.

#### Claude Desktop Sync
```json
{
  "mcpServers": {
    "github-mcp": {
      "command": "npx", 
      "args": ["@composio/mcp@latest", "start", "--url", "..."]
    }
  }
}
```

#### LibreChat Sync
```yaml
# Preserve existing sections
version: "1.0.0"
cache: true
# ... other LibreChat config ...

# Only overwrite this section
mcpServers:
  github-mcp:
    command: npx
    args:
      - "@composio/mcp@latest"
      - "start" 
      - "--url"
      - "https://mcp.composio.dev/composio/server/..."
    composio:
      source: composio
      appKey: github
      mcpServerId: "3880766e-8a2d-41c6-a971-d8f700d510ce"
```

### 3. UI Changes

#### New Clients Tab

Add "Clients" tab to main interface with:

```
┌─ Client Synchronization ────────────────────────────┐
│                                                     │
│ ☑ Auto-sync to all enabled clients                 │
│                                                     │
│ ┌─ Claude Desktop ──────────────────────────────┐   │
│ │ ☑ Enabled    ☑ Auto-sync                     │   │
│ │ 🟢 Detected: ~/.config/claude-desktop/config.json │
│ │ Last sync: 2 minutes ago                     │   │
│ │ Backups: 3 available                        │   │
│ │ [Sync Now] [View Backups] [Restore]         │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ ┌─ LibreChat ───────────────────────────────────┐   │
│ │ ☐ Enabled    ☐ Auto-sync                     │   │
│ │ 🔴 Not found at default locations            │   │
│ │ Custom path: [Browse...] ________________    │   │
│ │ Backups: 0 available                        │   │
│ │ [Test Path] [Sync Now] [View Backups]       │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ [Refresh Detection] [Advanced Settings]            │
└─────────────────────────────────────────────────────┘
```

#### Backup Management Modal

```
┌─ Backup Management - Claude Desktop ────────────────┐
│                                                     │
│ Available Backups (3/3):                           │
│                                                     │
│ ┌─ config.backup.2025-01-01T15-30-00-000Z.json ─┐   │
│ │ Created: 2025-01-01 15:30:00                  │   │
│ │ Size: 2.1 KB                                 │   │
│ │ [Restore] [Delete] [View Content]            │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ ┌─ config.backup.2025-01-01T14-15-30-000Z.json ─┐   │
│ │ Created: 2025-01-01 14:15:30                  │   │
│ │ Size: 1.9 KB                                 │   │
│ │ [Restore] [Delete] [View Content]            │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ ┌─ config.backup.2025-01-01T13-45-15-000Z.json ─┐   │
│ │ Created: 2025-01-01 13:45:15                  │   │
│ │ Size: 1.8 KB                                 │   │
│ │ [Restore] [Delete] [View Content]            │   │
│ └───────────────────────────────────────────────┘   │
│                                                     │
│ [Create Manual Backup] [Close]                     │
└─────────────────────────────────────────────────────┘
```

## Implementation

### File Structure

```
js/
├── config/
│   ├── config-manager.js (existing)
│   ├── client-detector.js (new)
│   ├── client-sync.js (new)
│   └── formatters/
│       ├── claude-formatter.js (new)
│       └── librechat-formatter.js (new)
├── ui/
│   └── clients-tab.js (new)
```

### Core Components

#### ClientDetector
```javascript
class ClientDetector {
  static detectClients() {
    const detected = {};
    for (const [clientId, config] of Object.entries(DEFAULT_CLIENT_PATHS)) {
      detected[clientId] = this.findClientPath(config.paths);
    }
    return detected;
  }
  
  static findClientPath(paths) {
    for (const path of paths) {
      if (fs.existsSync(expandPath(path))) {
        return path;
      }
    }
    return null;
  }
}
```

#### ClientSync
```javascript
class ClientSync {
  static syncToClient(clientId, servers) {
    const clientConfig = this.getClientConfig(clientId);
    if (!clientConfig.enabled) return;
    
    const formatter = this.getFormatter(clientId);
    const clientPath = clientConfig.customPath || clientConfig.detectedPath;
    
    // Read existing config
    const existing = this.readClientConfig(clientPath);
    
    // Merge only mcpServers section
    const updated = formatter.mergeMcpServers(existing, servers);
    
    // Write back
    this.writeClientConfig(clientPath, updated);
  }
  
  static syncAll() {
    const servers = configManager.getActiveServers();
    const clientConfigs = this.getEnabledClients();
    
    for (const clientId of clientConfigs) {
      this.syncToClient(clientId, servers);
    }
  }
}
```

#### ClaudeFormatter
```javascript
class ClaudeFormatter {
  static mergeMcpServers(existing, servers) {
    return {
      ...existing,
      mcpServers: this.formatServers(servers)
    };
  }
  
  static formatServers(servers) {
    const formatted = {};
    for (const [name, config] of Object.entries(servers)) {
      formatted[name] = {
        command: config.command,
        args: config.args,
        env: config.env || {}
      };
    }
    return formatted;
  }
}
```

#### LibreChatFormatter
```javascript
class LibreChatFormatter {
  static mergeMcpServers(existing, servers) {
    const yaml = require('js-yaml');
    const parsed = typeof existing === 'string' ? yaml.load(existing) : existing;
    
    parsed.mcpServers = this.formatServers(servers);
    
    return yaml.dump(parsed, { 
      indent: 2,
      lineWidth: -1,
      noRefs: true
    });
  }
  
  static formatServers(servers) {
    const formatted = {};
    for (const [name, config] of Object.entries(servers)) {
      formatted[name] = {
        command: config.command,
        args: config.args
      };
      
      // Add metadata if available
      if (config.metadata) {
        Object.assign(formatted[name], config.metadata);
      }
    }
    return formatted;
  }
}
```

### Backup System

#### Backup Strategy

**Location**: `~/.config/mcp-studio/backups/{clientId}/`

**Naming**: `config.backup.{timestamp}.{extension}`

**Retention**: Keep up to 3 most recent backups per client

#### BackupManager
```javascript
class BackupManager {
  static createBackup(clientId, configPath) {
    const backupDir = path.join(os.homedir(), '.config', 'mcp-studio', 'backups', clientId);
    
    // Ensure backup directory exists
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Read current config
    const currentConfig = fs.readFileSync(configPath, 'utf8');
    
    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = path.extname(configPath);
    const backupFilename = `config.backup.${timestamp}${extension}`;
    const backupPath = path.join(backupDir, backupFilename);
    
    // Write backup
    fs.writeFileSync(backupPath, currentConfig);
    
    // Clean old backups (keep only 3 most recent)
    this.cleanOldBackups(backupDir, 3);
    
    return backupPath;
  }
  
  static cleanOldBackups(backupDir, maxBackups) {
    const backupFiles = fs.readdirSync(backupDir)
      .filter(file => file.startsWith('config.backup.'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        mtime: fs.statSync(path.join(backupDir, file)).mtime
      }))
      .sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first
    
    // Remove old backups beyond the limit
    if (backupFiles.length > maxBackups) {
      const filesToDelete = backupFiles.slice(maxBackups);
      filesToDelete.forEach(file => {
        fs.unlinkSync(file.path);
        console.log(`Deleted old backup: ${file.name}`);
      });
    }
  }
  
  static listBackups(clientId) {
    const backupDir = path.join(os.homedir(), '.config', 'mcp-studio', 'backups', clientId);
    
    if (!fs.existsSync(backupDir)) {
      return [];
    }
    
    return fs.readdirSync(backupDir)
      .filter(file => file.startsWith('config.backup.'))
      .map(file => ({
        name: file,
        path: path.join(backupDir, file),
        mtime: fs.statSync(path.join(backupDir, file)).mtime,
        size: fs.statSync(path.join(backupDir, file)).size
      }))
      .sort((a, b) => b.mtime - a.mtime);
  }
  
  static restoreBackup(clientId, backupFilename, targetPath) {
    const backupDir = path.join(os.homedir(), '.config', 'mcp-studio', 'backups', clientId);
    const backupPath = path.join(backupDir, backupFilename);
    
    if (!fs.existsSync(backupPath)) {
      throw new Error(`Backup file not found: ${backupFilename}`);
    }
    
    // Create backup of current config before restore
    this.createBackup(clientId, targetPath);
    
    // Restore from backup
    const backupContent = fs.readFileSync(backupPath, 'utf8');
    fs.writeFileSync(targetPath, backupContent);
    
    return true;
  }
}
```

#### Updated ClientSync with Backup
```javascript
class ClientSync {
  static syncToClient(clientId, servers) {
    const clientConfig = this.getClientConfig(clientId);
    if (!clientConfig.enabled) return;
    
    const formatter = this.getFormatter(clientId);
    const clientPath = clientConfig.customPath || clientConfig.detectedPath;
    
    // Create backup before making changes
    try {
      const backupPath = BackupManager.createBackup(clientId, clientPath);
      console.log(`Created backup: ${backupPath}`);
    } catch (error) {
      console.warn(`Failed to create backup for ${clientId}:`, error.message);
      // Continue with sync even if backup fails
    }
    
    // Read existing config
    const existing = this.readClientConfig(clientPath);
    
    // Merge only mcpServers section
    const updated = formatter.mergeMcpServers(existing, servers);
    
    // Write back
    this.writeClientConfig(clientPath, updated);
    
    // Update last sync timestamp
    this.updateLastSyncTime(clientId);
  }
  
  static syncAll() {
    const servers = configManager.getActiveServers();
    const clientConfigs = this.getEnabledClients();
    
    for (const clientId of clientConfigs) {
      try {
        this.syncToClient(clientId, servers);
      } catch (error) {
        console.error(`Failed to sync to ${clientId}:`, error.message);
        // Continue with other clients even if one fails
      }
    }
  }
}
```

### Auto-Sync Integration

#### Hook into existing save operations
```javascript
// In config-manager.js
saveConfig() {
  // Existing save logic
  fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2));
  
  // Auto-sync if enabled
  if (this.isAutoSyncEnabled()) {
    ClientSync.syncAll();
  }
  
  this.notifyListeners();
}
```

#### Auto-sync triggers
- Server added/removed
- Server enabled/disabled  
- Server configuration changed
- Manual sync button clicked

## Error Handling

### File Access Errors
```javascript
try {
  ClientSync.syncToClient('librechat', servers);
} catch (error) {
  if (error.code === 'ENOENT') {
    this.showError(`LibreChat config file not found at ${path}`);
  } else if (error.code === 'EACCES') {
    this.showError(`Permission denied writing to ${path}`);
  } else {
    this.showError(`Failed to sync to LibreChat: ${error.message}`);
  }
}
```

### Format Validation
```javascript
// Validate YAML before writing
try {
  yaml.load(formattedContent);
} catch (error) {
  throw new Error(`Invalid YAML format: ${error.message}`);
}
```

## Testing Strategy

### Unit Tests
- Client detection logic
- Formatter classes (JSON/YAML)
- Sync operations
- Error handling

### Integration Tests  
- End-to-end sync workflows
- File system operations
- Auto-sync triggers

### Manual Testing
- Test with real Claude Desktop installation
- Test with real LibreChat installation
- Test error scenarios (missing files, permissions)

## Success Criteria

- [ ] Auto-detect Claude Desktop and LibreChat installations
- [ ] One-way sync preserves non-MCP sections in client configs
- [ ] Auto-sync checkbox works correctly
- [ ] Manual sync buttons work
- [ ] Proper error handling and user feedback
- [ ] No breaking changes to existing Claude workflow
