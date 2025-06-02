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
  static parse(content) {
    throw new Error('parse must be implemented by subclass');
  }
  
  /**
   * Validate configuration content
   * @param {string} content - Configuration content to validate
   * @returns {boolean} True if valid
   */
  static validate(content) {
    try {
      this.parse(content);
      return true;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Extract only the command, args, and env from server config
   * @param {Object} serverConfig - Full server configuration
   * @returns {Object} Cleaned server configuration
   */
  static cleanServerConfig(serverConfig) {
    const cleaned = {
      command: serverConfig.command,
      args: serverConfig.args || []
    };
    
    if (serverConfig.env && Object.keys(serverConfig.env).length > 0) {
      cleaned.env = serverConfig.env;
    }
    
    return cleaned;
  }
  
  /**
   * Get the file extension for this formatter
   * @returns {string} File extension (e.g., '.json', '.yaml')
   */
  static getExtension() {
    throw new Error('getExtension must be implemented by subclass');
  }
}

export default BaseFormatter;
