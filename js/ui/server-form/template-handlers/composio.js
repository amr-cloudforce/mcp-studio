/**
 * Composio Template Handler
 * Handles form generation and submission for the Composio template
 */

// Store the list of apps for use in the form
let cachedApps = [];

/**
 * Generate form for Composio template
 * @param {object} config - Server configuration
 * @returns {string} - Form HTML
 */
export function generateForm(config) {
  // Extract API key from env
  const apiKey = config.env && config.env.COMPOSIO_API_KEY ? config.env.COMPOSIO_API_KEY : '';
  
  // Extract app name from config if available
  const appName = config.metadata && config.metadata.composioApp ? config.metadata.composioApp : '';
  
  // Get documentation URL from templates
  const templates = window.quickAddTemplates || {};
  const docUrl = templates['composio-mcp']?.documentationUrl || 'https://docs.composio.dev';
  
  // Create form HTML
  const formHtml = `
    <div class="form-group">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0;">Composio Integration</h3>
        <a href="${docUrl}" target="_blank" class="external-link">Documentation</a>
      </div>
      <div id="composio-step-1" ${appName ? 'style="display: none;"' : ''}>
        <label for="composio-api-key">Composio API Key</label>
        <input type="password" id="composio-api-key" value="${apiKey}">
        <small>Your Composio API key (starts with sk_live_)</small>
        <div style="margin-top: 15px;">
          <button type="button" id="composio-fetch-apps" class="btn btn-primary" style="width: 100%; padding: 10px; font-size: 16px; font-weight: bold; background-color: #4A56E2; color: white; border: none; border-radius: 4px; cursor: pointer;">
            FETCH AVAILABLE APPS
          </button>
          <div id="composio-loading" style="display: none; margin-top: 10px; text-align: center; font-weight: bold; color: #4A56E2;">
            <span>Loading apps...</span>
          </div>
          <div id="composio-error" style="display: none; margin-top: 10px; color: red; text-align: center; font-weight: bold;"></div>
        </div>
      </div>
      
      <div id="composio-step-2" ${!appName ? 'style="display: none;"' : ''}>
        <div style="margin-bottom: 15px;">
          <label for="composio-app-select">Select App</label>
          <select id="composio-app-select" style="width: 100%; padding: 10px; margin-top: 5px; border: 2px solid #4A56E2; border-radius: 4px; font-size: 14px;">
            ${appName ? `<option value="${appName}" selected>${appName}</option>` : ''}
          </select>
          <small>Choose the Composio app to connect to</small>
        </div>
        <div style="margin-top: 10px;">
          <button type="button" id="composio-back-btn" class="btn" style="padding: 8px 15px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Back to API Key</button>
        </div>
      </div>
    </div>
    <div class="form-group">
      <label><input type="checkbox" id="quick-disabled" ${config.disabled ? 'checked' : ''}> Disabled</label>
    </div>
  `;
  
  // Set up event handlers after a short delay to ensure DOM is ready
  setTimeout(() => {
    setupEventHandlers(apiKey, appName);
  }, 100);
  
  return formHtml;
}

/**
 * Set up event handlers for the Composio form
 * @param {string} initialApiKey - Initial API key value
 * @param {string} initialAppName - Initial app name value
 */
function setupEventHandlers(initialApiKey, initialAppName) {
  const fetchButton = document.getElementById('composio-fetch-apps');
  const backButton = document.getElementById('composio-back-btn');
  const apiKeyInput = document.getElementById('composio-api-key');
  const appSelect = document.getElementById('composio-app-select');
  const step1 = document.getElementById('composio-step-1');
  const step2 = document.getElementById('composio-step-2');
  const loadingIndicator = document.getElementById('composio-loading');
  const errorDisplay = document.getElementById('composio-error');
  
  if (!fetchButton || !backButton || !apiKeyInput || !appSelect || !step1 || !step2) {
    console.error('Composio form elements not found');
    return;
  }
  
  // Fetch apps button click handler
  fetchButton.addEventListener('click', async () => {
    const apiKey = apiKeyInput.value.trim();
    
    if (!apiKey) {
      errorDisplay.textContent = 'API Key is required';
      errorDisplay.style.display = 'block';
      return;
    }
    
    // Show loading indicator
    loadingIndicator.style.display = 'block';
    errorDisplay.style.display = 'none';
    
    try {
      // Use the composio-service.js directly with require
      const composioService = require('./composio-service.js');
      
      // Initialize SDK with the API key
      composioService.initializeSDK(apiKey);
      
      // Verify API key
      await composioService.verifyApiKey();
      
      // Fetch available apps
      const apps = await composioService.listApps();
      cachedApps = apps;
      
      // Populate the select dropdown
      appSelect.innerHTML = '';
      apps.forEach(app => {
        const option = document.createElement('option');
        option.value = app.uniqueKey || app.name;
        option.textContent = app.displayName || app.name;
        appSelect.appendChild(option);
      });
      
      // Show step 2
      step1.style.display = 'none';
      step2.style.display = 'block';
    } catch (error) {
      console.error('Error fetching Composio apps:', error);
      errorDisplay.textContent = `Error: ${error.message || 'Failed to fetch apps'}`;
      errorDisplay.style.display = 'block';
    } finally {
      loadingIndicator.style.display = 'none';
    }
  });
  
  // Back button click handler
  backButton.addEventListener('click', () => {
    step2.style.display = 'none';
    step1.style.display = 'block';
  });
  
  // If we already have an app name, try to fetch the apps list
  if (initialAppName && initialApiKey) {
    // This will populate the dropdown if the user is editing an existing configuration
    fetchButton.click();
  }
}

