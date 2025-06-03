/**
 * LibreChat Formatter
 * Handles formatting for LibreChat configuration files (YAML)
 */
import BaseFormatter from './base-formatter.js';

class LibreChatFormatter extends BaseFormatter {
  /**
   * Format servers for LibreChat
   * @param {Object} servers - Server configurations
   * @returns {Object} Formatted servers for LibreChat
   */
  static formatServers(servers) {
    const formatted = {};
    
    for (const [name, serverConfig] of Object.entries(servers)) {
      // Use cleanServerConfig to remove ALL metadata including managed, apify, composio, smithery
      formatted[name] = this.cleanServerConfig(serverConfig);
    }
    
    return formatted;
  }

  /**
   * Merge MCP servers section into existing LibreChat configuration
   * @param {Object|string} existing - Existing LibreChat configuration
   * @param {Object} servers - Server configurations to merge
   * @returns {string} Updated LibreChat configuration as YAML string
   */
  static mergeMcpServers(existing, servers) {
    try {
      const yaml = require('js-yaml');
      
      // Parse existing config if it's a string
      let config = existing;
      if (typeof existing === 'string') {
        config = this.parseConfig(existing);
      }

      // Ensure config is an object
      if (!config || typeof config !== 'object') {
        config = {};
      }

      // Ensure mcpServers exists
      if (!config.mcpServers) {
        config.mcpServers = {};
      }

      // Selective merge: preserve external servers, update only managed ones
      const existingServers = config.mcpServers;
      const newMcpServers = {};

      // Step 1: Keep external servers (those without managed: true)
      for (const [name, serverConfig] of Object.entries(existingServers)) {
        if (serverConfig.managed !== true) {
          newMcpServers[name] = serverConfig;
        }
        // Skip servers with managed: true - they will be replaced by our new ones
      }

      // Step 2: Add our managed servers (cleaned of metadata)
      const cleanedServers = this.formatServers(servers);
      for (const [name, serverConfig] of Object.entries(cleanedServers)) {
        newMcpServers[name] = serverConfig;
      }

      config.mcpServers = newMcpServers;

      // Convert back to YAML string
      return this.stringifyConfig(config);
    } catch (error) {
      console.warn('js-yaml not available, falling back to JSON format');
      // Fallback to JSON format if YAML is not available
      let config = existing;
      if (typeof existing === 'string') {
        try {
          config = JSON.parse(existing);
        } catch (e) {
          config = {};
        }
      }
      
      if (!config || typeof config !== 'object') {
        config = {};
      }
      
      // Ensure mcpServers exists
      if (!config.mcpServers) {
        config.mcpServers = {};
      }
      
      // Selective merge for JSON fallback
      const existingServers = config.mcpServers;
      const newMcpServers = {};
      
      // Keep external servers
      for (const [name, serverConfig] of Object.entries(existingServers)) {
        if (serverConfig.managed !== true) {
          newMcpServers[name] = serverConfig;
        }
      }
      
      // Add our managed servers
      const cleanedServers = this.formatServers(servers);
      for (const [name, serverConfig] of Object.entries(cleanedServers)) {
        newMcpServers[name] = serverConfig;
      }
      
      config.mcpServers = newMcpServers;
      return JSON.stringify(config, null, 2);
    }
  }

  /**
   * Parse LibreChat configuration content (YAML)
   * @param {string} content - Configuration file content
   * @returns {Object} Parsed configuration
   */
  static parseConfig(content) {
    try {
      const yaml = require('js-yaml');
      return yaml.load(content) || {};
    } catch (error) {
      // Fallback to JSON parsing if YAML is not available
      try {
        return JSON.parse(content);
      } catch (jsonError) {
        throw new Error(`Invalid YAML/JSON format: ${error.message}`);
      }
    }
  }

  /**
   * Convert configuration object to YAML string
   * @param {Object} config - Configuration object
   * @returns {string} YAML string
   */
  static stringifyConfig(config) {
    try {
      const yaml = require('js-yaml');
      return yaml.dump(config, {
        indent: 2,
        lineWidth: -1,
        noRefs: true,
        sortKeys: false
      });
    } catch (error) {
      // Fallback to JSON if YAML is not available
      return JSON.stringify(config, null, 2);
    }
  }

  /**
   * Get the file extension for LibreChat configuration
   * @returns {string} File extension
   */
  static getFileExtension() {
    return '.yaml';
  }

  /**
   * Validate LibreChat configuration content
   * @param {string} content - Configuration content to validate
   * @returns {boolean} True if valid YAML
   */
  static validateConfig(content) {
    try {
      const yaml = require('js-yaml');
      const parsed = yaml.load(content);
      // Additional validation for LibreChat-specific structure
      return typeof parsed === 'object' && parsed !== null;
    } catch (error) {
      // Fallback to JSON validation
      try {
        const parsed = JSON.parse(content);
        return typeof parsed === 'object' && parsed !== null;
      } catch (jsonError) {
        return false;
      }
    }
  }

  /**
   * Create a default LibreChat configuration
   * @returns {Object} Default configuration
   */
  static createDefaultConfig() {
    return {
      version: "1.0.0",
      cache: true,
      mcpServers: {}
    };
  }

  /**
   * Extract metadata from server configuration for LibreChat
   * @param {Object} serverConfig - Server configuration
   * @returns {Object} Metadata object
   */
  static extractMetadata(serverConfig) {
    const metadata = {};
    
    // Extract known metadata fields
    const metadataFields = ['composio', 'apify', 'smithery', 'source', 'description'];
    
    for (const field of metadataFields) {
      if (serverConfig[field]) {
        metadata[field] = serverConfig[field];
      }
    }
    
    return metadata;
  }
}

export default LibreChatFormatter;
