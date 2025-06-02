/**
 * LibreChat Formatter
 * Handles formatting for LibreChat configuration files (YAML)
 */

import BaseFormatter from './base-formatter.js';
const yaml = require('js-yaml');

class LibreChatFormatter extends BaseFormatter {
  /**
   * Format servers for LibreChat
   * @param {Object} servers - Server configurations
   * @returns {Object} Formatted servers for LibreChat
   */
  static formatServers(servers) {
    const formatted = {};
    
    for (const [name, config] of Object.entries(servers)) {
      // Start with basic server config
      formatted[name] = this.cleanServerConfig(config);
      
      // Add metadata if available (for Composio, Apify, etc.)
      if (config.metadata) {
        // Merge metadata into the server config
        Object.assign(formatted[name], config.metadata);
      }
      
      // Handle specific metadata types
      if (config.composio) {
        formatted[name].composio = config.composio;
      }
      
      if (config.apify) {
        formatted[name].apify = config.apify;
      }
      
      if (config.smithery) {
        formatted[name].smithery = config.smithery;
      }
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
    // Parse existing config if it's a string
    let config = existing;
    if (typeof existing === 'string') {
      config = this.parse(existing);
    }
    
    // Ensure config is an object
    if (!config || typeof config !== 'object') {
      config = {};
    }
    
    // Replace the mcpServers section entirely
    config.mcpServers = this.formatServers(servers);
    
    // Convert back to YAML string
    return yaml.dump(config, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });
  }
  
  /**
   * Parse LibreChat configuration content (YAML)
   * @param {string} content - Configuration file content
   * @returns {Object} Parsed configuration
   */
  static parse(content) {
    if (!content || content.trim() === '') {
      return {};
    }
    
    try {
      return yaml.load(content) || {};
    } catch (error) {
      throw new Error(`Invalid YAML format: ${error.message}`);
    }
  }
  
  /**
   * Convert configuration object to YAML string
   * @param {Object} config - Configuration object
   * @returns {string} YAML string
   */
  static stringify(config) {
    return yaml.dump(config, {
      indent: 2,
      lineWidth: -1,
      noRefs: true,
      sortKeys: false
    });
  }
  
  /**
   * Get the file extension for LibreChat configuration
   * @returns {string} File extension
   */
  static getExtension() {
    return '.yaml';
  }
  
  /**
   * Validate LibreChat configuration content
   * @param {string} content - Configuration content to validate
   * @returns {boolean} True if valid YAML
   */
  static validate(content) {
    try {
      const parsed = this.parse(content);
      
      // Additional validation for LibreChat-specific structure
      if (parsed.mcpServers && typeof parsed.mcpServers !== 'object') {
        return false;
      }
      
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Create a default LibreChat configuration
   * @returns {Object} Default configuration
   */
  static createDefault() {
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
    const metadataFields = [
      'composio', 'apify', 'smithery', 'source', 'appKey', 
      'mcpServerId', 'actorId', 'qualifiedName'
    ];
    
    metadataFields.forEach(field => {
      if (serverConfig[field]) {
        metadata[field] = serverConfig[field];
      }
    });
    
    return metadata;
  }
}

export default LibreChatFormatter;
