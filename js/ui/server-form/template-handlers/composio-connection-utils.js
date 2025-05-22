/**
 * Composio Connection Utilities
 * Handles connection-related functions for the Composio template
 */

// Store the Composio service instance
let composioService = null;
let currentConnectionId = null;

/**
 * Initialize the Composio service
 * @param {string} apiKey - Composio API key
 */
export async function initializeService(apiKey) {
  try {
    // Get the Composio service from the main process
    composioService = await require('electron').ipcRenderer.invoke('get-composio-service');
    
    // Initialize the SDK with the API key
    composioService.initializeSDK(apiKey);
    
    // Verify the API key
    await composioService.verifyApiKey();
    
    return true;
  } catch (error) {
    console.error('Failed to initialize Composio service:', error);
    throw new Error(`Failed to initialize Composio service: ${error.message}`);
  }
}

/**
 * Fetch available apps from Composio
 * @returns {Array} - List of available apps
 */
export async function fetchApps() {
  if (!composioService) {
    throw new Error('Composio service not initialized');
  }
  
  try {
    const apps = await composioService.listApps();
    return apps;
  } catch (error) {
    console.error('Failed to fetch Composio apps:', error);
    throw new Error(`Failed to fetch apps: ${error.message}`);
  }
}

/**
 * Initiate a connection to a Composio app
 * @param {string} appKey - App key or name
 * @returns {Object} - Connection request details
 */
export async function initiateConnection(appKey) {
  if (!composioService) {
    throw new Error('Composio service not initialized');
  }
  
  try {
    const connectionRequest = await composioService.initiateConnection(appKey);
    currentConnectionId = connectionRequest.connectedAccountId;
    return connectionRequest;
  } catch (error) {
    console.error('Failed to initiate Composio connection:', error);
    throw new Error(`Failed to initiate connection: ${error.message}`);
  }
}

/**
 * Check the status of a connection
 * @returns {Object} - Connection details
 */
export async function checkConnectionStatus() {
  if (!composioService || !currentConnectionId) {
    throw new Error('No active connection to check');
  }
  
  try {
    const connection = await composioService.getConnection(currentConnectionId);
    return connection;
  } catch (error) {
    console.error('Failed to check connection status:', error);
    throw new Error(`Failed to check connection status: ${error.message}`);
  }
}

/**
 * Submit API key or other parameters for a connection
 * @param {string} value - API key or other parameter value
 */
export async function submitApiKey(value) {
  if (!composioService || !currentConnectionId) {
    throw new Error('No active connection to update');
  }
  
  try {
    await composioService.updateConnectionData(currentConnectionId, { apiKey: value });
    return true;
  } catch (error) {
    console.error('Failed to submit API key:', error);
    throw new Error(`Failed to submit API key: ${error.message}`);
  }
}

/**
 * Create an MCP server for a connection
 * @param {string} name - Server name
 * @returns {Object} - MCP server details
 */
export async function createMcpServer(name) {
  if (!composioService) {
    throw new Error('Composio service not initialized');
  }
  
  try {
    // Get connected accounts
    const accounts = await composioService.getConnectedAccounts();
    
    // Find the current connection
    const connection = accounts.find(account => account.id === currentConnectionId);
    
    if (!connection) {
      throw new Error('Connection not found');
    }
    
    // Create MCP server
    const mcpServer = await composioService.createMcpServer(name, connection);
    return mcpServer;
  } catch (error) {
    console.error('Failed to create MCP server:', error);
    throw new Error(`Failed to create MCP server: ${error.message}`);
  }
}

/**
 * Get the URL for an MCP server
 * @param {Object} mcpServer - MCP server details
 * @returns {string} - MCP server URL
 */
export function getMcpServerUrl(mcpServer) {
  return mcpServer.mcp_url || mcpServer.url || '';
}
