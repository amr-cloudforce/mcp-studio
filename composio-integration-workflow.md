# Composio Integration Workflow

This document provides a comprehensive guide to the Composio integration workflow in MCP Studio, from loading apps to initializing connections to creating MCP servers.

## Table of Contents

1. [Overview](#overview)
2. [Core Components](#core-components)
3. [Loading Apps](#loading-apps)
4. [Initializing Connections](#initializing-connections)
5. [Creating MCP Servers](#creating-mcp-servers)
6. [Complete Workflow](#complete-workflow)

## Overview

The Composio integration in MCP Studio allows users to connect to third-party services via Composio and create MCP servers that expose these services as tools and resources. The workflow consists of three main steps:

1. **Loading Apps**: Fetching available apps from Composio API
2. **Initializing Connections**: Connecting to a selected app via OAuth or API key
3. **Creating MCP Servers**: Creating an MCP server for the connected app

## Core Components

The integration is built on several key components:

### 1. Core Service

`composio-service.js` - A lightweight wrapper around the Composio SDK and REST API endpoints.

```javascript
const { ComposioToolSet } = require('composio-core');

// single shared SDK instance
let _toolset = null;

function initializeSDK(apiKey) {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('initializeSDK: apiKey (string) required');
  }
  _toolset = new ComposioToolSet({ apiKey });
  return _toolset;
}

// V3 API helpers
async function getConnectedAccounts() {
  _guard();
  const res = await fetch(
    'https://backend.composio.dev/api/v3/connected_accounts',
    { headers: { 'x-api-key': _toolset.apiKey } }
  );
  if (!res.ok) throw _httpErr('get connected accounts', res);
  const { items = [] } = await res.json();
  return items;
}

async function createMcpServer(name, connection, allowedTools = []) {
  _guard();
  if (!name) throw new Error('createMcpServer: name required');
  if (!connection?.auth_config?.id) {
    throw new Error('createMcpServer: connection missing auth_config.id');
  }

  const payload = {
    name,
    auth_config_id: connection.auth_config.id,
    ...(allowedTools.length && { allowed_tools: allowedTools })
  };

  const res = await fetch('https://backend.composio.dev/api/v3/mcp/servers', {
    method: 'POST',
    headers: {
      'x-api-key': _toolset.apiKey,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw _httpErr('create MCP server', res);
  return res.json();
}

// V1 API helpers
async function listApps() {
  _guard();
  const out = await _toolset.client.apps.list();
  return _normalizeArrayResponse(out);
}

async function initiateConnection(appName, entityId = 'default') {
  _guard();
  if (!appName) throw new Error('initiateConnection: appName required');

  // try to create auth_config up front (optional but nicer UX)
  let authConfig;
  try {
    authConfig = await createAuthConfig(appName);
  } catch (e) {
    console.warn('initiateConnection: createAuthConfig failed ->', e.message);
  }

  const payload = { appName, entityId };
  const resp = await _toolset.client.connectedAccounts.initiate(payload);
  if (authConfig?.auth_config) resp.auth_config = authConfig.auth_config;
  return resp;
}
```

### 2. Connection Module

`quick-add-connection.js` - Handles the connection process for Composio apps.

```javascript
// State variables
let currentConnectionRequest = null;
let composioService = null;

export async function initializeService(apiKey) {
  try {
    // Use the composio-service.js module
    composioService = require('./composio-service.js');
    
    // Initialize SDK with the API key
    composioService.initializeSDK(apiKey);
    
    // Verify API key
    await composioService.verifyApiKey();
    
    return composioService;
  } catch (error) {
    console.error('Error initializing Composio service:', error);
    throw error;
  }
}

export async function initiateConnection(appKey, apiKey) {
  if (!composioService) {
    await initializeService(apiKey);
  }
  
  try {
    currentConnectionRequest = await composioService.initiateConnection(appKey);
    return currentConnectionRequest;
  } catch (error) {
    console.error('Error initiating connection:', error);
    throw error;
  }
}

export async function checkConnectionStatus() {
  if (!composioService || !currentConnectionRequest?.connectedAccountId) {
    throw new Error('Connection not initiated');
  }
  
  try {
    const connectionId = currentConnectionRequest.connectedAccountId;
    
    // Get connection details
    const connectionDetails = await composioService.getConnection(connectionId);
    
    // Update current connection request with the latest details
    if (connectionDetails.status === 'ACTIVE') {
      currentConnectionRequest = connectionDetails;
    }
    
    return connectionDetails;
  } catch (error) {
    console.error('Error checking status:', error);
    throw error;
  }
}
```

### 3. MCP Module

`quick-add-mcp.js` - Handles MCP server creation for Composio connections.

```javascript
import * as connection from './quick-add-connection.js';
import configManager from '../../config/config-manager.js';

export async function createMcpServer(name) {
  const composioService = connection.getService();
  const currentConnection = connection.getCurrentConnection();
  
  if (!composioService) {
    throw new Error('Composio service not initialized');
  }
  
  if (!currentConnection) {
    throw new Error('No active connection available');
  }
  
  try {
    // Get all V3 connections
    const v3Connections = await composioService.getConnectedAccounts();
    
    // Find the matching connection by ID
    const connectionId = currentConnection.connectedAccountId || currentConnection.id;
    const matchingConnection = v3Connections.find(conn => 
      conn.id === connectionId || 
      (conn.deprecated && conn.deprecated.uuid === connectionId)
    );
    
    if (!matchingConnection) {
      throw new Error('Connection not found in V3 API');
    }
    
    // Create MCP server
    const mcpServer = await composioService.createMcpServer(name, matchingConnection);
    return mcpServer;
  } catch (error) {
    console.error('Error creating MCP server:', error);
    throw error;
  }
}

export async function addMcpServerToConfig(name, mcpServer) {
  try {
    const url = getMcpServerUrl(mcpServer);
    
    if (!url) {
      throw new Error('MCP server URL not found');
    }
    
    // Create server configuration
    const serverConfig = {
      command: 'npx',
      args: [
        '@composio/mcp@latest',
        'start',
        '--url',
        url
      ]
    };
    
    // Add server to configuration
    configManager.addServer(name, serverConfig, 'active');
    
    // Save configuration
    await configManager.saveConfig();
    
    return true;
  } catch (error) {
    console.error('Error adding MCP server to configuration:', error);
    return false;
  }
}
```

### 4. UI Components

`app-selector.js` - Handles the UI for fetching and selecting Composio apps.

```javascript
import * as connection from './quick-add-connection.js';
import * as ui from './quick-add-ui.js';

let apiKeyInput;
let appSelect;
let fetchButton;
let cachedApps = [];

async function fetchApps() {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showError('API Key is required');
    return;
  }
  
  try {
    // Initialize the Composio service
    await connection.initializeService(apiKey);
    
    // Fetch available apps
    const apps = await connection.getService().listApps();
    cachedApps = apps;
    
    // Populate the select dropdown
    appSelect.innerHTML = '';
    
    apps.forEach(app => {
      const option = document.createElement('option');
      option.value = app.uniqueKey || app.name;
      option.textContent = app.displayName || app.name;
      appSelect.appendChild(option);
    });
    
    // Show the app select
    appSelect.style.display = 'block';
  } catch (error) {
    console.error('Error fetching Composio apps:', error);
    showError(`Error: ${error.message || 'Failed to fetch apps'}`);
  }
}
```

## Loading Apps

The app loading process begins when a user enters their Composio API key and clicks the "FETCH AVAILABLE APPS" button.

### Step 1: Initialize the Composio Service

```javascript
// From quick-add-connection.js
export async function initializeService(apiKey) {
  try {
    // Use the composio-service.js module
    composioService = require('./composio-service.js');
    
    // Initialize SDK with the API key
    composioService.initializeSDK(apiKey);
    
    // Verify API key
    await composioService.verifyApiKey();
    
    return composioService;
  } catch (error) {
    console.error('Error initializing Composio service:', error);
    throw error;
  }
}
```

This function:
1. Requires the composio-service.js module
2. Initializes the SDK with the provided API key
3. Verifies the API key by making a test API call
4. Returns the initialized service

### Step 2: Fetch Available Apps

```javascript
// From composio-service.js
async function listApps() {
  _guard();
  const out = await _toolset.client.apps.list();
  return _normalizeArrayResponse(out);
}
```

This function:
1. Checks if the SDK is initialized
2. Calls the Composio API to list available apps
3. Normalizes the response to ensure it's an array

### Step 3: Display Apps in UI

```javascript
// From app-selector.js
apps.forEach(app => {
  const option = document.createElement('option');
  option.value = app.uniqueKey || app.name;
  option.textContent = app.displayName || app.name;
  appSelect.appendChild(option);
});

// Show the app select
appSelect.style.display = 'block';
```

This code:
1. Creates an option element for each app
2. Sets the value to the app's uniqueKey or name
3. Sets the display text to the app's displayName or name
4. Adds the option to the select dropdown
5. Makes the dropdown visible

### Example Output

When the apps are successfully loaded, the UI displays a dropdown with available apps:

```
Available Apps:
- Slack
- GitHub
- Google Drive
- Notion
- Jira
- Trello
- ...
```

## Initializing Connections

After selecting an app, the user clicks the "CONNECT TO APP" button to initiate a connection.

### Step 1: Initiate Connection

```javascript
// From quick-add-connection.js
export async function initiateConnection(appKey, apiKey) {
  if (!composioService) {
    await initializeService(apiKey);
  }
  
  try {
    currentConnectionRequest = await composioService.initiateConnection(appKey);
    return currentConnectionRequest;
  } catch (error) {
    console.error('Error initiating connection:', error);
    throw error;
  }
}
```

This function:
1. Ensures the Composio service is initialized
2. Calls the service's initiateConnection method with the selected app key
3. Stores the connection request for later use
4. Returns the connection request

### Step 2: Handle Connection Response

```javascript
// From quick-add-ui.js
if (connectionRequest.redirectUrl) {
  // OAuth flow initiated
  oauthLink.href = connectionRequest.redirectUrl;
  oauthLink.textContent = connectionRequest.redirectUrl;
  oauthContainer.style.display = 'block';
  updateStatus('OAuth connection initiated. Please complete the authorization in your browser.', 'info');
} else if (connectionRequest.connectionStatus === 'PENDING_PARAMS') {
  // App requires user-provided parameters (like API Key)
  apiKeyPrompt.style.display = 'block';
  updateStatus('Connection requires additional parameters', 'info');
} else if (connectionRequest.connectionStatus === 'ACTIVE') {
  // Connection is immediately active
  handleConnectionActive();
}
```

This code:
1. Checks if the connection requires OAuth authentication
   - If yes, displays the OAuth URL for the user to complete authorization
2. Checks if the connection requires additional parameters
   - If yes, displays a form for the user to provide them
3. Checks if the connection is already active
   - If yes, proceeds to the MCP server creation step

### Step 3: Check Connection Status

For OAuth connections, the user needs to complete the authorization in their browser. After that, they click the "Check Connection Status" button.

```javascript
// From quick-add-connection.js
export async function checkConnectionStatus() {
  if (!composioService || !currentConnectionRequest?.connectedAccountId) {
    throw new Error('Connection not initiated');
  }
  
  try {
    const connectionId = currentConnectionRequest.connectedAccountId;
    
    // Get connection details
    const connectionDetails = await composioService.getConnection(connectionId);
    
    // Update current connection request with the latest details
    if (connectionDetails.status === 'ACTIVE') {
      currentConnectionRequest = connectionDetails;
    }
    
    return connectionDetails;
  } catch (error) {
    console.error('Error checking status:', error);
    throw error;
  }
}
```

This function:
1. Gets the connection ID from the current connection request
2. Calls the Composio API to get the latest connection details
3. Updates the current connection request if the status is ACTIVE
4. Returns the connection details

### Example Output

When a connection is successfully established, the UI displays:

```
Connection Status: ACTIVE
Connection for [App Name] is ACTIVE!
```

## Creating MCP Servers

Once the connection is active, the user can create an MCP server by providing a name and clicking the "CREATE MCP SERVER" button.

### Step 1: Create MCP Server

```javascript
// From quick-add-mcp.js
export async function createMcpServer(name) {
  const composioService = connection.getService();
  const currentConnection = connection.getCurrentConnection();
  
  try {
    // Get all V3 connections
    const v3Connections = await composioService.getConnectedAccounts();
    
    // Find the matching connection by ID
    const connectionId = currentConnection.connectedAccountId || currentConnection.id;
    const matchingConnection = v3Connections.find(conn => 
      conn.id === connectionId || 
      (conn.deprecated && conn.deprecated.uuid === connectionId)
    );
    
    // Create MCP server
    const mcpServer = await composioService.createMcpServer(name, matchingConnection);
    return mcpServer;
  } catch (error) {
    console.error('Error creating MCP server:', error);
    throw error;
  }
}
```

This function:
1. Gets all V3 connections from the Composio API
2. Finds the matching connection by ID
3. Calls the Composio API to create an MCP server
4. Returns the created MCP server

### Step 2: Add MCP Server to Configuration

```javascript
// From quick-add-mcp.js
export async function addMcpServerToConfig(name, mcpServer) {
  try {
    const url = getMcpServerUrl(mcpServer);
    
    // Create server configuration
    const serverConfig = {
      command: 'npx',
      args: [
        '@composio/mcp@latest',
        'start',
        '--url',
        url
      ]
    };
    
    // Add server to configuration
    configManager.addServer(name, serverConfig, 'active');
    
    // Save configuration
    await configManager.saveConfig();
    
    return true;
  } catch (error) {
    console.error('Error adding MCP server to configuration:', error);
    return false;
  }
}
```

This function:
1. Gets the MCP server URL
2. Creates a server configuration with the command and arguments
3. Adds the server to the application configuration
4. Saves the configuration
5. Returns true if successful

### Example Output

When an MCP server is successfully created, the UI displays:

```
MCP Server Created Successfully!
Your MCP server is now available at: https://mcp.composio.dev/servers/abc123
MCP server added to configuration. You can now start it from the main screen.
```

## Complete Workflow

The complete workflow for integrating Composio apps in MCP Studio is as follows:

1. **Loading Apps**
   - User enters Composio API key
   - User clicks "FETCH AVAILABLE APPS"
   - System initializes Composio service
   - System fetches available apps
   - System displays apps in dropdown

2. **Initializing Connections**
   - User selects an app
   - User clicks "CONNECT TO APP"
   - System initiates connection
   - If OAuth required:
     - User opens OAuth URL in browser
     - User completes authorization
     - User clicks "Check Connection Status"
   - If API key required:
     - User enters API key
     - User clicks "Submit"
     - User clicks "Check Connection Status"
   - System verifies connection is active

3. **Creating MCP Servers**
   - User enters MCP server name
   - User clicks "CREATE MCP SERVER"
   - System creates MCP server
   - System adds server to configuration
   - System displays success message with MCP server URL

This workflow enables users to easily connect to third-party services via Composio and create MCP servers that expose these services as tools and resources in MCP Studio.
