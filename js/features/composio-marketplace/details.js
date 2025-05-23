/**
 * Composio Marketplace Details Module
 * Handles item details view
 */

import { showDetailsView } from './modal.js';
import * as connector from './composio-connector.js';
import * as notifications from '../../ui/notifications-helper.js';

// Current item being viewed
let currentItem = null;

/**
 * Set current item
 * @param {Object} item - Composio marketplace item
 */
export function setCurrentItem(item) {
  currentItem = item;
}

/**
 * Get current item
 * @returns {Object} - Current Composio marketplace item
 */
export function getCurrentItem() {
  return currentItem;
}

/**
 * Show item details
 * @param {Object} item - Composio marketplace item
 */
export function showItemDetails(item) {
  setCurrentItem(item);
  
  // Hide items view, show details view
  document.getElementById('composio-marketplace-items-view').style.display = 'none';
  document.getElementById('composio-marketplace-details-view').style.display = 'block';
  
  // Get the details container
  const detailsContainer = document.getElementById('composio-marketplace-details-container');
  
  // Populate details
  detailsContainer.innerHTML = `
    <div class="details-header">
      <div class="details-header-top">
        <h2>${item.repo_name}</h2>
        <button id="composio-connect-btn" class="btn btn-primary">Connect</button>
      </div>
      <div class="details-meta">
        <span class="server-type">${item.server_type ? item.server_type.toUpperCase() : 'UNKNOWN'}</span>
        <span class="stars">⭐ ${item.stars || 0}</span>
        <span class="category">${item.category || 'Uncategorized'}</span>
      </div>
    </div>
    <div class="details-summary">
      <p>${item.summary_200_words || 'No description available'}</p>
    </div>
    <div class="details-readme">
      <h3>App Details</h3>
      <div id="composio-readme-content" class="readme-content">
        <div class="readme-html">
          <p>This Composio app provides integration with ${item.repo_name}.</p>
          <p>To use this app, you'll need to:</p>
          <ol>
            <li>Click "Connect" to connect to this app</li>
            <li>Complete any required authentication (OAuth or API key)</li>
            <li>Create an MCP server for the app</li>
            <li>Start using the app with Claude</li>
          </ol>
          <p>For more information, refer to the Composio documentation.</p>
        </div>
      </div>
    </div>
  `;
  
  // Add connect button event listener
  document.getElementById('composio-connect-btn').addEventListener('click', () => {
    connectToApp(item);
  });
  
  // Add OAuth container if it doesn't exist
  if (!document.getElementById('composio-oauth-container')) {
    const oauthContainer = document.createElement('div');
    oauthContainer.id = 'composio-oauth-container';
    oauthContainer.className = 'oauth-container';
    oauthContainer.style.display = 'none';
    oauthContainer.innerHTML = `
      <div class="oauth-content">
        <h3>OAuth Authorization Required</h3>
        <p>Please complete the authorization in your browser by opening the following URL:</p>
        <a id="composio-oauth-link" href="#" target="_blank"></a>
        <p>After completing the authorization, click the button below to check the connection status:</p>
        <button id="composio-check-status-btn" class="btn btn-primary">Check Connection Status</button>
      </div>
    `;
    detailsContainer.appendChild(oauthContainer);
    
    // Add check status button event listener
    document.getElementById('composio-check-status-btn').addEventListener('click', () => {
      checkConnectionStatus(item);
    });
  }
  
  // Add API key container if it doesn't exist
  if (!document.getElementById('composio-api-key-container')) {
    const apiKeyContainer = document.createElement('div');
    apiKeyContainer.id = 'composio-api-key-container';
    apiKeyContainer.className = 'api-key-container';
    apiKeyContainer.style.display = 'none';
    apiKeyContainer.innerHTML = `
      <div class="api-key-content">
        <h3>API Key Required</h3>
        <p>Please enter the API key for ${item.repo_name}:</p>
        <input type="text" id="composio-api-key-input" placeholder="Enter API key...">
        <button id="composio-submit-api-key-btn" class="btn btn-primary">Submit</button>
      </div>
    `;
    detailsContainer.appendChild(apiKeyContainer);
    
    // Add submit API key button event listener
    document.getElementById('composio-submit-api-key-btn').addEventListener('click', () => {
      const apiKey = document.getElementById('composio-api-key-input').value.trim();
      if (apiKey) {
        submitApiKey(apiKey, item);
      } else {
        alert('Please enter a valid API key');
      }
    });
  }
  
  // Add MCP server container if it doesn't exist
  if (!document.getElementById('composio-mcp-container')) {
    const mcpContainer = document.createElement('div');
    mcpContainer.id = 'composio-mcp-container';
    mcpContainer.className = 'mcp-container';
    mcpContainer.style.display = 'none';
    mcpContainer.innerHTML = `
      <div class="mcp-content">
        <h3>Create MCP Server</h3>
        <p>Connection is active! You can now create an MCP server for ${item.repo_name}.</p>
        <div class="form-group">
          <label for="composio-mcp-name">MCP Server Name:</label>
          <input type="text" id="composio-mcp-name" value="${item.repo_name.toLowerCase()}-mcp">
        </div>
        <button id="composio-create-mcp-btn" class="btn btn-success">Create MCP Server</button>
        <div id="composio-mcp-result" style="display: none; margin-top: 15px;">
          <h4>MCP Server Created Successfully!</h4>
          <p>Your MCP server is now available at: <a id="composio-mcp-url" href="#" target="_blank"></a></p>
        </div>
      </div>
    `;
    detailsContainer.appendChild(mcpContainer);
    
    // Add create MCP server button event listener
    document.getElementById('composio-create-mcp-btn').addEventListener('click', () => {
      const mcpName = document.getElementById('composio-mcp-name').value.trim() || `${item.repo_name.toLowerCase()}-mcp`;
      createMcpServer(mcpName, item);
    });
  }
}

