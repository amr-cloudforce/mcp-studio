/*
 * CODING CONSTITUTION - MANDATORY RULES:
 * 
 * 1. Never change anything that has not been discussed with the user or is unrelated to the current task.
 * 2. Never add placeholders or dummy or demo data without an explicit request from the user.
 * 3. Never make a code file larger than 300 lines of code; if it exceeds this, split it as appropriate. 
 *    THE only exceptions ARE JSON DATA FILES, PACKAGE.JSON OR OTHER FILES THAT ARE NOT MEANT TO BE SPLIT.
 * 4. Never make assumptions on behalf of the user. If you don't know how to do something or keep going 
 *    round in circles, you stop and think about the cause instead of doing trial and error and wasting 
 *    the user's time and money.
 * 5. When there is a bug, your most important task is to identify the possible reasons and use debugging 
 *    techniques (don't ever ask the user to read code and debug for you) to reduce the search radius, 
 *    e.g. add a log that would confirm an assumption before starting to code.
 * 6. When you fix something and the error is not fixed because you made a wrong assumption, you undo 
 *    this yourself without an explicit request from the user.
 * 
 * WARNING: NOT ADHERING TO THESE LAWS IS CONSIDERED BREAKING THE LAW AND COULD LEAD TO SEVERE DAMAGE.
 */

/**
 * Configuration Manager
 * Handles reading and writing MCP server configurations
 */

// Default configuration
const DEFAULT_CONFIG = {
  mcpServers: {},
  inactive: {}
};

class ConfigManager {
  constructor() {
    this.config = { ...DEFAULT_CONFIG };
    this.changeListeners = [];
  }

  /**
   * Load configuration from file
   */
  async loadConfig() {
    try {
      const configText = await require('electron').ipcRenderer.invoke('read-config');
      console.log("Loaded MCP config:", configText);
      
      try {
        this.config = JSON.parse(configText);
        
        // Ensure required properties exist
        if (!this.config.mcpServers) {
          this.config.mcpServers = {};
        }
        
        if (!this.config.inactive) {
          this.config.inactive = {};
        }
      } catch (err) {
        console.error("Invalid JSON in config file:", err);
        this.config = { ...DEFAULT_CONFIG };
      }
      
      return this.config;
    } catch (err) {
      console.error("Failed to read config file:", err);
      this.config = { ...DEFAULT_CONFIG };
      return this.config;
    }
  }

  /**
   * Save configuration to file
   */
  async saveConfig() {
    try {
      await require('electron').ipcRenderer.invoke('write-config', JSON.stringify(this.config, null, 2));
      
      // Auto-sync to enabled clients if auto-sync is enabled
      try {
        const clientSync = require('./client-sync');
        if (clientSync.isAutoSyncEnabled()) {
          console.log('[CONFIG-MANAGER] Auto-syncing to enabled clients');
          const activeServers = this.config.mcpServers || {};
          clientSync.syncAll(activeServers);
        }
      } catch (syncError) {
        console.warn('[CONFIG-MANAGER] Client sync not available:', syncError.message);
      }
      
      this.notifyChangeListeners();
      return true;
    } catch (err) {
      console.error("Failed to write config file:", err);
      return false;
    }
  }

  /**
   * Get the current configuration
   */
  getConfig() {
    return this.config;
  }

  /**
   * Add a server to the configuration
   * @param {string} name - Server name
   * @param {object} serverConfig - Server configuration
   * @param {string} state - 'active' or 'inactive'
   */
  addServer(name, serverConfig, state = 'active') {
    if (state === 'active') {
      this.config.mcpServers[name] = serverConfig;
      
      // Remove from inactive if it exists there
      if (this.config.inactive && this.config.inactive[name]) {
        delete this.config.inactive[name];
      }
    } else {
      // Ensure inactive object exists
      if (!this.config.inactive) {
        this.config.inactive = {};
      }
      
      this.config.inactive[name] = serverConfig;
      
      // Remove from active if it exists there
      if (this.config.mcpServers && this.config.mcpServers[name]) {
        delete this.config.mcpServers[name];
      }
    }
  }

