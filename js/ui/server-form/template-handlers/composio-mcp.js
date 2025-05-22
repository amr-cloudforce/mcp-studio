/**
 * Composio MCP Template Handler
 * Handles the creation of MCP servers from Composio connections
 */

/**
 * Get the template definition
 * @returns {Object} Template definition
 */
export function getTemplate() {
  return {
    id: 'composio-mcp',
    name: 'Composio MCP Server',
    description: 'Create an MCP server from a Composio connection',
    icon: '🔌',
    category: 'Integrations',
    inputs: [
      {
        id: 'auth-config-id',
        label: 'Auth Config ID',
        type: 'text',
        placeholder: 'auth_config_123456',
        required: true,
        help: 'The ID of the Composio auth config'
      }
    ],
    advancedInputs: [
      {
        id: 'allowed-tools',
        label: 'Allowed Tools',
        type: 'text',
        placeholder: 'tool1,tool2,tool3',
        required: false,
        help: 'Comma-separated list of allowed tools (leave empty for all tools)'
      }
    ]
  };
}

/**
 * Generate server configuration from inputs
 * @param {Object} inputs - Form inputs
 * @returns {Object} Server configuration
 */
export function generateConfig(inputs) {
  const config = {
    command: 'composio-mcp',
    authConfigId: inputs['auth-config-id']
  };
  
  // Add allowed tools if specified
  if (inputs['allowed-tools']) {
    config.allowedTools = inputs['allowed-tools'].split(',').map(tool => tool.trim());
  }
  
  return config;
}

/**
 * Parse server configuration to inputs
 * @param {Object} config - Server configuration
 * @returns {Object} Form inputs
 */
export function parseConfig(config) {
  const inputs = {
    'auth-config-id': config.authConfigId || ''
  };
  
  // Parse allowed tools if present
  if (config.allowedTools && Array.isArray(config.allowedTools)) {
    inputs['allowed-tools'] = config.allowedTools.join(', ');
  }
  
  return inputs;
}