/**
 * Connect to a Composio app
 * @param {Object} item - Composio marketplace item
 */
async function connectToApp(item) {
  try {
    // Show loading state
    const connectBtn = document.getElementById('composio-connect-btn');
    const originalText = connectBtn.textContent;
    connectBtn.textContent = 'Connecting...';
    connectBtn.disabled = true;
    
    // Hide any previously shown containers
    hideAllContainers();
    
    // Connect to the app
    const connection = await connector.connectToApp(item);
    
    // Handle connection response
    if (connection.redirectUrl) {
      // OAuth flow
      const oauthContainer = document.getElementById('composio-oauth-container');
      const oauthLink = document.getElementById('composio-oauth-link');
      
      oauthLink.href = connection.redirectUrl;
      oauthLink.textContent = connection.redirectUrl;
      oauthContainer.style.display = 'block';
      
      // Show notification
      notifications.showInfo('OAuth authentication required. Please complete the authorization in your browser.');
    } else if (connection.connectionStatus === 'PENDING_PARAMS') {
      // API key required
      const apiKeyContainer = document.getElementById('composio-api-key-container');
      apiKeyContainer.style.display = 'block';
      
      // Show notification
      notifications.showInfo('API key required. Please enter the API key for ' + item.repo_name);
    } else if (connection.connectionStatus === 'ACTIVE') {
      // Connection is already active, show MCP server creation
      handleConnectionActive(item);
    } else {
      // Other status
      notifications.showWarning(`Connection initiated with status: ${connection.connectionStatus}. Please check the connection details.`);
    }
    
    // Reset button
    connectBtn.textContent = originalText;
    connectBtn.disabled = false;
  } catch (error) {
    console.error('Error connecting to app:', error);
    notifications.showError(`Error connecting to ${item.repo_name}: ${error.message}`);
    
    // Reset button
    const connectBtn = document.getElementById('composio-connect-btn');
    connectBtn.textContent = 'Connect';
    connectBtn.disabled = false;
  }
}

/**
 * Check connection status
 * @param {Object} item - Composio marketplace item
 */