  /**
   * Update an existing server
   * @param {string} name - Server name
   * @param {string} originalName - Original server name (if renamed)
   * @param {object} serverConfig - Server configuration
   * @param {boolean} disabled - Whether the server is disabled
   */
  updateServer(name, originalName, serverConfig, disabled = false) {
    // Determine if we're editing an inactive server
    const isEditingInactive = originalName && this.config.inactive && this.config.inactive[originalName];
    
    // Remove the server from its original location if it's being renamed
    if (originalName && originalName !== name) {
      if (isEditingInactive) {
        delete this.config.inactive[originalName];
      } else {
        delete this.config.mcpServers[originalName];
      }
    }
    
    // Determine where to save the server based on the disabled flag
    if (disabled) {
      // Save to inactive section
      if (!this.config.inactive) {
        this.config.inactive = {};
      }
      
      // Remove disabled flag as it's implied by being in the inactive section
      const configCopy = { ...serverConfig };
      delete configCopy.disabled;
      
      // Save to inactive section
      this.config.inactive[name] = configCopy;
      
      // Remove from active section if it exists there
      if (this.config.mcpServers && this.config.mcpServers[name]) {
        delete this.config.mcpServers[name];
      }
    } else {
      // Save to active section
      this.config.mcpServers[name] = serverConfig;
      
      // Remove from inactive section if it exists there
      if (this.config.inactive && this.config.inactive[name]) {
        delete this.config.inactive[name];
      }
    }
  }

  /**
   * Delete a server from the configuration
   * @param {string} name - Server name
   * @param {string} section - 'active' or 'inactive'
   */
  deleteServer(name, section = 'active') {
    if (section === 'active' && this.config.mcpServers[name]) {
      delete this.config.mcpServers[name];
      return true;
    } else if (section === 'inactive' && this.config.inactive[name]) {
      delete this.config.inactive[name];
      return true;
    }
    return false;
  }

  /**
   * Move a server between active and inactive sections
   * @param {string} name - Server name
   * @param {string} targetSection - 'active' or 'inactive'
   */
  moveServer(name, targetSection) {
    if (targetSection === 'active' && this.config.inactive[name]) {
      // Move from inactive to active
      this.config.mcpServers[name] = this.config.inactive[name];
      delete this.config.inactive[name];
      return true;
    } else if (targetSection === 'inactive' && this.config.mcpServers[name]) {
      // Move from active to inactive
      if (!this.config.inactive) {
        this.config.inactive = {};
      }
      this.config.inactive[name] = this.config.mcpServers[name];
      delete this.config.mcpServers[name];
      return true;
    }
    return false;
  }

  /**
   * Get a server configuration by name
   * @param {string} name - Server name
   * @returns {object|null} Server configuration or null if not found
   */
  getServer(name) {
    if (this.config.mcpServers[name]) {
      return { 
        config: this.config.mcpServers[name], 
        section: 'active' 
      };
    } else if (this.config.inactive[name]) {
      return { 
        config: { ...this.config.inactive[name], disabled: true }, 
        section: 'inactive' 
      };
    }
    return null;
  }

  /**
   * Check if the configuration has any servers
   */
  hasServers() {
    return (
      Object.keys(this.config.mcpServers).length > 0 || 
      Object.keys(this.config.inactive || {}).length > 0
    );
  }

  /**
   * Add a change listener
   * @param {Function} listener - Callback function
   */
  addChangeListener(listener) {
    this.changeListeners.push(listener);
  }

  /**
   * Remove a change listener
   * @param {Function} listener - Callback function
   */
  removeChangeListener(listener) {
    this.changeListeners = this.changeListeners.filter(l => l !== listener);
  }

  /**
   * Notify all change listeners
   */
  notifyChangeListeners() {
    this.changeListeners.forEach(listener => listener(this.config));
  }
}

// Create and export a singleton instance
const configManager = new ConfigManager();
export default configManager;
