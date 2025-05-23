/**
 * Apify Marketplace Connector Module
 * Handles server configuration management for Apify actors
 */

const { ipcRenderer } = require('electron');

/**
 * Add an actor to the Apify server configuration
 * @param {string} actorId - Actor identifier (username/name format) to add
 * @returns {Promise<boolean>} - True if successful
 */
export async function addActor(actorId) {
  try {
    console.log('[DEBUG] Adding actor to server:', actorId);
    
    // Get current configuration
    const config = await ipcRenderer.invoke('get-config');
    const serverName = 'actors-mcp-server';
    
    // Get API key
    const apiKey = await ipcRenderer.invoke('apify-get-api-key');
    if (!apiKey) {
      throw new Error('No Apify API key found. Please set an API key first.');
    }
    
    // Initialize server if it doesn't exist
    if (!config.mcpServers[serverName]) {
      config.mcpServers[serverName] = {
        command: "npx",
        args: ["-y", "@apify/actors-mcp-server", "--actors", actorId],
        env: {
          "APIFY_TOKEN": apiKey
        }
      };
    } else {
      // Add to existing actors list
      const args = config.mcpServers[serverName].args;
      const actorsIndex = args.indexOf('--actors');
      
      if (actorsIndex === -1) {
        // No --actors argument exists, add it
        args.push('--actors', actorId);
      } else if (actorsIndex + 1 >= args.length) {
        // --actors exists but no value, add the actor
        args.push(actorId);
      } else {
        // --actors exists with value, append to it
        const currentActors = args[actorsIndex + 1];
        const actorsList = currentActors ? currentActors.split(',').map(id => id.trim()) : [];
        
        if (!actorsList.includes(actorId)) {
          actorsList.push(actorId);
          args[actorsIndex + 1] = actorsList.join(',');
        }
      }
      
      // Update API key in env
      config.mcpServers[serverName].env = {
        ...config.mcpServers[serverName].env,
        "APIFY_TOKEN": apiKey
      };
    }
    
    // Save configuration
    await ipcRenderer.invoke('save-config', config);
    console.log('[DEBUG] Actor added successfully:', actorId);
    
    // Show success notification and refresh server list
    await showSuccessAndRefresh(`Actor ${actorId} added successfully!`);
    
    return true;
  } catch (error) {
    console.error('Failed to add actor:', error);
    return false;
  }
}

/**
 * Remove an actor from the Apify server configuration
 * @param {string} actorId - Actor identifier (username/name format) to remove
 * @returns {Promise<boolean>} - True if successful
 */
export async function removeActor(actorId) {
  try {
    console.log('[DEBUG] Removing actor from server:', actorId);
    
    // Get current configuration
    const config = await ipcRenderer.invoke('get-config');
    const serverName = 'actors-mcp-server';
    
    if (!config.mcpServers[serverName]) {
      console.log('[DEBUG] No Apify server found, nothing to remove');
      return true;
    }
    
    const args = config.mcpServers[serverName].args;
    const actorsIndex = args.indexOf('--actors');
    
    if (actorsIndex === -1 || actorsIndex + 1 >= args.length) {
      console.log('[DEBUG] No actors argument found, nothing to remove');
      return true;
    }
    
    const currentActors = args[actorsIndex + 1];
    const actorsList = currentActors ? currentActors.split(',').map(id => id.trim()) : [];
    
    // Remove the actor from the list
    const updatedActorsList = actorsList.filter(id => id !== actorId);
    
    if (updatedActorsList.length === 0) {
      // No actors left, remove the entire server
      delete config.mcpServers[serverName];
    } else {
      // Update the actors list
      args[actorsIndex + 1] = updatedActorsList.join(',');
    }
    
    // Save configuration
    await ipcRenderer.invoke('save-config', config);
    console.log('[DEBUG] Actor removed successfully:', actorId);
    
    // Show success notification and refresh server list
    await showSuccessAndRefresh(`Actor ${actorId} removed successfully!`);
    
    return true;
  } catch (error) {
    console.error('Failed to remove actor:', error);
    return false;
  }
}

/**
 * Get all currently configured actors
 * @returns {Promise<Array>} - Array of actor identifiers
 */
export async function getConfiguredActors() {
  try {
    const config = await ipcRenderer.invoke('get-config');
    const serverName = 'actors-mcp-server';
    
    if (!config.mcpServers[serverName]) {
      return [];
    }
    
    const args = config.mcpServers[serverName].args;
    const actorsIndex = args.indexOf('--actors');
    
    if (actorsIndex === -1 || actorsIndex + 1 >= args.length) {
      return [];
    }
    
    const currentActors = args[actorsIndex + 1];
    return currentActors ? currentActors.split(',').map(id => id.trim()) : [];
  } catch (error) {
    console.error('Failed to get configured actors:', error);
    return [];
  }
}

/**
 * Check if an actor is currently configured
 * @param {string} actorId - Actor identifier to check
 * @returns {Promise<boolean>} - True if actor is configured
 */
export async function isActorConfigured(actorId) {
  const configuredActors = await getConfiguredActors();
  return configuredActors.includes(actorId);
}

/**
 * Update the API key in the server configuration
 * @param {string} apiKey - New API key
 * @returns {Promise<boolean>} - True if successful
 */
export async function updateApiKey(apiKey) {
  try {
    const config = await ipcRenderer.invoke('get-config');
    const serverName = 'actors-mcp-server';
    
    if (config.mcpServers[serverName]) {
      config.mcpServers[serverName].env = {
        ...config.mcpServers[serverName].env,
        "APIFY_TOKEN": apiKey
      };
      
      await ipcRenderer.invoke('save-config', config);
    }
    
    return true;
  } catch (error) {
    console.error('Failed to update API key in server config:', error);
    return false;
  }
}

/**
 * Show success notification and refresh server list (like Composio does)
 * @param {string} message - Success message to show
 */
async function showSuccessAndRefresh(message) {
  try {
    // Import notifications module
    const notifications = await import('../../ui/notifications.js');
    
    // Show success notification
    notifications.default.showSuccess(message);
    
    // Show restart warning (same as Composio)
    notifications.default.showRestartWarning();
    
    // Refresh server list to show changes
    if (window.serverList && window.serverList.refreshList) {
      window.serverList.refreshList();
    }
    
    // Close modal after a short delay (like Composio does)
    setTimeout(() => {
      if (window.modalManager && window.modalManager.closeActiveModal) {
        window.modalManager.closeActiveModal();
      }
    }, 2000);
    
  } catch (error) {
    console.error('Failed to show success notification:', error);
  }
}