/**
 * Handle Composio form submission
 * @param {object} config - Server configuration object to be modified
 * @returns {object} - Updated server configuration
 */
export function handleSubmit(config) {
  // Set command and args
  config.command = 'node';
  
  // Get API key and app name
  const apiKey = document.getElementById('composio-api-key').value.trim();
  const appSelect = document.getElementById('composio-app-select');
  const appName = appSelect ? appSelect.value : '';
  
  // Validate inputs
  if (!apiKey) {
    alert('Composio API Key is required');
    return null;
  }
  
  if (!appName) {
    alert('Please select a Composio app');
    return null;
  }
  
  // Set args - create a script that uses composio-service.js
  config.args = [
    '-e',
    `
    const composio = require('./composio-service.js');
    
    (async () => {
      try {
        // Initialize SDK
        composio.initializeSDK(process.env.COMPOSIO_API_KEY);
        console.log('Composio SDK initialized');
        
        // Verify API key
        await composio.verifyApiKey();
        console.log('API key verified');
        
        // Initiate connection
        const { connectedAccountId, redirectUrl, connectionStatus } = 
          await composio.initiateConnection('${appName}');
        
        if (redirectUrl) {
          console.log('Please open this URL in your browser to complete the OAuth flow:');
          console.log(redirectUrl);
          
          // Poll for connection status
          console.log('Waiting for OAuth flow to complete...');
          let status = connectionStatus;
          let connection = null;
          
          while (status !== 'ACTIVE') {
            // Wait 5 seconds between polls
            await new Promise(resolve => setTimeout(resolve, 5000));
            
            // Get updated connection status
            connection = await composio.getConnection(connectedAccountId);
            status = connection.status;
            
            console.log('Connection status:', status);
            
            if (status === 'PENDING_PARAMS') {
              console.log('Additional parameters required. Please update the connection data manually.');
              break;
            }
            
            if (status === 'ERROR') {
              console.error('Connection error:', connection.error || 'Unknown error');
              break;
            }
          }
          
          if (status === 'ACTIVE') {
            // Create MCP server
            const v3Connections = await composio.getConnectedAccounts();
            const connection = v3Connections.find(c => c.id === connectedAccountId);
            
            if (connection) {
              const mcp = await composio.createMcpServer('${appName}-mcp', connection);
              console.log('MCP server created successfully!');
              console.log('MCP URL:', mcp.mcp_url || mcp.url);
            } else {
              console.error('Connection not found in V3 API');
            }
          }
        } else if (connectionStatus === 'ACTIVE') {
          console.log('Connection is already active');
          
          // Create MCP server
          const v3Connections = await composio.getConnectedAccounts();
          const connection = v3Connections.find(c => c.id === connectedAccountId);
          
          if (connection) {
            const mcp = await composio.createMcpServer('${appName}-mcp', connection);
            console.log('MCP server created successfully!');
            console.log('MCP URL:', mcp.mcp_url || mcp.url);
          } else {
            console.error('Connection not found in V3 API');
          }
        }
      } catch (error) {
        console.error('Error:', error.message);
      }
    })();
    `
  ];
  
  // Set environment variables
  config.env = {
    COMPOSIO_API_KEY: apiKey
  };
  
  // Set disabled flag
  const disabled = document.getElementById('quick-disabled').checked;
  if (disabled) config.disabled = true;
  
  // Store template ID and app name in metadata
  if (!config.metadata) {
    config.metadata = {
      quickAddTemplate: 'composio-mcp',
      templateName: 'Composio Integration',
      composioApp: appName
    };
  } else {
    config.metadata.quickAddTemplate = 'composio-mcp';
    config.metadata.templateName = 'Composio Integration';
    config.metadata.composioApp = appName;
  }
  
  return config;
}
