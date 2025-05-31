/**
 * Zapier Template Handler
 * Handles form generation and submission for Zapier MCP servers
 */

/**
 * Generate form HTML for Zapier template
 * @param {object} config - Server configuration
 * @returns {string} - HTML string for the form
 */
export function generateForm(config) {
  // Extract URL from config if editing existing server
  const zapierUrl = config.args && config.args.length > 2 ? config.args[2] : '';
  
  return `
    <div class="form-group">
      <label for="zapier-url">Zapier MCP URL</label>
      <input 
        type="text" 
        id="zapier-url" 
        value="${zapierUrl}" 
        placeholder="https://actions.zapier.com/mcp/sk-ak-xxxx/sse"
        required
      >
      <small>Enter your Zapier MCP URL. You can get this from your Zapier account settings.</small>
    </div>
  `;
}

/**
 * Handle form submission for Zapier template
 * @param {object} config - Base server configuration
 * @returns {object} - Updated server configuration
 */
export function handleSubmit(config) {
  const zapierUrl = document.getElementById('zapier-url').value.trim();
  
  // Validate URL
  if (!zapierUrl) {
    alert('Zapier MCP URL is required');
    return null;
  }
  
  // Basic URL validation
  if (!zapierUrl.startsWith('https://')) {
    alert('Zapier MCP URL must start with https://');
    return null;
  }
  
  // Update configuration
  config.command = 'npx';
  config.args = ['-y', 'mcp-remote', zapierUrl];
  config.env = config.env || {};
  
  // Add metadata to identify this as a Quick Add server
  config.metadata = {
    quickAddTemplate: 'zapier-mcp',
    templateName: 'Zapier Actions'
  };
  
  return config;
}
