/**
 * Composio App Selector Module
 * Handles fetching and selecting Composio apps
 */

import * as connection from './quick-add-connection.js';
import * as ui from './quick-add-ui.js';

let base;
let appSelectorContainer;
let apiKeyInput;
let appNameInput;
let fetchButton;
let appSelect;
let loadingIndicator;
let errorDisplay;
let cachedApps = [];

/**
 * Initialize the app selector module
 * @param {Object} baseModule - The base module instance
 */
export function init(baseModule) {
  base = baseModule;
  
  // The DOM elements will be initialized later when the form is generated
  // We don't need to do anything here
}

/**
 * Fetch apps from Composio
 */
async function fetchApps() {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showError('API Key is required');
    return;
  }
  
  // Show loading indicator
  loadingIndicator.style.display = 'block';
  errorDisplay.style.display = 'none';
  
  try {
    // Initialize the Composio service
    await connection.initializeService(apiKey);
    
    // Fetch available apps
    const apps = await connection.getService().listApps();
    cachedApps = apps;
    
    // Populate the select dropdown
    appSelect.innerHTML = '';
    
    if (apps.length === 0) {
      showError('No apps found for this API key');
      return;
    }
    
    apps.forEach(app => {
      const option = document.createElement('option');
      option.value = app.uniqueKey || app.name;
      option.textContent = app.displayName || app.name;
      appSelect.appendChild(option);
    });
    
    // Update the hidden input with the selected app
    updateAppNameInput();
    
    // Show the app select
    appSelect.style.display = 'block';
  } catch (error) {
    console.error('Error fetching Composio apps:', error);
    showError(`Error: ${error.message || 'Failed to fetch apps'}`);
  } finally {
    // Hide loading indicator
    loadingIndicator.style.display = 'none';
  }
}

/**
 * Show an error message
 * @param {string} message - The error message
 */
function showError(message) {
  errorDisplay.textContent = message;
  errorDisplay.style.display = 'block';
}

/**
 * Update the hidden app name input with the selected app
 */
function updateAppNameInput() {
  if (appSelect.value) {
    appNameInput.value = appSelect.value;
  }
}

/**
 * Generate the app selector HTML
 * @returns {string} - The HTML for the app selector
 */
