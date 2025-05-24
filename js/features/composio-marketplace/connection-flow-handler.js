/**
 * Connection Flow Handler Module
 * Handles main connection flow logic
 */

import * as connector from './composio-connector.js';
import * as notifications from '../../ui/notifications-helper.js';

/**
 * Create OAuth and API key containers
 * @param {HTMLElement} detailsContainer - The details container
 * @param {Object} item - Composio marketplace item
 */
export function createConnectionContainers(detailsContainer, item) {
  // Add OAuth container
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
    
    detailsContainer.insertBefore(oauthContainer, detailsContainer.firstChild);
    
    document.getElementById('composio-check-status-btn').addEventListener('click', () => {
      checkAndSaveConnection(item);
    });
  }
  
  // Add API key container
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
    
    detailsContainer.insertBefore(apiKeyContainer, detailsContainer.firstChild);
    
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
 * Handle connection response
 * @param {Object} connection - Connection response
 * @param {Object} item - Composio marketplace item
 */
export async function handleConnectionResponse(connection, item) {
  if (connection.redirectUrl) {
    // OAuth flow
    const oauthContainer = document.getElementById('composio-oauth-container');
    const oauthButton = document.getElementById('composio-oauth-link');
    
    oauthButton.onclick = () => window.open(connection.redirectUrl, '_blank');
    
    const copyButton = document.getElementById('composio-copy-url-btn');
    copyButton.onclick = () => {
      navigator.clipboard.writeText(connection.redirectUrl).then(() => {
        notifications.showSuccess('OAuth URL copied to clipboard!');
      }).catch(() => {
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
    notifications.showInfo('OAuth connection initiated. Please complete the authorization in your browser.');
  } else if (connection.connectionStatus === 'PENDING_PARAMS') {
    // API key required
    const apiKeyContainer = document.getElementById('composio-api-key-container');
    apiKeyContainer.style.display = 'block';
    notifications.showInfo('API key required. Please enter the API key for ' + item.repo_name);
  } else if (connection.connectionStatus === 'ACTIVE') {
    // Connection is already active
    await autoCreateMcpServer(item);
  } else {
    // Other status
    notifications.showWarning(`Connection initiated with status: ${connection.connectionStatus}. Please check the connection details.`);
  }
}

/**
 * Check connection status and automatically save MCP server
 * @param {Object} item - Composio marketplace item
 */
async function checkAndSaveConnection(item) {
  try {
    const checkBtn = document.getElementById('composio-check-status-btn');
    const originalText = checkBtn.textContent;
    checkBtn.textContent = 'Checking...';
    checkBtn.disabled = true;
    
    const connectionDetails = await connector.checkConnectionStatus();
    
    if (connectionDetails.status === 'ACTIVE') {
      await autoCreateMcpServer(item);
    } else {
      notifications.showWarning(`Connection Status: ${connectionDetails.status}. Please complete the authorization if not done.`);
    }
    
    checkBtn.textContent = originalText;
    checkBtn.disabled = false;
  } catch (error) {
    console.error('Error checking connection status:', error);
    notifications.showError(`Error checking status: ${error.message}`);
    
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
    const submitBtn = document.getElementById('composio-submit-api-key-btn');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Submitting...';
    submitBtn.disabled = true;
    
    await connector.submitApiKey(apiKey);
    
    const connectionDetails = await connector.checkConnectionStatus();
    
    if (connectionDetails.status === 'ACTIVE') {
      await autoCreateMcpServer(item);
    } else {
      notifications.showWarning(`Connection Status: ${connectionDetails.status}. Please check the connection details.`);
      
      document.getElementById('composio-oauth-container').style.display = 'block';
      document.getElementById('composio-api-key-container').style.display = 'none';
    }
    
    submitBtn.textContent = originalText;
    submitBtn.disabled = false;
  } catch (error) {
    console.error('Error submitting API key:', error);
    notifications.showError(`Error submitting API key: ${error.message}`);
    
    const submitBtn = document.getElementById('composio-submit-api-key-btn');
    submitBtn.textContent = 'Submit';
    submitBtn.disabled = false;
  }
}

/**
 * Automatically create and save MCP server
 * @param {Object} item - Composio marketplace item
 */
async function autoCreateMcpServer(item) {
  try {
    hideAllContainers();
    
    const mcpName = `${item.repo_name.toLowerCase()}-mcp`;
    
    const mcpServer = await connector.createMcpServer(mcpName);
    
    const success = await connector.addMcpServerToConfig(mcpName, mcpServer);
    
    if (success) {
      notifications.showRestartWarning();
      
      setTimeout(() => {
        window.modalManager.closeActiveModal();
        
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
    'composio-existing-connections-container',
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

/**
 * Export hide function for external use
 */
export { hideAllContainers };
