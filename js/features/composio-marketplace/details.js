/**
 * Composio Marketplace Details Module
 * Handles item details view
 */

import { showDetailsView } from './modal.js';
import * as connector from './composio-connector.js';
import notifications from '../../ui/notifications.js';
import configManager from '../../config/config-manager.js';

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
            <li>Click "Check and Save" to automatically create an MCP server</li>
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
  
  // Create containers for OAuth, API key, and MCP server
  createContainers(detailsContainer, item);
}

/**
 * Create containers for OAuth, API key, and MCP server
 * @param {HTMLElement} detailsContainer - The details container
 * @param {Object} item - Composio marketplace item
 */
function createContainers(detailsContainer, item) {
  // Add OAuth container if it doesn't exist
  if (!document.getElementById('composio-oauth-container')) {
    const oauthContainer = document.createElement('div');
    oauthContainer.id = 'composio-oauth-container';
    oauthContainer.className = 'oauth-container';
    oauthContainer.style.display = 'none';
    oauthContainer.innerHTML = `
      <div class="oauth-content">
        <h3>OAuth Authorization Required</h3>
        <p>Authenticate:</p>
        <div style="display: flex; gap: 10px; margin: 10px 0;">
          <button id="composio-oauth-link" class="btn btn-primary" target="_blank">Open Authentication</button>
          <button id="composio-copy-url-btn" class="btn btn-reveal">Copy URL</button>
        </div>
        <p>After completing the authorization, click the button below:</p>
        <button id="composio-check-status-btn" class="btn btn-primary">Check and Save</button>
      </div>
    `;
    
    // Insert at the top of the details container
    detailsContainer.insertBefore(oauthContainer, detailsContainer.firstChild);
    
    // Add check status button event listener
    document.getElementById('composio-check-status-btn').addEventListener('click', () => {
      checkAndSaveConnection(item);
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
    
    // Insert at the top of the details container
    detailsContainer.insertBefore(apiKeyContainer, detailsContainer.firstChild);
    
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
      // OAuth flow - show as button instead of link
      const oauthContainer = document.getElementById('composio-oauth-container');
      const oauthButton = document.getElementById('composio-oauth-link');
      
      // Set up button to open OAuth URL
      oauthButton.onclick = () => window.open(connection.redirectUrl, '_blank');
      
      // Set up copy URL button
      const copyButton = document.getElementById('composio-copy-url-btn');
      copyButton.onclick = () => {
        navigator.clipboard.writeText(connection.redirectUrl).then(() => {
          notifications.showSuccess('OAuth URL copied to clipboard!');
        }).catch(() => {
          // Fallback for older browsers
          const textArea = document.createElement('textarea');
          textArea.value = connection.redirectUrl;
          document.body.appendChild(textArea);
          textArea.select();
          document.execCommand('copy');
          document.body.removeChild(textArea);
          notifications.showSuccess('OAuth URL copied to clipboard!');
        });
      };
      
      oauthContainer.style.display = 'block';
      
      // Show notification
      notifications.showInfo('OAuth connection initiated. Please complete the authorization in your browser.');
    } else if (connection.connectionStatus === 'PENDING_PARAMS') {
      // API key required
      const apiKeyContainer = document.getElementById('composio-api-key-container');
      apiKeyContainer.style.display = 'block';
      
      // Show notification
      notifications.showInfo('API key required. Please enter the API key for ' + item.repo_name);
    } else if (connection.connectionStatus === 'ACTIVE') {
      // Connection is already active, automatically create MCP server
      await autoCreateMcpServer(item);
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
 * Check connection status and automatically save MCP server
 * @param {Object} item - Composio marketplace item
 */
async function checkAndSaveConnection(item) {
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
      // Connection is active, automatically create and save MCP server
      await autoCreateMcpServer(item);
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
    checkBtn.textContent = 'Check and Save';
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
      // Connection is active, automatically create MCP server
      await autoCreateMcpServer(item);
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
 * Automatically create and save MCP server (using EXACT same process as original)
 * @param {Object} item - Composio marketplace item
 */
async function autoCreateMcpServer(item) {
  try {
    // Hide all containers
    hideAllContainers();
    
    // Generate MCP server name
    const mcpName = `${item.repo_name.toLowerCase()}-mcp`;
    
    // Step 1: Create MCP server via Composio API (same as original)
    const mcpServer = await connector.createMcpServer(mcpName);
    
    // Step 2: Add MCP server to configuration (using EXACT same function as original)
    const success = await connector.addMcpServerToConfig(mcpName, mcpServer);
    
    if (success) {
      // Step 3: Show restart warning (same as manual server addition)
      notifications.showRestartWarning();
      
      // Step 4: Close Composio modal and navigate to main view
      setTimeout(() => {
        // Close the modal
        window.modalManager.closeActiveModal();
        
        // Refresh server list to show new server
        if (window.serverList && window.serverList.refreshList) {
          window.serverList.refreshList();
        }
      }, 2000);
    }
    
  } catch (error) {
    console.error('Error creating MCP server:', error);
    notifications.showError(`Error creating MCP server: ${error.message}`);
  }
}

/**
 * Hide all containers
 */
function hideAllContainers() {
  const containers = [
    'composio-oauth-container',
    'composio-api-key-container'
  ];
  
  containers.forEach(id => {
    const container = document.getElementById(id);
    if (container) {
      container.style.display = 'none';
    }
  });
}