export function generateHtml() {
  return `
    <div id="app-selector-container" class="app-selector-container">
      <div style="margin-top: 10px; margin-bottom: 15px;">
        <button type="button" id="fetch-apps-btn" class="btn btn-primary" style="width: 100%; padding: 10px; font-size: 16px; font-weight: bold; background-color: #4A56E2; color: white; border: none; border-radius: 4px; cursor: pointer;">
          FETCH AVAILABLE APPS
        </button>
        <div id="app-loading" style="display: none; margin-top: 10px; text-align: center; font-weight: bold; color: #4A56E2;">
          <span>Loading apps...</span>
        </div>
        <div id="app-error" style="display: none; margin-top: 10px; color: red; text-align: center; font-weight: bold;"></div>
      </div>
      <select id="app-select" style="width: 100%; display: none; margin-top: 10px; padding: 10px; border: 2px solid #4A56E2; border-radius: 4px; font-size: 14px;"></select>
      
      <!-- Connect button (initially hidden) -->
      <div id="app-connect-container" style="display: none; margin-top: 15px;">
        <button type="button" id="connect-app-btn" class="btn btn-primary" style="width: 100%; padding: 10px; font-size: 16px; font-weight: bold; background-color: #4A56E2; color: white; border: none; border-radius: 4px; cursor: pointer;">
          CONNECT TO APP
        </button>
      </div>
      
      <!-- Connection status (initially hidden) -->
      <div id="app-connection-status" style="display: none; margin-top: 15px; padding: 10px; background-color: #f8f9fa; border-radius: 4px;">
        <p id="app-status-message" style="margin: 0; font-weight: bold;"></p>
      </div>
      
      <!-- OAuth Flow (initially hidden) -->
      <div id="app-oauth-container" style="display: none; margin-top: 15px;">
        <p><strong>OAuth Authentication Required:</strong></p>
        <p>Please open this URL in your browser to authorize:</p>
        <div style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all;">
          <a id="app-oauth-link" href="#" target="_blank" style="color: #4A56E2;"></a>
        </div>
        <button type="button" id="check-status-btn" class="btn btn-primary" style="margin-top: 10px; padding: 8px 15px; background-color: #4A56E2; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Check Connection Status
        </button>
      </div>
      
      <!-- API Key Input (initially hidden) -->
      <div id="app-api-key-prompt" style="display: none; margin-top: 15px;">
        <p><strong>API Key Required:</strong></p>
        <p>This app requires an API key/token. Please provide it below:</p>
        <input type="text" id="app-api-key-prompt-input" style="width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #ced4da; border-radius: 4px;">
        <button type="button" id="submit-api-key-btn" class="btn btn-primary" style="margin-top: 10px; padding: 8px 15px; background-color: #4A56E2; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Submit
        </button>
      </div>
      
      <!-- MCP Server Creation (initially hidden) -->
      <div id="app-mcp-container" style="display: none; margin-top: 15px;">
        <div style="background-color: #d4edda; padding: 10px; border-radius: 4px; margin-bottom: 15px;">
          <p style="margin: 0; color: #155724;"><strong>Connection Active!</strong> You can now create an MCP server.</p>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label for="app-mcp-name">MCP Server Name</label>
          <input type="text" id="app-mcp-name" style="width: 100%; padding: 10px; margin-top: 5px; border: 1px solid #ced4da; border-radius: 4px;">
          <small>Enter a name for your MCP server</small>
        </div>
        
        <button type="button" id="create-mcp-btn" class="btn btn-primary" style="width: 100%; padding: 10px; font-size: 16px; font-weight: bold; background-color: #4A56E2; color: white; border: none; border-radius: 4px; cursor: pointer;">
          CREATE MCP SERVER
        </button>
        
        <div id="app-mcp-result" style="display: none; margin-top: 15px; background-color: #d4edda; padding: 10px; border-radius: 4px;">
          <p style="margin: 0; color: #155724;"><strong>MCP Server Created Successfully!</strong></p>
          <p style="margin-top: 10px; margin-bottom: 5px;">Your MCP server is now available at:</p>
          <div style="background-color: #f8f9fa; padding: 10px; border-radius: 4px; word-break: break-all;">
            <a id="app-mcp-url" href="#" target="_blank" style="color: #4A56E2;"></a>
          </div>
          <p style="margin-top: 10px; margin-bottom: 0;">Use this URL with your MCP client to access the tools provided by this connection.</p>
        </div>
      </div>
    </div>
  `;
}

/**
 * Initialize the app selector after the HTML has been added to the DOM
 */
export function initializeSelector() {
  // Get the elements
  fetchButton = document.getElementById('fetch-apps-btn');
  appSelect = document.getElementById('app-select');
  loadingIndicator = document.getElementById('app-loading');
  errorDisplay = document.getElementById('app-error');
  appSelectorContainer = document.getElementById('app-selector-container');
  apiKeyInput = document.getElementById('input-COMPOSIO_API_KEY');
  appNameInput = document.getElementById('input-appName');
  
  // Get new UI elements
  const connectButton = document.getElementById('connect-app-btn');
  const connectContainer = document.getElementById('app-connect-container');
  const checkStatusButton = document.getElementById('check-status-btn');
  const submitApiKeyButton = document.getElementById('submit-api-key-btn');
  const createMcpButton = document.getElementById('create-mcp-btn');
  
  if (!fetchButton || !appSelect || !loadingIndicator || !errorDisplay) {
    console.error('App selector elements not found');
    return;
  }
  
  if (!apiKeyInput || !appNameInput) {
    console.error('API key or app name input not found');
    return;
  }
  
  // Initialize UI elements
  if (!ui.initializeUI()) {
    console.error('Failed to initialize UI elements');
    return;
  }
  
  // Set up event listeners
  fetchButton.addEventListener('click', fetchApps);
  
  // Set up change handler for the app select
  appSelect.addEventListener('change', () => {
    updateAppNameInput();
    
    // Show connect button when an app is selected
    ui.showConnectButton(connectContainer);
  });
  
  // Set up event handlers for the new UI elements
  ui.setupEventHandlers(connectButton, checkStatusButton, submitApiKeyButton, createMcpButton, apiKeyInput);
}
