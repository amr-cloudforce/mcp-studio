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
    console.log('[FIX] Attempting to initialize Composio service. API Key present:', !!apiKey);
    // Use the composio-service.js module
    composioService = require('./composio-service.js');
    console.log('[FIX] composio-service.js required. Is it loaded?', !!composioService);
    
    if (!composioService || typeof composioService.initializeSDK !== 'function') {
      console.error('[FIX] composioService.initializeSDK is not a function or composioService is not loaded!');
      throw new Error('Composio service did not load correctly.');
    }
    
    // Initialize SDK with the API key
    composioService.initializeSDK(apiKey);
    console.log('[FIX] SDK initialized with Composio service.');
    
    // Verify API key
    await composioService.verifyApiKey();
    console.log('[FIX] API Key verified by Composio service.');
    
    return composioService;
  } catch (error) {
    console.error('[FIX] CRITICAL ERROR in initializeService:', error);
    throw error; // Re-throw to ensure it's caught by the caller
  }
}

/**
 * Initiate a connection for the selected app
 * @param {string} appKey - The selected app key
 * @param {string} apiKey - The Composio API key
 * @returns {Object} - The connection request
 */
export async function initiateConnection(appKey, apiKey) {
  console.log('[FIX] Quick Add initiateConnection called. AppKey:', appKey, 'API Key present:', !!apiKey);
  if (!composioService) {
    console.log('[FIX] Composio service not pre-initialized. Calling initializeService...');
    try {
      await initializeService(apiKey); // This will set the global composioService
      if (!composioService) { // Double check after initialization attempt
         console.error('[FIX] composioService is STILL NULL after initializeService call from initiateConnection.');
         throw new Error('Failed to initialize composioService within initiateConnection.');
      }
      console.log('[FIX] composioService initialized from within initiateConnection. Is it valid?', !!composioService);
    } catch (initError) {
      console.error('[FIX] Error during lazy initialization in initiateConnection:', initError);
      throw initError; // Stop execution if lazy init fails
    }
  }
  
  try {
    console.log('[FIX] Attempting to call composioService.initiateConnection for app:', appKey);
    currentConnectionRequest = await composioService.initiateConnection(appKey);
    console.log('[FIX] Composio service initiateConnection RAW RESPONSE:', JSON.stringify(currentConnectionRequest, null, 2));
    return currentConnectionRequest;
  } catch (error) {
    console.error('[FIX] CRITICAL ERROR in composioService.initiateConnection call:', error);
    throw error; // Re-throw
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
