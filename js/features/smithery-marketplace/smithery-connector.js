/**
 * Smithery Connector - Installation Logic
 * Handles server installation and config management integration
 */

import { generateHttpConfig, generateStdioConfig, getDefaultConnectionType } from './smithery-config.js';
import { getCredentials } from './smithery-service.js';
import configManager from '../../config/config-manager.js';

/**
 * Install a Smithery server with HTTP connection (default)
 * @param {string} serverName - Name for the MCP server
 * @param {Object} server - Server details from API
 * @returns {Promise<boolean>} Success status
 */
export async function installHttpServer(serverName, server) {
  if (!serverName || !server) {
    throw new Error('installHttpServer: serverName and server required');
  }
  
  try {
    // Get credentials
    const credentials = await getCredentials();
    if (!credentials) {
      throw new Error('No credentials found. Please set API key and profile.');
    }
    
    const config = generateHttpConfig(server, credentials);
    
    // Add Smithery metadata
    config.smithery = {
      qualifiedName: server.qualifiedName,
      source: 'smithery',
      connectionType: 'http'
    };
    
    // Add server to configuration
    configManager.addServer(serverName, config, 'active');
    await configManager.saveConfig();
    
    alert(`Successfully added Smithery server "${serverName}" (HTTP) to configuration`);
    return true;
  } catch (error) {
    console.error('Error installing HTTP server:', error);
    alert(`Failed to install server: ${error.message}`);
    return false;
  }
}

/**
 * Install a Smithery server with stdio connection
 * @param {string} serverName - Name for the MCP server
 * @param {Object} server - Server details from API
 * @param {Object} userConfig - User-provided configuration parameters
 * @returns {Promise<boolean>} Success status
 */
export async function installStdioServer(serverName, server, userConfig = {}) {
  if (!serverName || !server) {
    throw new Error('installStdioServer: serverName and server required');
  }
  
  try {
    const config = generateStdioConfig(server, userConfig);
    
    // Add Smithery metadata
    config.smithery = {
      qualifiedName: server.qualifiedName,
      source: 'smithery',
      connectionType: 'stdio'
    };
    
    // Add server to configuration
    configManager.addServer(serverName, config, 'active');
    await configManager.saveConfig();
    
    alert(`Successfully added Smithery server "${serverName}" (stdio) to configuration`);
    return true;
  } catch (error) {
    console.error('Error installing stdio server:', error);
    alert(`Failed to install server: ${error.message}`);
    return false;
  }
}

/**
 * Install a server using the default connection type
 * @param {string} serverName - Name for the MCP server
 * @param {Object} server - Server details from API
 * @param {Object} userConfig - User-provided configuration (for stdio)
 * @returns {Promise<boolean>} Success status
 */
export async function installServer(serverName, server, userConfig = {}) {
  const connectionType = getDefaultConnectionType(server);
  
  if (connectionType === 'http') {
    return installHttpServer(serverName, server);
  } else {
    return installStdioServer(serverName, server, userConfig);
  }
}

/**
 * Check if a server name already exists in configuration
 * @param {string} serverName - Server name to check
 * @returns {boolean} True if name exists
 */
export function isServerNameTaken(serverName) {
  const config = configManager.getConfig();
  return config && config.mcpServers && serverName in config.mcpServers;
}

/**
 * Check if a Smithery server is already installed
 * @param {string} qualifiedName - Server qualified name
 * @returns {boolean} True if server is installed
 */
export function isSmitheryServerInstalled(qualifiedName) {
  const config = configManager.getConfig();
  if (!config || !config.mcpServers) return false;
  
  return Object.values(config.mcpServers).some(server => 
    server.smithery && server.smithery.qualifiedName === qualifiedName
  );
}

/**
 * Get all installed Smithery servers
 * @returns {Array} Array of installed Smithery server qualified names
 */
export function getInstalledSmitheryServers() {
  const config = configManager.getConfig();
  if (!config || !config.mcpServers) return [];
  
  return Object.values(config.mcpServers)
    .filter(server => server.smithery && server.smithery.source === 'smithery')
    .map(server => server.smithery.qualifiedName);
}

/**
 * Generate a unique server name based on qualified name
 * @param {string} qualifiedName - Server qualified name
 * @returns {string} Unique server name
 */
export function generateUniqueServerName(qualifiedName) {
  // Extract name from qualified name (e.g., "@jlia0/servers" -> "servers")
  const baseName = qualifiedName.split('/').pop() || qualifiedName;
  
  if (!isServerNameTaken(baseName)) {
    return baseName;
  }
  
  // Add suffix if name is taken
  let counter = 1;
  let uniqueName = `${baseName}-${counter}`;
  
  while (isServerNameTaken(uniqueName)) {
    counter++;
    uniqueName = `${baseName}-${counter}`;
  }
  
  return uniqueName;
}
