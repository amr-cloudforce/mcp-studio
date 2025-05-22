/**
 * Quick Add MCP Module
 * Handles MCP server creation for Composio connections in the Quick Add flow
 */

import * as connection from './quick-add-connection.js';
import configManager from '../../config/config-manager.js';

/**
 * Create an MCP server for the current connection
 * @param {string} name - The name for the MCP server
 * @returns {Object} - The MCP server details
 */
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
 * @returns {boolean} - Whether the operation was successful
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
      ]
    };
    
    // Add server to configuration
    configManager.addServer(name, serverConfig, 'active');
    
    // Save configuration
    await configManager.saveConfig();
    
    console.log(`Added MCP server "${name}" to configuration with URL: ${url}`);
    return true;
  } catch (error) {
    console.error('Error adding MCP server to configuration:', error);
    return false;
  }
}
