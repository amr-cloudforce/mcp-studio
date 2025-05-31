/**
 * Smithery API - Server Listing & Details
 * Handles API calls to Smithery registry
 */

import { authenticatedFetch } from './smithery-service.js';

const BASE_URL = 'https://registry.smithery.ai';

/**
 * List servers from Smithery registry
 * @param {Object} options - Query options
 * @param {number} options.page - Page number (default: 1)
 * @param {number} options.pageSize - Page size (default: 100)
 * @param {string} options.q - Search query
 * @returns {Promise<Object>} Server list with pagination
 */
export async function listServers(options = {}) {
  const { page = 1, pageSize = 100, q } = options;
  
  const params = new URLSearchParams();
  params.append('page', page.toString());
  params.append('pageSize', pageSize.toString());
  
  if (q) {
    params.append('q', q);
  }
  
  const url = `${BASE_URL}/servers?${params.toString()}`;
  console.log(`[DEBUG] Fetching servers from: ${url}`);
  
  const response = await authenticatedFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to list servers: ${response.status} ${response.statusText}`);
  }
  
  const result = await response.json();
  console.log(`[DEBUG] API returned ${result.servers?.length || 0} servers, requested pageSize: ${pageSize}`);
  
  return result;
}

/**
 * Get detailed server information
 * @param {string} qualifiedName - Server qualified name (e.g., "@jlia0/servers")
 * @returns {Promise<Object>} Server details including connections and tools
 */
export async function getServerDetails(qualifiedName) {
  if (!qualifiedName) {
    throw new Error('getServerDetails: qualifiedName required');
  }
  
  const url = `${BASE_URL}/servers/${encodeURIComponent(qualifiedName)}`;
  const response = await authenticatedFetch(url);
  
  if (!response.ok) {
    throw new Error(`Failed to get server details: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
}

/**
 * Search servers with real-time query
 * @param {string} query - Search query
 * @param {number} pageSize - Number of results (default: 20)
 * @returns {Promise<Object>} Search results
 */
export async function searchServers(query, pageSize = 20) {
  if (!query || query.trim() === '') {
    return { servers: [], pagination: { totalCount: 0 } };
  }
  
  return listServers({ q: query.trim(), pageSize, page: 1 });
}

/**
 * Validate credentials by making a test API call
 * @returns {Promise<boolean>} True if credentials are valid
 */
export async function validateCredentials() {
  try {
    const result = await listServers({ pageSize: 1 });
    return result && typeof result === 'object';
  } catch (error) {
    console.error('Credential validation failed:', error);
    return false;
  }
}
