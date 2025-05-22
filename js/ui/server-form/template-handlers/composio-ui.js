/**
 * Composio UI Module
 * Handles UI components and event handlers for the Composio template
 */

import * as connection from './composio-connection-utils.js';
import * as mcp from './composio-mcp.js';

// Store the list of apps for use in the form
let cachedApps = [];

/**
 * Generate the HTML for the Composio form
 * @param {object} config - Server configuration
 * @returns {string} - Form HTML
 */
export function generateFormHtml(config) {
  // Extract API key from env
  const apiKey = config.env && config.env.COMPOSIO_API_KEY ? config.env.COMPOSIO_API_KEY : '';
  
  // Extract app name from config if available
  const appName = config.metadata && config.metadata.composioApp ? config.metadata.composioApp : '';
  
  // Get documentation URL from templates
  const templates = window.quickAddTemplates || {};
  const docUrl = templates['composio-mcp']?.documentationUrl || 'https://docs.composio.dev';
  
  // Create form HTML
  return `
    <div class="form-group">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0;">Composio Integration</h3>
        <a href="${docUrl}" target="_blank" class="external-link">Documentation</a>
      </div>
      
      <!-- Step 1: API Key -->
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
      
      <!-- Step 2: App Selection -->
      <div id="composio-step-2" style="display: none;">
        <div style="margin-bottom: 15px;">
          <label for="composio-app-select">Select App</label>
          <select id="composio-app-select" style="width: 100%; padding: 10px; margin-top: 5px; border: 2px solid #4A56E2; border-radius: 4px; font-size: 14px;">
            ${appName ? `<option value="${appName}" selected>${appName}</option>` : ''}
          </select>
          <small>Choose the Composio app to connect to</small>
        </div>
        <div style="margin-top: 15px;">
          <button type="button" id="composio-connect-btn" class="btn btn-primary" style="width: 100%; padding: 10px; font-size: 16px; font-weight: bold; background-color: #4A56E2; color: white; border: none; border-radius: 4px; cursor: pointer;">
            CONNECT TO APP
          </button>
          <div style="margin-top: 10px; display: flex; justify-content: space-between;">
            <button type="button" id="composio-back-btn" class="btn" style="padding: 8px 15px; background-color: #6c757d; color: white; border: none; border-radius: 4px; cursor: pointer;">Back to API Key</button>
          </div>
        </div>
      </div>
      
      <!-- Step 3: Connection Status -->
      <div id="composio-step-3" style="display: none; margin-top: 15px;">
        <div id="composio-connection-status" style="margin-bottom: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
          <p id="composio-status-message" style="margin: 0; font-weight: bold;"></p>
        </div>
        
        <!-- OAuth Flow -->
        <div id="composio-oauth-container" style="display: none; margin-bottom: 15px;">
          <p><strong>OAuth Authentication Required:</strong></p>
          <p>Please open this URL in your browser to authorize:</p>
          <div style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all;">
            <a id="composio-oauth-link" href="#" target="_blank" style="color: #4A56E2;"></a>
          </div>
          <button type="button" id="composio-check-status-btn" class="btn btn-primary" style="margin-top: 10px; padding: 8px 15px; background-color: #4A56E2; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Check Connection Status
          </button>
        </div>
        
        <!-- API Key Input -->
        <div id="composio-api-key-prompt" style="display: none; margin-bottom: 15px;">
          <p><strong>API Key Required:</strong></p>
          <p>This app requires an API key/token. Please provide it below:</p>
          <input type="text" id="composio-api-key-prompt-input" style="width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #ced4da; border-radius: 4px;">
          <button type="button" id="composio-submit-api-key-btn" class="btn btn-primary" style="margin-top: 10px; padding: 8px 15px; background-color: #4A56E2; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Submit
          </button>
        </div>
      </div>
      
      <!-- Step 4: MCP Server Creation -->
      <div id="composio-step-4" style="display: none; margin-top: 15px;">
        <div style="background-color: #d4edda; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
          <p style="margin: 0; color: #155724;"><strong>Connection Active!</strong> You can now create an MCP server.</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label for="composio-mcp-name">MCP Server Name</label>
          <input type="text" id="composio-mcp-name" style="width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #ced4da; border-radius: 4px;">
          <small>Enter a name for your MCP server</small>
        </div>
        
        <button type="button" id="composio-create-mcp-btn" class="btn btn-primary" style="width: 100%; padding: 10px; font-size: 16px; font-weight: bold; background-color: #4A56E2; color: white; border: none; border-radius: 4px; cursor: pointer;">
          CREATE MCP SERVER
        </button>
        
        <div id="composio-mcp-result" style="display: none; margin-top: 15px; background-color: #d4edda; padding: 10px; border-radius: 4px;">
          <p style="margin: 0; color: #155724;"><strong>MCP Server Created Successfully!</strong></p>
          <p style="margin-top: 10px; margin-bottom: 5px;">Your MCP server is now available at:</p>
          <div style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all;">
            <a id="composio-mcp-url" href="#" target="_blank" style="color: #4A56E2;"></a>
          </div>
          <p style="margin-top: 10px; margin-bottom: 0;">Use this URL with your MCP client to access the tools provided by this connection.</p>
        </div>
      </div>
    </div>
    
    <div class="form-group">
      <label><input type="checkbox" id="quick-disabled" ${config.disabled ? 'checked' : ''}> Disabled</label>
    </div>
  `;
}

