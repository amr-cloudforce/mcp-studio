/**
 * Smithery Marketplace Module
 * Main entry point for the Smithery marketplace feature
 */

import * as ui from './ui.js';

/**
 * Initialize the Smithery marketplace module
 */
export function initialize() {
  // Initialize UI
  ui.init();
  
  return this;
}

/**
 * Open the Smithery marketplace modal
 */
export async function openModal() {
  try {
    console.log('[DEBUG] Opening Smithery marketplace modal');
    
    // Load Smithery servers data
    console.log('[DEBUG] Loading Smithery servers data');
    const items = await loadSmitheryServers();
    console.log('[DEBUG] Loaded Smithery servers data:', items);
    
    // Force all items to have "Smithery Servers" category
    const smitheryItems = items.map(item => ({
      ...item,
      category: 'Smithery Servers'
    }));
    
    // Open the marketplace modal
    console.log('[DEBUG] Opening marketplace modal with Smithery items');
    ui.openModal(smitheryItems);
  } catch (error) {
    console.error('Failed to open Smithery marketplace:', error);
    alert('Failed to load Smithery servers data. Please try again later.' + error);
  }
}

/**
 * Load Smithery servers from API
 * @returns {Promise<Array>} Array of server items
 */
async function loadSmitheryServers() {
  // Import service module to check credentials first
  const service = await import('./smithery-service.js');
  
  try {
    // Check if credentials exist first
    const credentials = await service.getCredentials();
    
    if (!credentials || !credentials.apiKey || !credentials.profile) {
      console.warn('No Smithery credentials found. Please set credentials to access Smithery servers.');
      return [];
    }
    
    // Initialize service with credentials
    service.initializeSDK(credentials.apiKey, credentials.profile);
    
    // Import API module and load servers
    const api = await import('./smithery-api.js');
    const result = await api.listServers({ pageSize: 100 });
    return result.servers || [];
  } catch (error) {
    console.error('Failed to load Smithery servers:', error);
    // Return empty array instead of throwing - let modal handle the error
    return [];
  }
}

// Create and export a singleton instance
const smitheryMarketplace = {
  initialize,
  openModal
};

export default smitheryMarketplace;
