/**
 * Quick Add UI Module
 * Handles UI components and event handlers for the Composio app selector
 */

import * as connection from './quick-add-connection.js';
import * as mcp from './quick-add-mcp.js';

// UI elements
let statusMessage;
let connectionStatus;
let oauthContainer;
let oauthLink;
let apiKeyPrompt;
let apiKeyPromptInput;
let mcpContainer;
let mcpNameInput;
let mcpResult;
let mcpUrl;
let appSelect;

/**
 * Initialize UI elements
 */
export function initializeUI() {
  // Get UI elements
  statusMessage = document.getElementById('app-status-message');
  connectionStatus = document.getElementById('app-connection-status');
  oauthContainer = document.getElementById('app-oauth-container');
  oauthLink = document.getElementById('app-oauth-link');
  apiKeyPrompt = document.getElementById('app-api-key-prompt');
  apiKeyPromptInput = document.getElementById('app-api-key-prompt-input');
  mcpContainer = document.getElementById('app-mcp-container');
  mcpNameInput = document.getElementById('app-mcp-name');
  mcpResult = document.getElementById('app-mcp-result');
  mcpUrl = document.getElementById('app-mcp-url');
  appSelect = document.getElementById('app-select');
  
  if (!statusMessage || !connectionStatus || !oauthContainer || !oauthLink || 
      !apiKeyPrompt || !apiKeyPromptInput || !mcpContainer || !mcpNameInput || 
      !mcpResult || !mcpUrl || !appSelect) {
    console.error('UI elements not found');
    return false;
  }
  
  return true;
}

/**
 * Set up event handlers
 * @param {HTMLElement} connectButton - The connect button
 * @param {HTMLElement} checkStatusButton - The check status button
 * @param {HTMLElement} submitApiKeyButton - The submit API key button
 * @param {HTMLElement} createMcpButton - The create MCP server button
 * @param {HTMLElement} apiKeyInput - The API key input
 */