async function checkConnectionStatus(item) {
  try {
    // Show loading state
    const checkBtn = document.getElementById('composio-check-status-btn');
    const originalText = checkBtn.textContent;
    checkBtn.textContent = 'Checking...';
    checkBtn.disabled = true;
    
    // Check connection status
    const connectionDetails = await connector.checkConnectionStatus();
    
    // Handle connection status
    if (connectionDetails.status === 'ACTIVE') {
      // Connection is active, show MCP server creation
      handleConnectionActive(item);
    } else {
      // Still not active
      notifications.showWarning(`Connection Status: ${connectionDetails.status}. Please complete the authorization if not done.`);
    }
    
    // Reset button
    checkBtn.textContent = originalText;
    checkBtn.disabled = false;
  } catch (error) {
    console.error('Error checking connection status:', error);
    notifications.showError(`Error checking status: ${error.message}`);
    
    // Reset button
    const checkBtn = document.getElementById('composio-check-status-btn');
    checkBtn.textContent = 'Check Connection Status';
    checkBtn.disabled = false;
  }
}

/**
 * Submit API key for a connection
 * @param {string} apiKey - The API key to submit
 * @param {Object} item - Composio marketplace item
 */
async function submitApiKey(apiKey, item) {
  try {
    // Show loading state
    const submitBtn = document.getElementById('composio-submit-api-key-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    // Submit API key
    await connector.submitApiKey(apiKey);
    
    // Check connection status
    const connectionDetails = await connector.checkConnectionStatus();
    
    // Handle connection status
    if (connectionDetails.status === 'ACTIVE') {
      // Connection is active, show MCP server creation
      handleConnectionActive(item);
    } else {
      // Still not active
      notifications.showWarning(`Connection Status: ${connectionDetails.status}. Please check the connection details.`);
      
      // Show OAuth container to allow checking status
      document.getElementById('composio-oauth-container').style.display = 'block';
      document.getElementById('composio-api-key-container').style.display = 'none';
    }
    
    // Reset button
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  } catch (error) {
    console.error('Error submitting API key:', error);
    notifications.showError(`Error submitting API key: ${error.message}`);
    
    // Reset button
    const submitBtn = document.getElementById('composio-submit-api-key-btn');
    submitBtn.textContent = 'Submit';
    submitBtn.disabled = false;
  }
}

/**
 * Create an MCP server for the current connection
 * @param {string} name - The name for the MCP server
 * @param {Object} item - Composio marketplace item
 */
async function createMcpServer(name, item) {
  try {
    // Show loading state
    const createBtn = document.getElementById('composio-create-mcp-btn');
    const originalText = createBtn.textContent;
    createBtn.textContent = 'Creating...';
    createBtn.disabled = true;
    
    // Create MCP server
    const mcpServer = await connector.createMcpServer(name);
    
    // Get MCP server URL
    const url = connector.getMcpServerUrl(mcpServer);
    
    // Show MCP server URL
    const mcpUrl = document.getElementById('composio-mcp-url');
    mcpUrl.href = url;
    mcpUrl.textContent = url;
    document.getElementById('composio-mcp-result').style.display = 'block';
    
    // Add MCP server to configuration
    await connector.addMcpServerToConfig(name, mcpServer);
    
    // Show success message
    notifications.showSuccess(`Successfully created MCP server "${name}" for ${item.repo_name}`);
    
    // Reset button
    createBtn.textContent = originalText;
    createBtn.disabled = false;
  } catch (error) {
    console.error('Error creating MCP server:', error);
    notifications.showError(`Error creating MCP server: ${error.message}`);
    
    // Reset button
    const createBtn = document.getElementById('composio-create-mcp-btn');
    createBtn.textContent = 'Create MCP Server';
    createBtn.disabled = false;
  }
}

/**
 * Handle connection active state
 * @param {Object} item - Composio marketplace item
 */
function handleConnectionActive(item) {
  // Hide OAuth and API key containers
  document.getElementById('composio-oauth-container').style.display = 'none';
  document.getElementById('composio-api-key-container').style.display = 'none';
  
  // Set default MCP server name
  document.getElementById('composio-mcp-name').value = `${item.repo_name.toLowerCase()}-mcp`;
  
  // Show MCP container
  document.getElementById('composio-mcp-container').style.display = 'block';
  
  // Show success message
  notifications.showSuccess(`Connection for ${item.repo_name} is active! You can now create an MCP server.`);
}

/**
 * Hide all containers
 */
function hideAllContainers() {
  const containers = [
    'composio-oauth-container',
    'composio-api-key-container',
    'composio-mcp-container'
  ];
  
  containers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.style.display = 'none';
    }
  });
}
