/**
 * Composio Connector Module
 * Handles the connection process for Composio apps in the marketplace
 */

import * as notifications from '../../ui/notifications-helper.js';
import configManager from '../../config/config-manager.js';

const { ipcRenderer } = require('electron');

// State variables
let composioService = null;
let currentConnectionRequest = null;

/**
 * Initialize the Composio service
 * @returns {Object} - The Composio service instance
 */
export async function initializeService() {
  try {
    // Get API key from storage
    const apiKey = await ipcRenderer.invoke('composio-get-api-key');
    if (!apiKey) {
      throw new Error('Composio API key is required');
    }
    
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

/**
 * Check for existing connections to an app
 * @param {string} appKey - The app key to check
 * @returns {Promise<Array>} - Array of existing connections
 */
export async function checkExistingConnections(appKey) {
  try {
    // Initialize service if not already initialized
    if (!composioService) {
      await initializeService();
    }
    
    // Get existing connections for this app
    const existingConnections = await composioService.getConnectedAccountsByApp(appKey);
    
    return existingConnections;
  } catch (error) {
    console.error('Error checking existing connections:', error);
    throw error;
  }
}

/**
 * Delete all connections for an app
 * @param {string} appKey - The app key
 * @returns {Promise<Array>} - Array of deletion results
 */
export async function deleteAllConnectionsForApp(appKey) {
  try {
    // Initialize service if not already initialized
    if (!composioService) {
      await initializeService();
    }
    
    // Delete all connections for this app
    const deleteResults = await composioService.deleteAllConnectionsForApp(appKey);
    
    // Show notification
    notifications.showSuccess(`Deleted all existing connections for ${appKey}`);
    
    return deleteResults;
  } catch (error) {
    console.error('Error deleting connections:', error);
    notifications.showError(`Error deleting connections: ${error.message}`);
    throw error;
  }
}

/**
 * Connect to a Composio app with existing connection check
 * @param {Object} item - The Composio app item
 * @param {boolean} skipExistingCheck - Skip checking for existing connections
 * @returns {Promise<Object>} - The connection result
 */
export async function connectToApp(item, skipExistingCheck = false) {
  try {
    // Initialize service if not already initialized
    if (!composioService) {
      await initializeService();
    }
    
    // Check for existing connections unless skipped
    if (!skipExistingCheck) {
      const existingConnections = await checkExistingConnections(item.app_key);
      
      if (existingConnections.length > 0) {
        // Return existing connections info for UI to handle
        return {
          hasExistingConnections: true,
          existingConnections: existingConnections,
          appKey: item.app_key,
          appName: item.repo_name || item.toolkit_name
        };
      }
    }
    
    // Initiate connection
    currentConnectionRequest = await composioService.initiateConnection(item.app_key);
    
    return currentConnectionRequest;
  } catch (error) {
    console.error('Error connecting to app:', error);
    throw error;
  }
}

/**
 * Check connection status
 * @returns {Promise<Object>} - The connection details
 */
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

/**
 * Submit API key for a connection
 * @param {string} apiKey - The API key to submit
 * @returns {Promise<Object>} - The update response
 */
export async function submitApiKey(apiKey) {
  if (!composioService || !currentConnectionRequest?.connectedAccountId) {
    throw new Error('Connection not initiated');
  }
  
  try {
    const connectionId = currentConnectionRequest.connectedAccountId;
    
    // Create a simple payload with the API key
    const updatePayload = { api_key: apiKey };
    
    // Update the connection data with the provided params
    const updateResponse = await composioService.updateConnectionData(connectionId, updatePayload);
    return updateResponse;
  } catch (error) {
    console.error('Error submitting credentials:', error);
    throw error;
  }
}

/**
 * Create an MCP server for the current connection
 * @param {string} name - The name for the MCP server
 * @returns {Promise<Object>} - The MCP server details
 */
export async function createMcpServer(name) {
  if (!composioService) {
    throw new Error('Composio service not initialized');
  }
  
  if (!currentConnectionRequest) {
    throw new Error('No active connection available');
  }
  
  try {
    // Get all V3 connections
    const v3Connections = await composioService.getConnectedAccounts();
    
    // Find the matching connection by ID
    const connectionId = currentConnectionRequest.connectedAccountId || currentConnectionRequest.id;
    const matchingConnection = v3Connections.find(conn => 
      conn.id === connectionId || 
      (conn.deprecated && conn.deprecated.uuid === connectionId)
    );
    
    if (!matchingConnection) {
      throw new Error('Connection not found in V3 API');
    }
    
    if (!matchingConnection.auth_config || !matchingConnection.auth_config.id) {
      throw new Error('Connection missing auth_config.id');
    }
    
    // Create MCP server
    const mcpServer = await composioService.createMcpServer(name, matchingConnection);
    return mcpServer;
  } catch (error) {
    console.error('Error creating MCP server:', error);
    throw error;
  }
}

/**
 * Get the MCP server URL
 * @param {Object} mcpServer - The MCP server object
 * @returns {string} - The MCP server URL
 */
export function getMcpServerUrl(mcpServer) {
  return mcpServer.mcp_url || mcpServer.url;
}

/**
 * Add MCP server to the application configuration
 * @param {string} name - The name for the MCP server
 * @param {Object} mcpServer - The MCP server object from Composio API
 * @returns {Promise<boolean>} - Whether the operation was successful
 */
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
      ],
      composio: {
        source: 'composio',
        appKey: mcpServer.app_key || 'unknown',
        connectionId: mcpServer.connection_id || currentConnectionRequest?.connectedAccountId,
        mcpServerId: mcpServer.id
      }
    };
    
    // Add server to configuration
    configManager.addServer(name, serverConfig, 'active');
    
    // Save configuration
    await configManager.saveConfig();
    
    // Show notification
    notifications.showSuccess(`Added MCP server "${name}" to configuration`);
    
    return true;
  } catch (error) {
    console.error('Error adding MCP server to configuration:', error);
    notifications.showError(`Error adding MCP server: ${error.message}`);
    return false;
  }
}

/**
 * Get the current connection request
 * @returns {Object} - The current connection request
 */
export function getCurrentConnection() {
  return currentConnectionRequest;
}

/**
 * Check if a Composio app is already installed
 * @param {string} appKey - App key to check
 * @returns {boolean} True if app is installed
 */
export function isComposioServerInstalled(appKey) {
  const config = configManager.getConfig();
  if (!config || !config.mcpServers) return false;
  
  return Object.values(config.mcpServers).some(server => 
    server.composio && server.composio.source === 'composio' && server.composio.appKey === appKey
  );
}

/**
 * Get all installed Composio servers
 * @returns {Array} Array of installed Composio app keys
 */
export function getInstalledComposioServers() {
  const config = configManager.getConfig();
  if (!config || !config.mcpServers) return [];
  
  return Object.values(config.mcpServers)
    .filter(server => server.composio && server.composio.source === 'composio')
    .map(server => server.composio.appKey);
}

/**
 * Get the Composio service
 * @returns {Object} - The Composio service
 */
export function getService() {
  return composioService;
}
