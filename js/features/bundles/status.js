/**
 * Bundle Status Detection
 * Handles checking installation status of bundle tools
 */

import configManager from '../../config/config-manager.js';

/**
 * Check if a tool is installed
 * @param {Object} tool - Tool object from bundle
 * @returns {boolean} True if tool is installed
 */
export function isToolInstalled(tool) {
  try {
    const config = configManager.getConfig();
    const servers = config.mcpServers || {};
    
    switch (tool.type) {
      case 'smithery':
        return checkSmitheryTool(servers, tool);
      case 'composio':
        return checkComposioTool(servers, tool);
      case 'apify':
        return checkApifyTool(servers, tool);
      default:
        console.warn('Unknown tool type:', tool.type);
        return false;
    }
  } catch (error) {
    console.error('Error checking tool installation:', error);
    return false;
  }
}

/**
 * Check if Smithery tool is installed
 * @param {Object} servers - MCP servers config
 * @param {Object} tool - Smithery tool
 * @returns {boolean} True if installed
 */
function checkSmitheryTool(servers, tool) {
  const qualifiedName = tool.qualifiedName;
  
  return Object.values(servers).some(server => {
    const command = server.command;
    if (!command) return false;
    
    // Check if command contains the qualified name
    if (Array.isArray(command)) {
      return command.some(arg => arg.includes && arg.includes(qualifiedName));
    } else if (typeof command === 'string') {
      return command.includes(qualifiedName);
    }
    
    return false;
  });
}

/**
 * Check if Composio tool is installed
 * @param {Object} servers - MCP servers config
 * @param {Object} tool - Composio tool
 * @returns {boolean} True if installed
 */
function checkComposioTool(servers, tool) {
  const appKey = tool.app_key.toLowerCase();
  
  return Object.entries(servers).some(([serverName, server]) => {
    // Check server name contains app key
    const nameMatch = serverName.toLowerCase().includes(appKey);
    
    // Check command contains composio and app key
    const command = server.command;
    let commandMatch = false;
    
    if (Array.isArray(command)) {
      commandMatch = command.some(arg => 
        arg.includes && (arg.includes('composio') || arg.includes(appKey))
      );
    } else if (typeof command === 'string') {
      commandMatch = command.includes('composio') && command.includes(appKey);
    }
    
    return nameMatch || commandMatch;
  });
}

/**
 * Check if Apify tool is installed
 * @param {Object} servers - MCP servers config
 * @param {Object} tool - Apify tool
 * @returns {boolean} True if installed
 */
function checkApifyTool(servers, tool) {
  const actorId = tool.actor_id;
  
  return Object.values(servers).some(server => {
    const command = server.command;
    if (!command) return false;
    
    // Check if command contains the actor ID
    if (Array.isArray(command)) {
      return command.some(arg => arg.includes && arg.includes(actorId));
    } else if (typeof command === 'string') {
      return command.includes(actorId);
    }
    
    return false;
  });
}

/**
 * Get installation status for all tools in a bundle
 * @param {Object} bundle - Bundle object
 * @returns {Object} Object with tool installation status
 */
export function getBundleStatus(bundle) {
  const status = {
    totalTools: bundle.tools.length,
    installedTools: 0,
    tools: {}
  };
  
  bundle.tools.forEach(tool => {
    const installed = isToolInstalled(tool);
    status.tools[tool.displayName] = {
      installed,
      type: tool.type,
      required: tool.required
    };
    
    if (installed) {
      status.installedTools++;
    }
  });
  
  status.isComplete = status.installedTools === status.totalTools;
  status.progress = status.totalTools > 0 ? (status.installedTools / status.totalTools) * 100 : 0;
  
  return status;
}

/**
 * Get uninstalled tools from a bundle
 * @param {Object} bundle - Bundle object
 * @returns {Array} Array of uninstalled tools
 */
export function getUninstalledTools(bundle) {
  return bundle.tools.filter(tool => !isToolInstalled(tool));
}

/**
 * Get installed tools from a bundle
 * @param {Object} bundle - Bundle object
 * @returns {Array} Array of installed tools
 */
export function getInstalledTools(bundle) {
  return bundle.tools.filter(tool => isToolInstalled(tool));
}
