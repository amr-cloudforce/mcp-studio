# Electron Integration Notes

## Problem

We encountered an issue where the renderer process couldn't access the `composio-service.js` module directly. This was causing errors like:

```
Error: module not found: ./composio-service.js
```

The root cause was that the app was configured with secure Electron settings:
- `contextIsolation: true`
- `nodeIntegration: false`

These settings prevent the renderer process from directly accessing Node.js APIs, including the `require` function needed to load the `composio-service.js` module.

## Solution

We adopted the same approach used in the composio-connection-manager app, which uses:
- `contextIsolation: false`
- `nodeIntegration: true`

This allows the renderer process to directly access Node.js APIs, including the `require` function.

### Changes Made

1. Updated `main.js` to use `nodeIntegration: true` and `contextIsolation: false` in the BrowserWindow configuration.

2. Simplified `preload.js` to be a placeholder, removing the contextBridge code since it's not needed with contextIsolation disabled.

3. Updated several files to use direct IPC calls and Node.js require instead of going through window.api:
   - `js/renderer.js` now directly requires Node.js modules including composio-service.js
   - `js/ui/notifications.js` now uses require('electron').ipcRenderer.invoke
   - `js/config/config-manager.js` now uses require('electron').ipcRenderer.invoke
   - `js/main.js` now uses require('electron').ipcRenderer.invoke
   - `js/ui/about-modal.js` now uses require('electron').ipcRenderer.invoke
   - `js/features/marketplace/data.js` now uses require('electron').ipcRenderer.invoke
   - `js/features/marketplace/ui.js` now uses require('electron').ipcRenderer.invoke
   - `js/ui/server-form/template-handlers/composio.js` now directly requires composio-service.js

## Security Implications

**IMPORTANT**: This approach is less secure than the original configuration. With `nodeIntegration: true` and `contextIsolation: false`, the renderer process has full access to Node.js APIs, which could be a security risk if the app loads untrusted content.

The composio-connection-manager app includes this warning in its code:

```javascript
// WARNING: nodeIntegration is true and contextIsolation is false for simplicity.
// This is INSECURE for production apps receiving untrusted content.
// For a secure app, use contextIsolation: true and bridge Node.js APIs via preload.js.
```

## Reverting to Secure Settings

If you want to revert to the more secure settings, you would need to:

1. Change `main.js` back to use `contextIsolation: true` and `nodeIntegration: false`.

2. Restore the original `preload.js` that uses contextBridge to expose specific APIs to the renderer process.

3. Update all the files that were changed to use direct IPC calls back to using window.api.

4. For the Composio integration specifically, you would need to modify the template handler to use window.composioService (exposed via preload.js) instead of directly requiring composio-service.js.

## Alternative Approaches

A more secure alternative would be to:

1. Keep `contextIsolation: true` and `nodeIntegration: false`.

2. Use the preload script to expose only the specific composio-service.js functions needed by the renderer process.

3. Use IPC (Inter-Process Communication) to handle operations that need Node.js access, keeping the renderer process isolated from direct Node.js access.

This would provide better security while still allowing the necessary functionality.