export function setupEventHandlers(connectButton, checkStatusButton, submitApiKeyButton, createMcpButton, apiKeyInput) {
  console.log('[FIX UI - setupEventHandlers] Function called. connectButton exists:', !!connectButton);
  // Connect button click handler
  if (connectButton) {
    console.log('[FIX UI - setupEventHandlers] Attaching click listener to connectButton.');
    connectButton.addEventListener('click', async () => {
      console.log('[FIX UI] Connect button clicked.');
      const selectedAppKey = appSelect.value;
      
      if (!selectedAppKey) {
        alert('Please select an app first');
        return;
      }
      
      // Show connection status
      connectionStatus.style.display = 'block';
      updateStatus('Initiating connection for ' + selectedAppKey + '...', 'warning');
      
      try {
        console.log('[FIX UI] API Key from input for connection:', apiKeyInput.value.trim()); // apiKeyInput is passed to setupEventHandlers
        console.log('[FIX UI] Selected App Key for connection:', selectedAppKey);

        const connectionRequest = await connection.initiateConnection(selectedAppKey, apiKeyInput.value.trim());
        // This is your original debug line, ensure it's here:
        console.log('QUICK ADD DEBUG - Connection Request (from UI):', JSON.stringify(connectionRequest, null, 2)); 
        
        // ... rest of your existing logic to handle connectionRequest ...
        // Ensure this part is reached and working:
        if (connectionRequest.redirectUrl) {
            console.log('[FIX UI] Redirect URL found:', connectionRequest.redirectUrl);
            oauthLink.href = connectionRequest.redirectUrl;
            oauthLink.textContent = connectionRequest.redirectUrl;
            oauthContainer.style.display = 'block';
            console.log('[FIX UI] OAuth container should now be visible.');
            updateStatus('OAuth connection initiated. Please complete the authorization in your browser.', 'info');
        } else if (connectionRequest.connectedAccountId) {
          updateStatus('Connection successful!', 'success');
          // Optionally, hide the OAuth container if not needed
          oauthContainer.style.display = 'none';
        } else {
            console.log('[FIX UI] No redirectUrl in connectionRequest from UI.');
            updateStatus('Connection initiated, but status is ' + connectionRequest.connectionStatus + ' and cannot proceed', 'warning');
        }
      } catch (error) {
        console.error('[FIX UI] CRITICAL ERROR during connectButton click handler:', error); // This will show errors from initiateConnection
        updateStatus('Error initiating connection: ' + (error.message || 'Unknown error'), 'error');
      }
    });
  }
  
  // Check status button click handler
  if (checkStatusButton) {
    checkStatusButton.addEventListener('click', async () => {
      try {
        updateStatus('Checking connection status...', 'warning');
        
        // Get connection details
        const connectionDetails = await connection.checkConnectionStatus();
        
        if (connectionDetails.status === 'ACTIVE') {
          handleConnectionActive();
        } else {
          // Still not active, update user on status
          updateStatus('Connection Status: ' + connectionDetails.status + '. Please complete OAuth flow if not done.', 'warning');
        }
      } catch (error) {
        console.error('Error checking status:', error);
        updateStatus('Error checking status: ' + (error.message || 'Unknown error'), 'error');
      }
    });
  }
  
  // Submit API key button click handler
  if (submitApiKeyButton) {
    submitApiKeyButton.addEventListener('click', async () => {
      try {
        const userProvidedValue = apiKeyPromptInput.value.trim();
        if (!userProvidedValue) {
          updateStatus('Please enter the required value', 'error');
          return;
        }
        
        updateStatus('Submitting provided credentials...', 'warning');
        
        // Submit API key
        await connection.submitApiKey(userProvidedValue);
        
        // After submitting params, let the user check the status
        updateStatus('Credentials submitted. Please check connection status.', 'info');
        
        // Hide API key prompt and show check status button
        apiKeyPrompt.style.display = 'none';
        oauthContainer.style.display = 'block';
      } catch (error) {
        console.error('Error submitting credentials:', error);
        updateStatus('Error submitting credentials: ' + (error.message || 'Unknown error'), 'error');
      }
    });
  }
  
  // Create MCP server button click handler
  if (createMcpButton) {
    createMcpButton.addEventListener('click', async () => {
      try {
        const mcpName = mcpNameInput.value.trim() || appSelect.value + '-mcp';
        
        // Create MCP server
        const mcpServer = await mcp.createMcpServer(mcpName);
        
        // Show MCP server URL
        const url = mcp.getMcpServerUrl(mcpServer);
        mcpUrl.href = url;
        mcpUrl.textContent = url;
        mcpResult.style.display = 'block';
        
        // Add MCP server to configuration
        const added = await mcp.addMcpServerToConfig(mcpName, mcpServer);
        
        if (added) {
          // Update success message to indicate the server was added to the configuration
          const successMessage = document.createElement('p');
          successMessage.style.marginTop = '10px';
          successMessage.style.color = '#155724';
          successMessage.textContent = 'MCP server added to configuration. You can now start it from the main screen.';
          mcpResult.appendChild(successMessage);
        }
      } catch (error) {
        console.error('Error creating MCP server:', error);
        alert('Error creating MCP server: ' + (error.message || 'Unknown error'));
      }
    });
  }
}

/**
 * Update status message
 * @param {string} message - The status message
 * @param {string} type - The status type (info, warning, error, success)
 */
export function updateStatus(message, type) {
  statusMessage.textContent = message;
  
  switch (type) {
    case 'info':
      statusMessage.style.color = '#0c5460';
      statusMessage.parentElement.style.backgroundColor = '#d1ecf1';
      break;
    case 'warning':
      statusMessage.style.color = '#856404';
      statusMessage.parentElement.style.backgroundColor = '#fff3cd';
      break;
    case 'error':
      statusMessage.style.color = '#721c24';
      statusMessage.parentElement.style.backgroundColor = '#f8d7da';
      break;
    case 'success':
      statusMessage.style.color = '#155724';
      statusMessage.parentElement.style.backgroundColor = '#d4edda';
      break;
  }
}

/**
 * Handle connection active state
 */
export function handleConnectionActive() {
  // Update status message
  updateStatus('Connection for ' + appSelect.value + ' is ACTIVE!', 'success');
  
  // Hide OAuth and API key prompt
  oauthContainer.style.display = 'none';
  apiKeyPrompt.style.display = 'none';
  
  // Set default MCP server name
  mcpNameInput.value = appSelect.value + '-mcp';
  
  // Show MCP container
  mcpContainer.style.display = 'block';
}

/**
 * Show connect button when an app is selected
 * @param {HTMLElement} connectContainer - The connect button container
 */
export function showConnectButton(connectContainer) {
  connectContainer.style.display = 'block';
}
