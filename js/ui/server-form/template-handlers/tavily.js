/**
 * Server Form - Tavily Template Handler
 * Handles form generation and submission for the Tavily template.
 */

export function generateTavilyForm(quickInputs, config) {
  const apiKey = config.env && config.env.TAVILY_API_KEY ? config.env.TAVILY_API_KEY : '';
  
  const formHtml = `
    <div class="form-group">
      <label for="tavily-api-key">Tavily API Key</label>
      <input type="password" id="tavily-api-key" value="${apiKey}">
      <small>Your Tavily API key</small>
    </div>
    <div class="form-group">
      <label><input type="checkbox" id="quick-disabled" ${config.disabled ? 'checked' : ''}> Disabled</label>
    </div>
  `;
  
  quickInputs.innerHTML = formHtml;
}

// Alias for generateTavilyForm to maintain compatibility with index.js
export function generateForm(config) {
  const dummyElement = document.createElement('div');
  generateTavilyForm(dummyElement, config);
  return dummyElement.innerHTML;
}

export function handleTavilySubmit(config) {
  config.command = 'npx';
  config.args = ['-y', '@modelcontextprotocol/server-tavily'];
  
  const apiKey = document.getElementById('tavily-api-key').value.trim();
  
  config.env = {
    TAVILY_API_KEY: apiKey
  };
  
  const disabled = document.getElementById('quick-disabled').checked;
  if (disabled) config.disabled = true;
  
  if (!config.metadata) {
    config.metadata = {
      quickAddTemplate: 'tavily-mcp',
      templateName: 'Tavily Search'
    };
  }
  
  return config;
}

// Alias for handleTavilySubmit to maintain compatibility with index.js
export function handleSubmit(config) {
  return handleTavilySubmit(config);
}
