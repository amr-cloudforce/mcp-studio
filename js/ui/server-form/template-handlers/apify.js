/**
 * Apify Template Handler
 * Handles form generation and submission for the Apify template
 */

/**
 * Generate form for Apify template
 * @param {object} config - Server configuration
 * @returns {string} - Form HTML
 */
export function generateForm(config) {
  // Extract API key from env
  const apiKey = config.env && config.env.APIFY_TOKEN ? config.env.APIFY_TOKEN : '';
  
  // Extract actor ID from args
  const actorId = config.args && config.args.length > 3 ? config.args[3] : 'filip_cicvarek/meetup-scraper';
  
  // Create form HTML
  return `
    <div class="form-group">
      <label for="apify-api-key">Apify API Token</label>
      <input type="password" id="apify-api-key" value="${apiKey}">
      <small>Your Apify API token from apify.com</small>
    </div>
    <div class="form-group">
      <label for="apify-actor-id">Actor ID</label>
      <input type="text" id="apify-actor-id" value="${actorId}">
      <small>Apify actor to use (default: filip_cicvarek/meetup-scraper)</small>
    </div>
    <div class="form-group">
      <label><input type="checkbox" id="quick-disabled" ${config.disabled ? 'checked' : ''}> Disabled</label>
    </div>
  `;
}

/**
 * Handle Apify form submission
 * @param {object} config - Server configuration object to be modified
 * @returns {object} - Updated server configuration
 */
export function handleSubmit(config) {
  // Set command and args
  config.command = 'npx';
  
  // Get API key and actor ID
  const apiKey = document.getElementById('apify-api-key').value.trim();
  const actorId = document.getElementById('apify-actor-id').value.trim() || 'filip_cicvarek/meetup-scraper';
  
  // Set args
  config.args = ['-y', '@modelcontextprotocol/server-apify-web-adapter', '--', actorId];
  
  // Set environment variables
  config.env = {
    APIFY_TOKEN: apiKey
  };
  
  // Set disabled flag
  const disabled = document.getElementById('quick-disabled').checked;
  if (disabled) config.disabled = true;
  
  // Store template ID in metadata
  if (!config.metadata) {
    config.metadata = {
      quickAddTemplate: 'apify-web-adapter',
      templateName: 'Apify Web Adapter'
    };
  }
  
  return config;
}