/**
 * Set up event handlers for the Composio form
 * @param {string} initialApiKey - Initial API key value
 * @param {string} initialAppName - Initial app name value
 */
export function setupEventHandlers(initialApiKey, initialAppName) {
  // Get DOM elements
  const fetchButton = document.getElementById('composio-fetch-apps');
  const backButton = document.getElementById('composio-back-btn');
  const connectButton = document.getElementById('composio-connect-btn');
  const checkStatusButton = document.getElementById('composio-check-status-btn');
  const submitApiKeyButton = document.getElementById('composio-submit-api-key-btn');
  const createMcpButton = document.getElementById('composio-create-mcp-btn');
  
  const apiKeyInput = document.getElementById('composio-api-key');
  const appSelect = document.getElementById('composio-app-select');
  const apiKeyPromptInput = document.getElementById('composio-api-key-prompt-input');
  const mcpNameInput = document.getElementById('composio-mcp-name');
  
  const step1 = document.getElementById('composio-step-1');
  const step2 = document.getElementById('composio-step-2');
  const step3 = document.getElementById('composio-step-3');
  const step4 = document.getElementById('composio-step-4');
  
  const loadingIndicator = document.getElementById('composio-loading');
  const errorDisplay = document.getElementById('composio-error');
  const statusMessage = document.getElementById('composio-status-message');
  const oauthContainer = document.getElementById('composio-oauth-container');
  const oauthLink = document.getElementById('composio-oauth-link');
  const apiKeyPrompt = document.getElementById('composio-api-key-prompt');
  const mcpResult = document.getElementById('composio-mcp-result');
  const mcpUrl = document.getElementById('composio-mcp-url');
  
  if (!fetchButton || !backButton || !connectButton || !apiKeyInput || !appSelect) {
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
      // Initialize the Composio service
      await connection.initializeService(apiKey);
      
      // Fetch available apps
      const apps = await connection.fetchApps();
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
      
      // If we have an initial app name, select it
      if (initialAppName) {
        const options = Array.from(appSelect.options);
        const option = options.find(opt => opt.value === initialAppName);
        if (option) {
          appSelect.value = initialAppName;
        }
      }
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
  
  // Connect button click handler
  connectButton.addEventListener('click', async () => {
    const selectedAppKey = appSelect.value;
    
    if (!selectedAppKey) {
      alert('Please select an app first');
      return;
    }
    
    // Show step 3
    step2.style.display = 'none';
    step3.style.display = 'block';
    statusMessage.textContent = `Initiating connection for ${selectedAppKey}...`;
    statusMessage.style.color = '#856404';
    statusMessage.parentElement.style.backgroundColor = '#fff3cd';
    
    try {
      // Initiate the connection
      const connectionRequest = await connection.initiateConnection(selectedAppKey);
      
      const connectionId = connectionRequest.connectedAccountId;
      if (!connectionId) {
        statusMessage.textContent = 'Connection initiation failed: No connection ID received';
        statusMessage.style.color = '#721c24';
        statusMessage.parentElement.style.backgroundColor = '#f8d7da';
        return;
      }
      
      // Check the initial status
      const initialStatus = connectionRequest.connectionStatus;
      console.log('Initial Connection Status:', initialStatus);
      
      if (initialStatus === 'ACTIVE') {
        // Connection is immediately active
        handleConnectionActive();
      } else if (initialStatus === 'PENDING_PARAMS') {
        // App requires user-provided parameters (like API Key)
        statusMessage.textContent = `Connection for ${selectedAppKey} requires parameters`;
        statusMessage.style.color = '#0c5460';
        statusMessage.parentElement.style.backgroundColor = '#d1ecf1';
        
        // Show API key prompt
        apiKeyPrompt.style.display = 'block';
      } else if (connectionRequest.redirectUrl) {
        // OAuth flow initiated
        statusMessage.textContent = 'OAuth connection initiated. Please complete the authorization in your browser.';
        statusMessage.style.color = '#0c5460';
        statusMessage.parentElement.style.backgroundColor = '#d1ecf1';
        
        // Show OAuth link
        oauthLink.href = connectionRequest.redirectUrl;
        oauthLink.textContent = connectionRequest.redirectUrl;
        oauthContainer.style.display = 'block';
      } else {
        // Initiated but not active, not pending params, and no redirect
        statusMessage.textContent = `Connection initiated, but status is ${initialStatus} and cannot proceed`;
        statusMessage.style.color = '#856404';
        statusMessage.parentElement.style.backgroundColor = '#fff3cd';
      }
    } catch (error) {
      console.error('Error initiating connection:', error);
      statusMessage.textContent = `Error initiating connection: ${error.message || 'Unknown error'}`;
      statusMessage.style.color = '#721c24';
      statusMessage.parentElement.style.backgroundColor = '#f8d7da';
    }
  });
  
  // Check status button click handler
  if (checkStatusButton) {
    checkStatusButton.addEventListener('click', async () => {
      try {
        statusMessage.textContent = 'Checking connection status...';
        statusMessage.style.color = '#856404';
        statusMessage.parentElement.style.backgroundColor = '#fff3cd';
        
        // Get connection details
        const connectionDetails = await connection.checkConnectionStatus();
        
        if (connectionDetails.status === 'ACTIVE') {
          handleConnectionActive();
        } else {
          // Still not active, update user on status
          statusMessage.textContent = `Connection Status: ${connectionDetails.status}. Please complete OAuth flow if not done.`;
          statusMessage.style.color = '#856404';
          statusMessage.parentElement.style.backgroundColor = '#fff3cd';
        }
      } catch (error) {
        console.error('Error checking status:', error);
        statusMessage.textContent = `Error checking status: ${error.message || 'Unknown error'}`;
        statusMessage.style.color = '#721c24';
        statusMessage.parentElement.style.backgroundColor = '#f8d7da';
      }
    });
  }
  
  // Submit API key button click handler
  if (submitApiKeyButton) {
    submitApiKeyButton.addEventListener('click', async () => {
      try {
        const userProvidedValue = apiKeyPromptInput.value.trim();
        if (!userProvidedValue) {
          statusMessage.textContent = 'Please enter the required value';
          statusMessage.style.color = '#721c24';
          statusMessage.parentElement.style.backgroundColor = '#f8d7da';
          return;
        }
        
        statusMessage.textContent = 'Submitting provided credentials...';
        statusMessage.style.color = '#856404';
        statusMessage.parentElement.style.backgroundColor = '#fff3cd';
        
        // Submit API key
        await connection.submitApiKey(userProvidedValue);
        
        // After submitting params, let the user check the status
        statusMessage.textContent = 'Credentials submitted. Please check connection status.';
        statusMessage.style.color = '#0c5460';
        statusMessage.parentElement.style.backgroundColor = '#d1ecf1';
        
        // Hide API key prompt and show check status button
        apiKeyPrompt.style.display = 'none';
        oauthContainer.style.display = 'block';
      } catch (error) {
        console.error('Error submitting credentials:', error);
        statusMessage.textContent = `Error submitting credentials: ${error.message || 'Unknown error'}`;
        statusMessage.style.color = '#721c24';
        statusMessage.parentElement.style.backgroundColor = '#f8d7da';
      }
    });
  }
  
  // Create MCP server button click handler
  if (createMcpButton) {
    createMcpButton.addEventListener('click', async () => {
      try {
        const mcpName = mcpNameInput.value.trim() || `${appSelect.value}-mcp`;
        
        // Create MCP server
        const mcpServer = await mcp.createMcpServer(mcpName);
        
        // Show MCP server URL
        const url = mcp.getMcpServerUrl(mcpServer);
        mcpUrl.href = url;
        mcpUrl.textContent = url;
        mcpResult.style.display = 'block';
      } catch (error) {
        console.error('Error creating MCP server:', error);
        alert(`Error creating MCP server: ${error.message || 'Unknown error'}`);
      }
    });
  }
  
  // If we already have an app name, try to fetch the apps list
  if (initialAppName && initialApiKey) {
    // This will populate the dropdown if the user is editing an existing configuration
    fetchButton.click();
  }
}

/**
 * Handle connection active state
 */
function handleConnectionActive() {
  const step3 = document.getElementById('composio-step-3');
  const step4 = document.getElementById('composio-step-4');
  const statusMessage = document.getElementById('composio-status-message');
  const oauthContainer = document.getElementById('composio-oauth-container');
  const apiKeyPrompt = document.getElementById('composio-api-key-prompt');
  const appSelect = document.getElementById('composio-app-select');
  const mcpNameInput = document.getElementById('composio-mcp-name');
  
  // Update status message
  statusMessage.textContent = `Connection for ${appSelect.value} is ACTIVE!`;
  statusMessage.style.color = '#155724';
  statusMessage.parentElement.style.backgroundColor = '#d4edda';
  
  // Hide OAuth and API key prompt
  oauthContainer.style.display = 'none';
  apiKeyPrompt.style.display = 'none';
  
  // Set default MCP server name
  mcpNameInput.value = `${appSelect.value}-mcp`;
  
  // Show step 4
  step3.style.display = 'none';
  step4.style.display = 'block';
}

/**
 * Get the selected app and API key
 * @returns {Object} - The selected app and API key
 */
export function getFormValues() {
  const apiKey = document.getElementById('composio-api-key').value.trim();
  const appSelect = document.getElementById('composio-app-select');
  const appName = appSelect ? appSelect.value : '';
  
  return { apiKey, appName };
}
