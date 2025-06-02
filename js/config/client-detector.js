/**
 * Client Detector
 * Handles auto-detection of installed MCP clients
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

const DEFAULT_CLIENT_PATHS = {
  claude: {
    name: "Claude Desktop",
    paths: [
      "~/.config/claude-desktop/config.json",           // Linux/macOS
      "%APPDATA%/Claude/config.json"                    // Windows
    ],
    format: "json"
  },
  librechat: {
    name: "LibreChat", 
    paths: [
      "~/src/LibreChat/librechat.yaml",                 // Default dev location
      "~/LibreChat/librechat.yaml",                     // Alternative location
      "/opt/LibreChat/librechat.yaml"                   // System installation
    ],
    format: "yaml"
  }
};

class ClientDetector {
  /**
   * Detect all installed clients
   * @returns {Object} Detected clients with their paths
   */
  static detectClients() {
    const detected = {};
    for (const [clientId, config] of Object.entries(DEFAULT_CLIENT_PATHS)) {
      detected[clientId] = {
        ...config,
        detectedPath: this.findClientPath(config.paths)
      };
    }
    return detected;
  }
  
  /**
   * Find the first existing path from a list of possible paths
   * @param {Array} paths - Array of possible paths
   * @returns {string|null} First existing path or null
   */
  static findClientPath(paths) {
    for (const path of paths) {
      const expandedPath = this.expandPath(path);
      if (fs.existsSync(expandedPath)) {
        return expandedPath;
      }
    }
    return null;
  }
  
  /**
   * Expand path variables like ~ and %APPDATA%
   * @param {string} path - Path with variables
   * @returns {string} Expanded path
   */
  static expandPath(path) {
    if (path.startsWith('~')) {
      return path.replace('~', os.homedir());
    }
    
    if (path.includes('%APPDATA%')) {
      const appData = process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming');
      return path.replace('%APPDATA%', appData);
    }
    
    return path;
  }
  
  /**
   * Get client configuration by ID
   * @param {string} clientId - Client identifier
   * @returns {Object|null} Client configuration or null
   */
  static getClientConfig(clientId) {
    return DEFAULT_CLIENT_PATHS[clientId] || null;
  }
  
  /**
   * Get all supported client IDs
   * @returns {Array} Array of client IDs
   */
  static getSupportedClients() {
    return Object.keys(DEFAULT_CLIENT_PATHS);
  }
}

export default ClientDetector;
