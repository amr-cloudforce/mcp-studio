/**
 * Client Sync Manager
 * Handles synchronization of MCP server configurations to client applications
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
import ClientDetector from './client-detector.js';
import BackupManager from './backup-manager.js';
import ClaudeFormatter from './formatters/claude-formatter.js';
import LibreChatFormatter from './formatters/librechat-formatter.js';

class ClientSync {
  constructor() {
    this.formatters = new Map([
      ['claude', ClaudeFormatter],
      ['librechat', LibreChatFormatter]
    ]);
    
    this.clientConfig = this.loadClientConfig();
  }
  
  /**
   * Load client configuration from file
   * @returns {Object} Client configuration
   */
  loadClientConfig() {
    const configPath = path.join(os.homedir(), '.config', 'mcp-studio', 'client-paths.json');
    
    try {
      if (fs.existsSync(configPath)) {
        const content = fs.readFileSync(configPath, 'utf8');
        return JSON.parse(content);
      }
    } catch (error) {
      console.warn(`[CLIENT-SYNC] Failed to load client config: ${error.message}`);
    }
    
    // Return default configuration
    return this.createDefaultClientConfig();
  }
  
  /**
   * Save client configuration to file
   */
  saveClientConfig() {
    const configPath = path.join(os.homedir(), '.config', 'mcp-studio', 'client-paths.json');
    
    try {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(configPath), { recursive: true });
      
      fs.writeFileSync(configPath, JSON.stringify(this.clientConfig, null, 2));
      console.log(`[CLIENT-SYNC] Saved client configuration to ${configPath}`);
    } catch (error) {
      console.error(`[CLIENT-SYNC] Failed to save client config: ${error.message}`);
    }
  }
  
  /**
   * Create default client configuration
   * @returns {Object} Default client configuration
   */
  createDefaultClientConfig() {
    const detected = ClientDetector.detectClients();
    const config = {};
    
    for (const [clientId, clientInfo] of Object.entries(detected)) {
      config[clientId] = {
        enabled: clientId === 'claude', // Enable Claude by default
        autoSync: clientId === 'claude',
        customPath: null,
        detectedPath: clientInfo.detectedPath,
        lastSync: null
      };
    }
    
    return config;
  }
  
  /**
   * Refresh client detection and update configuration
   */
  refreshDetection() {
    const detected = ClientDetector.detectClients();
    
    for (const [clientId, clientInfo] of Object.entries(detected)) {
      if (!this.clientConfig[clientId]) {
        this.clientConfig[clientId] = {
          enabled: false,
          autoSync: false,
          customPath: null,
          detectedPath: clientInfo.detectedPath,
          lastSync: null
        };
      } else {
        // Update detected path
        this.clientConfig[clientId].detectedPath = clientInfo.detectedPath;
      }
    }
    
    this.saveClientConfig();
  }
  
  /**
   * Get formatter for a specific client
   * @param {string} clientId - Client identifier
   * @returns {Object} Formatter class
   */
  getFormatter(clientId) {
    const formatter = this.formatters.get(clientId);
    if (!formatter) {
      throw new Error(`No formatter found for client: ${clientId}`);
    }
    return formatter;
  }
  
  /**
   * Get the configuration path for a client
   * @param {string} clientId - Client identifier
   * @returns {string|null} Configuration file path
   */
  getClientPath(clientId) {
    const config = this.clientConfig[clientId];
    if (!config) return null;
    
    return config.customPath || config.detectedPath;
  }
  
  /**
   * Read client configuration file
   * @param {string} clientPath - Path to client configuration file
   * @returns {string} Configuration file content
   */
  readClientConfig(clientPath) {
    if (!fs.existsSync(clientPath)) {
      return '';
    }
    
    try {
      return fs.readFileSync(clientPath, 'utf8');
    } catch (error) {
      console.error(`[CLIENT-SYNC] Failed to read client config: ${error.message}`);
      return '';
    }
  }
  
  /**
   * Write client configuration file
   * @param {string} clientPath - Path to client configuration file
   * @param {string} content - Configuration content
   */
  writeClientConfig(clientPath, content) {
    try {
      // Ensure directory exists
      fs.mkdirSync(path.dirname(clientPath), { recursive: true });
      
      fs.writeFileSync(clientPath, content);
      console.log(`[CLIENT-SYNC] Updated client config: ${clientPath}`);
    } catch (error) {
      console.error(`[CLIENT-SYNC] Failed to write client config: ${error.message}`);
      throw error;
    }
  }
  
  /**
   * Sync MCP servers to a specific client
   * @param {string} clientId - Client identifier
   * @param {Object} servers - Server configurations
   * @returns {boolean} True if sync was successful
   */
  syncToClient(clientId, servers) {
    const clientConfig = this.clientConfig[clientId];
    if (!clientConfig || !clientConfig.enabled) {
      console.log(`[CLIENT-SYNC] Client ${clientId} is disabled, skipping sync`);
      return false;
    }
    
    const clientPath = this.getClientPath(clientId);
    if (!clientPath) {
      console.warn(`[CLIENT-SYNC] No path configured for client ${clientId}`);
      return false;
    }
    
    try {
      const formatter = this.getFormatter(clientId);
      
      // Create backup before making changes
      try {
        if (fs.existsSync(clientPath)) {
          const backupPath = BackupManager.createBackup(clientId, clientPath);
          console.log(`[CLIENT-SYNC] Created backup: ${backupPath}`);
        }
      } catch (backupError) {
        console.warn(`[CLIENT-SYNC] Failed to create backup for ${clientId}: ${backupError.message}`);
        // Continue with sync even if backup fails
      }
      
      // Read existing config
      const existingContent = this.readClientConfig(clientPath);
      
      // Merge only mcpServers section
      let updatedContent;
      if (formatter.mergeMcpServers) {
        if (clientId === 'claude') {
          const updated = formatter.mergeMcpServers(existingContent, servers);
          updatedContent = formatter.stringify(updated);
        } else {
          // For YAML clients like LibreChat, mergeMcpServers returns a string
          updatedContent = formatter.mergeMcpServers(existingContent, servers);
        }
      } else {
        throw new Error(`Formatter for ${clientId} does not support mergeMcpServers`);
      }
      
      // Validate the updated content
      if (!formatter.validate(updatedContent)) {
        throw new Error(`Generated configuration is invalid for ${clientId}`);
      }
      
      // Write back
      this.writeClientConfig(clientPath, updatedContent);
      
      // Update last sync timestamp
      this.updateLastSyncTime(clientId);
      
      console.log(`[CLIENT-SYNC] Successfully synced to ${clientId}`);
      return true;
      
    } catch (error) {
      console.error(`[CLIENT-SYNC] Failed to sync to ${clientId}: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Sync MCP servers to all enabled clients
   * @param {Object} servers - Server configurations
   * @returns {Object} Sync results for each client
   */
  syncAll(servers) {
    const results = {};
    
    for (const clientId of Object.keys(this.clientConfig)) {
      results[clientId] = this.syncToClient(clientId, servers);
    }
    
    return results;
  }
  
  /**
   * Update last sync timestamp for a client
   * @param {string} clientId - Client identifier
   */
  updateLastSyncTime(clientId) {
    if (this.clientConfig[clientId]) {
      this.clientConfig[clientId].lastSync = new Date().toISOString();
      this.saveClientConfig();
    }
  }
  
  /**
   * Enable or disable a client
   * @param {string} clientId - Client identifier
   * @param {boolean} enabled - Whether to enable the client
   */
  setClientEnabled(clientId, enabled) {
    if (this.clientConfig[clientId]) {
      this.clientConfig[clientId].enabled = enabled;
      this.saveClientConfig();
    }
  }
  
  /**
   * Enable or disable auto-sync for a client
   * @param {string} clientId - Client identifier
   * @param {boolean} autoSync - Whether to enable auto-sync
   */
  setClientAutoSync(clientId, autoSync) {
    if (this.clientConfig[clientId]) {
      this.clientConfig[clientId].autoSync = autoSync;
      this.saveClientConfig();
    }
  }
  
  /**
   * Set custom path for a client
   * @param {string} clientId - Client identifier
   * @param {string} customPath - Custom configuration file path
   */
  setClientCustomPath(clientId, customPath) {
    if (this.clientConfig[clientId]) {
      this.clientConfig[clientId].customPath = customPath;
      this.saveClientConfig();
    }
  }
  
  /**
   * Get enabled clients
   * @returns {Array} Array of enabled client IDs
   */
  getEnabledClients() {
    return Object.keys(this.clientConfig).filter(
      clientId => this.clientConfig[clientId].enabled
    );
  }
  
  /**
   * Get clients with auto-sync enabled
   * @returns {Array} Array of auto-sync enabled client IDs
   */
  getAutoSyncClients() {
    return Object.keys(this.clientConfig).filter(
      clientId => this.clientConfig[clientId].enabled && this.clientConfig[clientId].autoSync
    );
  }
  
  /**
   * Check if auto-sync is enabled for any client
   * @returns {boolean} True if any client has auto-sync enabled
   */
  isAutoSyncEnabled() {
    return this.getAutoSyncClients().length > 0;
  }
  
  /**
   * Get client configuration
   * @param {string} clientId - Client identifier
   * @returns {Object|null} Client configuration
   */
  getClientConfig(clientId) {
    return this.clientConfig[clientId] || null;
  }
  
  /**
   * Get all client configurations
   * @returns {Object} All client configurations
   */
  getAllClientConfigs() {
    return { ...this.clientConfig };
  }
  
  /**
   * Test if a client path is valid
   * @param {string} clientId - Client identifier
   * @param {string} testPath - Path to test
   * @returns {Object} Test result with success and message
   */
  testClientPath(clientId, testPath) {
    try {
      const formatter = this.getFormatter(clientId);
      
      if (!fs.existsSync(testPath)) {
        return {
          success: false,
          message: 'File does not exist'
        };
      }
      
      const content = fs.readFileSync(testPath, 'utf8');
      const isValid = formatter.validate(content);
      
      if (!isValid) {
        return {
          success: false,
          message: `Invalid ${formatter.getExtension().substring(1).toUpperCase()} format`
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

// Create and export a singleton instance
const clientSync = new ClientSync();
export default clientSync;
