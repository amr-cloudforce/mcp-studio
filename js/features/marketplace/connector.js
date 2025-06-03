/**
 * Local Marketplace Connector Module
 * Handles server installation detection for local marketplace items
 */

import configManager from '../../config/config-manager.js';

/**
 * Check if a local marketplace server is installed
 * @param {string} repoName - Repository name to check
 * @returns {boolean} True if server is installed
 */
export function isLocalServerInstalled(repoName) {
  const config = configManager.getConfig();
  const mcpServers = config.mcpServers || {};
  
  // Check if any server has this repo name in its command or matches the name
  for (const [serverName, serverConfig] of Object.entries(mcpServers)) {
    // Check if server name matches repo name
    if (serverName === repoName) {
      return true;
    }
    
    // Check if command contains the repo name (for npx or other installations)
    if (serverConfig.command && typeof serverConfig.command === 'string') {
      if (serverConfig.command.includes(repoName)) {
        return true;
      }
    }
    
    // Check if command array contains the repo name
    if (Array.isArray(serverConfig.command)) {
      if (serverConfig.command.some(cmd => cmd.includes(repoName))) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Get all installed local marketplace servers
 * @returns {Array} Array of installed server repo names
 */
export function getInstalledLocalServers() {
  const config = configManager.getConfig();
  const mcpServers = config.mcpServers || {};
  
  return Object.keys(mcpServers);
}
