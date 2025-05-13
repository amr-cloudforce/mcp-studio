/**
 * Tavily Template Handler
 * Handles form generation and submission for the Tavily template
 */

/**
 * Generate form for Tavily template
 * @param {object} config - Server configuration
 * @returns {string} - Form HTML
 */
export function generateForm(config) {
  // Extract API key from env
  const apiKey = config.env && config.env.TAVILY_API_KEY ? config.env.TAVILY_API_KEY : '';
  
  // Get documentation URL from templates
  const templates = window.quickAddTemplates || {};
  const docUrl = templates['tavily-mcp']?.documentationUrl || 'https://docs.tavily.com/documentation/mcp';
  
  // Create form HTML
  return `
    <div class="form-group">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0;">Tavily Search</h3>
        <a href="${docUrl}" target="_blank" class="external-link">Documentation</a>
      </div>
      <label for="tavily-api-key">Tavily API Key</label>
      <input type="password" id="tavily-api-key" value="${apiKey}">
      <small>Your Tavily API key</small>
    </div>
    <div class="form-group">
      <label><input type="checkbox" id="quick-disabled" ${config.disabled ? 'checked' : ''}> Disabled</label>
    </div>
  `;
}

/**
 * Handle Tavily form submission
 * @param {object} config - Server configuration object to be modified
 * @returns {object} - Updated server configuration
 */
export function handleSubmit(config) {
  // Set command and args
  config.command = 'npx';
  config.args = ['-y', '@modelcontextprotocol/server-tavily'];
  
  // Get API key
  const apiKey = document.getElementById('tavily-api-key').value.trim();
  
  // Set environment variables
  config.env = {
    TAVILY_API_KEY: apiKey
  };
  
  // Set disabled flag
  const disabled = document.getElementById('quick-disabled').checked;
  if (disabled) config.disabled = true;
  
  // Store template ID in metadata
  if (!config.metadata) {
    config.metadata = {
      quickAddTemplate: 'tavily-mcp',
      templateName: 'Tavily Search'
    };
  }
  
  return config;
}
