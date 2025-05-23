# MCP Studio Lessons Learned

This document captures important lessons learned during development and refactoring of the MCP Studio application.

## Refactoring Lessons

### 2025-05-23: Refactoring renderer.js

#### Issue
When refactoring the monolithic `renderer.js` file into smaller modules, we encountered the following error:

```
utilities.css:1     Failed to load resource: net::ERR_FILE_NOT_FOUND
main.js:73 Failed to initialize MCP Studio: TypeError: serverList.initialize is not a function
    at HTMLDocument.initializeApp (main.js:39:16)
```

#### Root Cause
The error occurred because we created a new module `js/ui/server-list.js` that exported a class `ServerList` instead of a singleton instance with an `initialize` method. This didn't match the pattern used by other modules in the project, which were singleton instances with `initialize` methods.

The main application code in `js/main.js` was expecting to call `serverList.initialize()`, but our implementation didn't provide this method on the exported object.

#### Solution
We updated our approach to match the project's established patterns:

1. Modified `js/ui/server-list.js` to export a singleton instance instead of a class:
   ```javascript
   // Create and export a singleton instance
   const serverList = new ServerList();
   export default serverList;
   ```

2. Added an `initialize()` method to the `ServerList` class:
   ```javascript
   initialize() {
     this.serverListElement = document.getElementById('server-list');
     return this;
   }
   ```

3. Updated `js/ui/modal-handlers.js` to follow the same pattern.

4. Updated imports in `renderer.js` to use the singleton instances:
   ```javascript
   import serverList from './ui/server-list.js';
   import serverForm from './ui/server-form/index.js';
   import modalHandlers from './ui/modal-handlers.js';
   ```

#### Lesson Learned
When refactoring code in an existing project:

1. **Understand the project patterns**: Before making changes, analyze how the existing code is structured and follow those patterns consistently.

2. **Check dependencies**: Understand how different parts of the application interact with each other. In this case, `js/main.js` expected a specific interface from the `serverList` module.

3. **Incremental changes**: Make small, focused changes and test frequently to catch issues early.

4. **Consistent module structure**: Maintain consistency in how modules are structured and exported. In this project, modules are exported as singleton instances with an `initialize` method.

### 2025-05-23: Electron Renderer Process Module Resolution Error

#### Issue
When implementing a storage module for Composio data, we encountered this error:

```
node:internal/modules/cjs/loader:1082 Uncaught Error: Cannot find module '../../storage/composioStore.js'
Require stack:
- /Users/amr/src/mcp-studio/index.html
    at Module._resolveFilename (node:internal/modules/cjs/loader:1082:15)
    at o._resolveFilename (node:electron/js2c/renderer_init:2:3879)
```

#### Root Cause
The error occurred because we tried to use Node.js `require()` with relative paths in Electron's renderer process (browser context). Electron's renderer process has different module resolution rules than the main process:

1. **Renderer Process Context**: Files like `modal.js` and `data.js` run in the renderer process (browser-like environment)
2. **Module Resolution**: Node.js `require()` with relative paths doesn't work the same way in renderer as in main process
3. **Security Context**: Even with `nodeIntegration: true`, the module resolution behavior is different

#### Failed Approach
We initially created `js/storage/composioStore.js` and tried to import it directly:
```javascript
const composioStore = require('../../storage/composioStore.js');
```

This failed because the renderer process couldn't resolve the relative path properly.

#### Solution
We implemented an IPC-based storage solution following Electron best practices:

1. **Main Process Storage**: Moved storage logic to `main.js` using `app.getPath('userData')`
2. **IPC Handlers**: Added IPC handlers in main process:
   ```javascript
   ipcMain.handle('composio-get-api-key', () => { /* ... */ });
   ipcMain.handle('composio-set-api-key', (_, key) => { /* ... */ });
   ipcMain.handle('composio-get-apps-cache', () => { /* ... */ });
   ipcMain.handle('composio-set-apps-cache', (_, cache) => { /* ... */ });
   ```
