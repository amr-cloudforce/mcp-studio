/**
 * Claude Formatter
 * Handles formatting for Claude Desktop configuration files (JSON)
 */
import BaseFormatter from './base-formatter.js';

class ClaudeFormatter extends BaseFormatter {
  /**
   * Format servers for Claude Desktop
   * @param {Object} servers - Server configurations
   * @returns {Object} Formatted servers for Claude
   */
  static formatServers(servers) {
    const formatted = {};
    
    for (const [name, serverConfig] of Object.entries(servers)) {
      formatted[name] = this.cleanServerConfig(serverConfig);
    }
    
    return formatted;
  }

  /**
   * Merge MCP servers section into existing Claude configuration
   * @param {Object|string} existing - Existing Claude configuration
   * @param {Object} servers - Server configurations to merge
   * @returns {Object} Updated Claude configuration
   */
  static mergeMcpServers(existing, servers) {
    // Parse existing config if it's a string
    let config = existing;
    if (typeof existing === 'string') {
      config = this.parseConfig(existing);
    }

    // Ensure config is an object
    if (!config || typeof config !== 'object') {
      config = {};
    }

    // Replace the mcpServers section entirely
    config.mcpServers = this.formatServers(servers);

    return config;
  }

  /**
   * Parse Claude configuration content (JSON)
   * @param {string} content - Configuration file content
   * @returns {Object} Parsed configuration
   */
  static parseConfig(content) {
    try {
      return JSON.parse(content);
    } catch (error) {
      throw new Error(`Invalid JSON format: ${error.message}`);
    }
  }

  /**
   * Convert configuration object to JSON string
   * @param {Object} config - Configuration object
   * @returns {string} JSON string
   */
  static stringifyConfig(config) {
    return JSON.stringify(config, null, 2);
  }

  /**
   * Get the file extension for Claude configuration
   * @returns {string} File extension
   */
  static getFileExtension() {
    return '.json';
  }

  /**
   * Validate Claude configuration content
   * @param {string} content - Configuration content to validate
   * @returns {boolean} True if valid JSON
   */
  static validateConfig(content) {
    try {
      const parsed = JSON.parse(content);
      // Additional validation for Claude-specific structure
      return typeof parsed === 'object' && parsed !== null;
    } catch (error) {
      return false;
    }
  }

  /**
   * Create a default Claude configuration
   * @returns {Object} Default configuration
   */
  static createDefaultConfig() {
    return {
      mcpServers: {}
    };
  }
}

export default ClaudeFormatter;
