/**
 * Quick Add Connection Module
 * Handles the connection process for Composio apps in the Quick Add flow
 */

// State variables
let currentConnectionRequest = null;
let composioService = null;

/**
 * Initialize the Composio service
 * @param {string} apiKey - The Composio API key
 * @returns {Object} - The Composio service instance
 */
export async function initializeService(apiKey) {
  try {
    // Use the composio-service.js module
    composioService = require('./composio-service.js');
    
    // Initialize SDK with the API key
    composioService.initializeSDK(apiKey);
    
    // Verify API key
    await composioService.verifyApiKey();
    
    return composioService;
  } catch (error) {
    console.error('Error initializing Composio service:', error);
    throw error;
  }
}

/**
 * Initiate a connection for the selected app
 * @param {string} appKey - The selected app key
 * @param {string} apiKey - The Composio API key
 * @returns {Object} - The connection request
 */
export async function initiateConnection(appKey, apiKey) {
  if (!composioService) {
    await initializeService(apiKey);
  }
  
  try {
    // Initiate the connection
    currentConnectionRequest = await composioService.initiateConnection(appKey);
    return currentConnectionRequest;
  } catch (error) {
    console.error('Error initiating connection:', error);
    throw error;
  }
}

/**
 * Check connection status
 * @returns {Object} - The connection details
 */
export async function checkConnectionStatus() {
  if (!composioService || !currentConnectionRequest?.connectedAccountId) {
    throw new Error('Connection not initiated');
  }
  
  try {
    const connectionId = currentConnectionRequest.connectedAccountId;
    
    // Get connection details
    const connectionDetails = await composioService.getConnection(connectionId);
    
    // Preserve the auth_config from the original connection request
    if (currentConnectionRequest.auth_config && !connectionDetails.auth_config) {
      connectionDetails.auth_config = currentConnectionRequest.auth_config;
    }
    
    // Update current connection request with the latest details
    if (connectionDetails.status === 'ACTIVE') {
      currentConnectionRequest = connectionDetails;
    }
    
    return connectionDetails;
  } catch (error) {
    console.error('Error checking status:', error);
    throw error;
  }
}

/**
 * Submit API key for a connection
 * @param {string} apiKey - The API key to submit
 * @returns {Object} - The update response
 */
export async function submitApiKey(apiKey) {
  if (!composioService || !currentConnectionRequest?.connectedAccountId) {
    throw new Error('Connection not initiated');
  }
  
  try {
    const connectionId = currentConnectionRequest.connectedAccountId;
    
    // Create a simple payload with the API key
    const updatePayload = { api_key: apiKey };
    
    // Update the connection data with the provided params
    const updateResponse = await composioService.updateConnectionData(connectionId, updatePayload);
    return updateResponse;
  } catch (error) {
    console.error('Error submitting credentials:', error);
    throw error;
  }
}

/**
 * Get the current connection request
 * @returns {Object} - The current connection request
 */
export function getCurrentConnection() {
  return currentConnectionRequest;
}

/**
 * Get the Composio service
 * @returns {Object} - The Composio service
 */
export function getService() {
  return composioService;
}
