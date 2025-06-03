/**
 * Client Sync Manager
 * Handles synchronization of MCP server configurations to client applications
 */
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

import ClientDetector from './client-detector.js';
import BackupManager from './backup-manager.js';
import ClaudeFormatter from './formatters/claude-formatter.js';
import LibreChatFormatter from './formatters/librechat-formatter.js';

class ClientSync {
  static CLIENT_CONFIG_PATH = path.join(os.homedir(), '.config', 'mcp-studio', 'client-paths.json');

  /**
   * Load client configuration from file
   * @returns {Object} Client configuration
   */
  static loadClientConfig() {
    try {
      if (fs.existsSync(this.CLIENT_CONFIG_PATH)) {
        const content = fs.readFileSync(this.CLIENT_CONFIG_PATH, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn('Failed to load client configuration:', error.message);
    }
    
    // Return default configuration
    return this.createDefaultClientConfig();
  }

  /**
   * Save client configuration to file
   */
  static saveClientConfig(config) {
    try {
      // Ensure directory exists
      const configDir = path.dirname(this.CLIENT_CONFIG_PATH);
      fs.mkdirSync(configDir, { recursive: true });
      
      fs.writeFileSync(this.CLIENT_CONFIG_PATH, JSON.stringify(config, null, 2));
    } catch (error) {
      console.error('Failed to save client configuration:', error.message);
    }
  }

  /**
   * Create default client configuration
   * @returns {Object} Default client configuration
   */
  static createDefaultClientConfig() {
    const detected = ClientDetector.detectClients();
    const config = {};

    for (const [clientId, detectedInfo] of Object.entries(detected)) {
      config[clientId] = {
        enabled: clientId === 'claude', // Enable Claude by default for backward compatibility
        autoSync: clientId === 'claude', // Enable auto-sync for Claude by default
        customPath: null,
        detectedPath: detectedInfo.detectedPath,
        lastSync: null
      };
    }

    return config;
  }

  /**
   * Refresh client detection and update configuration
   */
  static refreshDetection() {
    const config = this.loadClientConfig();
    const detected = ClientDetector.detectClients();

    for (const [clientId, detectedInfo] of Object.entries(detected)) {
      if (config[clientId]) {
        // Update detected path
        config[clientId].detectedPath = detectedInfo.detectedPath;
      } else {
        // Add new client
        config[clientId] = {
          enabled: false,
          autoSync: false,
          customPath: null,
          detectedPath: detectedInfo.detectedPath,
          lastSync: null
        };
      }
    }

    this.saveClientConfig(config);
    return config;
  }

  /**
   * Get formatter for a specific client
   * @param {string} clientId - Client identifier
   * @returns {Object} Formatter class
   */
  static getFormatter(clientId) {
    switch (clientId) {
      case 'claude':
        return ClaudeFormatter;
      case 'librechat':
        return LibreChatFormatter;
      default:
        throw new Error(`No formatter available for client: ${clientId}`);
    }
  }

  /**
   * Get the configuration path for a client
   * @param {string} clientId - Client identifier
   * @returns {string|null} Configuration file path
   */
  static getClientPath(clientId) {
    const config = this.loadClientConfig();
    const clientConfig = config[clientId];
    
    if (!clientConfig) {
      return null;
    }

    return clientConfig.customPath || clientConfig.detectedPath;
  }

  /**
   * Read client configuration file
   * @param {string} clientPath - Path to client configuration file
   * @returns {string} Configuration file content
   */
  static readClientConfig(clientPath) {
    try {
      return fs.readFileSync(clientPath, 'utf8');
    } catch (error) {
      console.warn(`Failed to read client config at ${clientPath}:`, error.message);
      return '';
    }
  }

  /**
   * Write client configuration file
   * @param {string} clientPath - Path to client configuration file
   * @param {string} content - Configuration content
   */
  static writeClientConfig(clientPath, content) {
    try {
      // Ensure directory exists
      const configDir = path.dirname(clientPath);
      fs.mkdirSync(configDir, { recursive: true });
      
      fs.writeFileSync(clientPath, content);
    } catch (error) {
      throw new Error(`Failed to write client config to ${clientPath}: ${error.message}`);
    }
  }

  /**
   * Sync MCP servers to a specific client
   * @param {string} clientId - Client identifier
   * @param {Object} servers - Server configurations
   * @returns {boolean} True if sync was successful
   */
  static syncToClient(clientId, servers) {
    try {
      const config = this.loadClientConfig();
      const clientConfig = config[clientId];
      
      if (!clientConfig || !clientConfig.enabled) {
        return false;
      }

      const formatter = this.getFormatter(clientId);
      const clientPath = this.getClientPath(clientId);
      
      if (!clientPath) {
        throw new Error(`No configuration path found for ${clientId}`);
      }

      // Create backup before making changes
      try {
        const backupPath = BackupManager.createBackup(clientId, clientPath);
        console.log(`Created backup: ${backupPath}`);
      } catch (error) {
        console.warn(`Failed to create backup for ${clientId}:`, error.message);
        // Continue with sync even if backup fails
      }

      // Read existing config
      const existingContent = this.readClientConfig(clientPath);
      let existing = {};
      
      if (existingContent) {
        try {
          existing = formatter.parseConfig(existingContent);
        } catch (error) {
          console.warn(`Failed to parse existing config for ${clientId}, using default:`, error.message);
          existing = formatter.createDefaultConfig ? formatter.createDefaultConfig() : {};
        }
      } else {
        existing = formatter.createDefaultConfig ? formatter.createDefaultConfig() : {};
      }

      // Merge only mcpServers section
      const updated = formatter.mergeMcpServers(existing, servers);
      
      // Convert to string if needed (for YAML clients like LibreChat)
      const updatedContent = typeof updated === 'string' ? updated : formatter.stringifyConfig(updated);
      
      // Validate the updated content
      if (!formatter.validateConfig(updatedContent)) {
        throw new Error(`Generated invalid configuration for ${clientId}`);
      }

      // Write back
      this.writeClientConfig(clientPath, updatedContent);
      
      // Update last sync timestamp
      this.updateLastSyncTime(clientId);
      
      return true;
    } catch (error) {
      console.error(`Failed to sync to ${clientId}:`, error.message);
      return false;
    }
  }

  /**
   * Sync MCP servers to all enabled clients
   * @param {Object} servers - Server configurations
   * @returns {Object} Sync results for each client
   */
  static syncAll(servers) {
    const config = this.loadClientConfig();
    const results = {};

    for (const [clientId, clientConfig] of Object.entries(config)) {
      if (clientConfig.enabled && clientConfig.autoSync) {
        try {
          results[clientId] = this.syncToClient(clientId, servers);
        } catch (error) {
          console.error(`Failed to sync to ${clientId}:`, error.message);
          results[clientId] = false;
        }
      } else {
        results[clientId] = null; // Not enabled or auto-sync disabled
      }
    }

    return results;
  }

  /**
   * Update last sync timestamp for a client
   * @param {string} clientId - Client identifier
   */
  static updateLastSyncTime(clientId) {
    const config = this.loadClientConfig();
    if (config[clientId]) {
      config[clientId].lastSync = new Date().toISOString();
      this.saveClientConfig(config);
    }
  }

  /**
   * Enable or disable a client
   * @param {string} clientId - Client identifier
   * @param {boolean} enabled - Whether to enable the client
   */
  static setClientEnabled(clientId, enabled) {
    const config = this.loadClientConfig();
    if (config[clientId]) {
      config[clientId].enabled = enabled;
      this.saveClientConfig(config);
    }
  }

  /**
   * Enable or disable auto-sync for a client
   * @param {string} clientId - Client identifier
   * @param {boolean} autoSync - Whether to enable auto-sync
   */
  static setClientAutoSync(clientId, autoSync) {
    const config = this.loadClientConfig();
    if (config[clientId]) {
      config[clientId].autoSync = autoSync;
      this.saveClientConfig(config);
    }
  }

  /**
   * Set custom path for a client
   * @param {string} clientId - Client identifier
   * @param {string} customPath - Custom configuration file path
   */
  static setClientCustomPath(clientId, customPath) {
    const config = this.loadClientConfig();
    if (config[clientId]) {
      config[clientId].customPath = customPath;
      this.saveClientConfig(config);
    }
  }

  /**
   * Set restart command for a client
   * @param {string} clientId - Client identifier
   * @param {string} restartCommand - Restart command
   */
  static setClientRestartCommand(clientId, restartCommand) {
    const config = this.loadClientConfig();
    if (config[clientId]) {
      config[clientId].restartCommand = restartCommand;
      this.saveClientConfig(config);
    }
  }

  /**
   * Get restart command for a client
   * @param {string} clientId - Client identifier
   * @returns {string|null} Restart command
   */
  static getClientRestartCommand(clientId) {
    const config = this.loadClientConfig();
    return config[clientId]?.restartCommand || null;
  }

  /**
   * Get enabled clients
   * @returns {Array} Array of enabled client IDs
   */
  static getEnabledClients() {
    const config = this.loadClientConfig();
    return Object.keys(config).filter(clientId => config[clientId].enabled);
  }

  /**
   * Get clients with auto-sync enabled
   * @returns {Array} Array of auto-sync enabled client IDs
   */
  static getAutoSyncClients() {
    const config = this.loadClientConfig();
    return Object.keys(config).filter(clientId => 
      config[clientId].enabled && config[clientId].autoSync
    );
  }

  /**
   * Check if auto-sync is enabled for any client
   * @returns {boolean} True if any client has auto-sync enabled
   */
  static isAutoSyncEnabled() {
    return this.getAutoSyncClients().length > 0;
  }

  /**
   * Get client configuration
   * @param {string} clientId - Client identifier
   * @returns {Object|null} Client configuration
   */
  static getClientConfig(clientId) {
    const config = this.loadClientConfig();
    return config[clientId] || null;
  }

  /**
   * Get all client configurations
   * @returns {Object} All client configurations
   */
  static getAllClientConfigs() {
    return this.loadClientConfig();
  }

  /**
   * Test if a client path is valid
   * @param {string} clientId - Client identifier
   * @param {string} testPath - Path to test
   * @returns {Object} Test result with success and message
   */
  static testClientPath(clientId, testPath) {
    try {
      if (!fs.existsSync(testPath)) {
        return {
          success: false,
          message: 'File does not exist'
        };
      }

      const formatter = this.getFormatter(clientId);
      const content = fs.readFileSync(testPath, 'utf8');
      
      if (!formatter.validateConfig(content)) {
        return {
          success: false,
          message: 'Invalid configuration format'
        };
      }

      return {
        success: true,
        message: 'Valid configuration file'
      };
    } catch (error) {
      return {
        success: false,
        message: error.message
      };
    }
  }
}

export default ClientSync;