3. **Renderer IPC Calls**: Updated renderer files to use IPC:
   ```javascript
   const { ipcRenderer } = require('electron');
   const apiKey = await ipcRenderer.invoke('composio-get-api-key');
   ```

#### Lesson Learned
**CRITICAL: Never use relative path require() in Electron renderer process**

1. **Electron Architecture**: Understand the difference between main and renderer processes
   - Main process: Full Node.js environment, can require any module
   - Renderer process: Browser-like environment with limited Node.js access

2. **Storage Best Practice**: Always handle storage in the main process
   - Use `app.getPath('userData')` for persistent storage
   - Expose storage via IPC handlers
   - Keep renderer process focused on UI logic

3. **Module Resolution Rules**:
   - ✅ Main process: `require('./path/to/module')` works normally
   - ❌ Renderer process: `require('./path/to/module')` may fail with relative paths
   - ✅ Renderer process: `require('electron')` and built-in modules work
   - ✅ Renderer process: Use IPC to communicate with main process

4. **Prevention Strategy**:
   - Always use IPC for cross-process communication
   - Keep business logic in main process when possible
   - Use preload scripts for secure renderer-main communication
   - Test module imports immediately after creating them

5. **Error Pattern Recognition**:
   - Error message: "Cannot find module" with relative path
   - Context: Renderer process trying to require local module
   - Solution: Move logic to main process + IPC, or use preload script

**This error pattern must never happen again - always use IPC for renderer-main communication.**

### 2025-05-23: Incomplete Storage Migration - Missing Files

#### Issue
After implementing the IPC-based storage solution for Composio data, we encountered this error when trying to connect to apps:

```
composio-connector.js:36 Error initializing Composio service: Error: Composio API key is required
    at initializeService (composio-connector.js:22:13)
    at Module.connectToApp (composio-connector.js:50:13)
```

#### Root Cause
The error occurred because we only updated some files (`modal.js` and `data.js`) to use the new IPC storage system, but missed updating `composio-connector.js` which was still using the old localStorage method:

```javascript
// Old code in composio-connector.js
const apiKey = localStorage.getItem('composioApiKey');
```

This created an inconsistency where:
- API key was being saved via IPC storage (in modal.js)
- API key was being retrieved via localStorage (in composio-connector.js)
- The two storage systems were completely separate

#### Solution
Updated `composio-connector.js` to use the same IPC storage system:

1. **Added IPC import**:
   ```javascript
   const { ipcRenderer } = require('electron');
   ```

2. **Updated API key retrieval**:
   ```javascript
   // Changed from:
   const apiKey = localStorage.getItem('composioApiKey');
   
   // To:
   const apiKey = await ipcRenderer.invoke('composio-get-api-key');
   ```

3. **Made function async**: Updated `initializeService()` to properly handle async IPC calls

#### Lesson Learned
**CRITICAL: When migrating storage systems, update ALL files that access the data**

1. **Complete Migration Strategy**:
   - Search entire codebase for old storage method usage
   - Create a checklist of all files that need updating
   - Update all files consistently before testing
   - Use search tools to verify no old usage remains

2. **Search Commands Used**:
   ```bash
   # Search for localStorage usage
   grep -r "localStorage.getItem('composioApiKey')" js/
   grep -r "localStorage.setItem('composioApiKey'" js/
   grep -r "localStorage.removeItem('composioApiKey'" js/
   
   # Search for old storage module usage
   grep -r "composioStore\." js/
   grep -r "require.*composioStore" js/
   ```

3. **Testing Strategy**:
   - Test the complete user flow, not just individual components
   - Verify data persistence across app restarts
   - Test all features that use the migrated data
   - Check console for any remaining errors

4. **Prevention Strategy**:
   - Document all files that access shared data
   - Use consistent naming conventions for storage functions
   - Consider creating a central storage abstraction layer
   - Always search for ALL usage before making storage changes

5. **Error Pattern Recognition**:
   - Error: "Data not found" or "required field missing"
   - Context: After implementing new storage system
   - Root cause: Inconsistent storage access across files
   - Solution: Search and update ALL files that access the data

**Always verify complete migration - partial updates create silent failures that are hard to debug.**
