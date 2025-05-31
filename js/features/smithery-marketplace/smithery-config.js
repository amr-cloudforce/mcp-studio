/**
 * Smithery Config Generator
 * Generates MCP server configurations for different connection types
 */

import { getCredentials } from './smithery-service.js';

/**
 * Generate HTTP configuration using @smithery/cli
 * @param {Object} server - Server details from API
 * @param {Object} credentials - Credentials object with apiKey and profile
 * @returns {Object} MCP server configuration
 */
export function generateHttpConfig(server, credentials) {
  if (!server?.qualifiedName) {
    throw new Error('generateHttpConfig: server.qualifiedName required');
  }
  
  if (!credentials?.apiKey || !credentials?.profile) {
    throw new Error('generateHttpConfig: credentials not initialized');
  }
  
  return {
    command: 'npx',
    args: [
      '-y',
      '@smithery/cli@latest',
      'run',
      server.qualifiedName,
      '--key',
      credentials.apiKey,
      '--profile',
      credentials.profile
    ]
  };
}

/**
 * Generate stdio configuration by evaluating stdioFunction
 * @param {Object} server - Server details from API
 * @param {Object} userConfig - User-provided configuration parameters
 * @returns {Object} MCP server configuration
 */
export function generateStdioConfig(server, userConfig = {}) {
  if (!server?.connections) {
    throw new Error('generateStdioConfig: server.connections required');
  }
  
  const stdioConnection = server.connections.find(conn => conn.type === 'stdio');
  if (!stdioConnection?.stdioFunction) {
    throw new Error('generateStdioConfig: stdio connection with stdioFunction required');
  }
  
  try {
    // Safely evaluate the stdioFunction with user config
    const func = new Function('config', `return (${stdioConnection.stdioFunction})(config);`);
    const result = func(userConfig);
    
    if (!result?.command) {
      throw new Error('stdioFunction did not return valid command');
    }
    
    return result;
  } catch (error) {
    throw new Error(`Failed to evaluate stdioFunction: ${error.message}`);
  }
}

/**
 * Get default connection type for a server (prefer HTTP)
 * @param {Object} server - Server details from API
 * @returns {string} Connection type ('http' or 'stdio')
 */
export function getDefaultConnectionType(server) {
  if (!server?.connections || !Array.isArray(server.connections)) {
    return 'http'; // Default fallback
  }
  
  const hasHttp = server.connections.some(conn => conn.type === 'http');
  return hasHttp ? 'http' : 'stdio';
}
