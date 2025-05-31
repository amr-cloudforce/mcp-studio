/**
 * Smithery Service - API Credentials & Basic Fetch
 * Handles API key storage and basic fetch wrapper
 */

const { ipcRenderer } = require('electron');

let _apiKey = null;
let _profile = null;

/**
 * Initialize Smithery service with credentials
 * @param {string} apiKey - Smithery API key
 * @param {string} profile - Smithery profile name
 */
export function initializeSDK(apiKey, profile) {
  if (!apiKey || typeof apiKey !== 'string') {
    throw new Error('initializeSDK: apiKey (string) required');
  }
  if (!profile || typeof profile !== 'string') {
    throw new Error('initializeSDK: profile (string) required');
  }
  
  _apiKey = apiKey;
  _profile = profile;
}

/**
 * Get current credentials from storage
 * @returns {Promise<Object|null>} Current credentials or null if not found
 */
export async function getCredentials() {
  try {
    const credentials = await ipcRenderer.invoke('smithery-get-credentials');
    if (credentials && credentials.apiKey && credentials.profile) {
      _apiKey = credentials.apiKey;
      _profile = credentials.profile;
      return credentials;
    }
    return null;
  } catch (error) {
    console.error('Failed to get credentials:', error);
    return null;
  }
}

/**
 * Check if service is initialized
 * @returns {boolean} True if initialized
 */
export function isInitialized() {
  return _apiKey !== null && _profile !== null;
}

/**
 * Basic fetch wrapper with authentication
 * @param {string} url - API endpoint URL
 * @param {Object} options - Fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function authenticatedFetch(url, options = {}) {
  if (!isInitialized()) {
    // Try to get credentials from storage
    const credentials = await getCredentials();
    if (!credentials) {
      throw new Error('Service not initialized - credentials required');
    }
  }

  const headers = {
    'Authorization': `Bearer ${_apiKey}`,
    'Content-Type': 'application/json',
    ...options.headers
  };

  return fetch(url, {
    ...options,
    headers
  });
}
