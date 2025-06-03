/**
 * Base Formatter
 * Abstract base class for client configuration formatters
 */
class BaseFormatter {
  /**
   * Format servers for the specific client
   * @param {Object} servers - Server configurations
   * @returns {Object} Formatted servers
   */
  static formatServers(servers) {
    throw new Error('formatServers must be implemented by subclass');
  }

  /**
   * Merge MCP servers section into existing client configuration
   * @param {Object|string} existing - Existing client configuration
   * @param {Object} servers - Server configurations to merge
   * @returns {Object|string} Updated configuration
   */
  static mergeMcpServers(existing, servers) {
    throw new Error('mergeMcpServers must be implemented by subclass');
  }

  /**
   * Parse client configuration content
   * @param {string} content - Configuration file content
   * @returns {Object} Parsed configuration
   */
  static parseConfig(content) {
    throw new Error('parseConfig must be implemented by subclass');
  }

  /**
   * Validate configuration content
   * @param {string} content - Configuration content to validate
   * @returns {boolean} True if valid
   */
  static validateConfig(content) {
    throw new Error('validateConfig must be implemented by subclass');
  }

  /**
   * Extract command, args, env and add managed flag for client config
   * Removes metadata like apify, composio, smithery but keeps managed flag
   * @param {Object} serverConfig - Full server configuration
   * @returns {Object} Cleaned server configuration with managed flag
   */
  static cleanServerConfig(serverConfig) {
    const cleaned = {
      command: serverConfig.command,
      args: serverConfig.args || [],
      managed: true  // Add managed flag to identify our servers in client config
    };

    if (serverConfig.env && Object.keys(serverConfig.env).length > 0) {
      cleaned.env = serverConfig.env;
    }

    // Exclude metadata: apify, composio, smithery, but KEEP managed flag
    return cleaned;
  }

  /**
   * Get the file extension for this formatter
   * @returns {string} File extension (e.g., '.json', '.yaml')
   */
  static getFileExtension() {
    throw new Error('getFileExtension must be implemented by subclass');
  }
}

export default BaseFormatter;
