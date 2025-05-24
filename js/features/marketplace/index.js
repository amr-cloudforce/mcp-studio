/**
 * Marketplace Module
 * Main entry point for the marketplace feature
 */

import * as data from './data.js';
import * as ui from './ui.js';

let prerequisites = {
  docker: false,
  nodejs: false
};

/**
 * Initialize the marketplace module
 */
export function initialize() {
  // Initialize UI
  ui.init();
  
  // Listen for prerequisites status updates
  window.addEventListener('message', event => {
    if (event.data.type === 'prerequisites-status') {
      prerequisites = {
        docker: event.data.data.docker,
        nodejs: event.data.data.nodejs
      };
    }
  });
  
  return this;
}

/**
 * Open the marketplace modal
 */
export async function openModal() {
  try {
    console.log('[MARKETPLACE DEBUG] Opening marketplace modal...');
    console.log('[MARKETPLACE DEBUG] Prerequisites:', prerequisites);
    
    // Load marketplace data
    console.log('[MARKETPLACE DEBUG] Loading marketplace data...');
    const items = await data.loadMarketplaceData();
    console.log('[MARKETPLACE DEBUG] Raw items loaded:', items);
    
    // Filter items based on prerequisites
    console.log('[MARKETPLACE DEBUG] Filtering items by prerequisites...');
    const filteredItems = data.filterByPrerequisites(items, prerequisites);
    console.log('[MARKETPLACE DEBUG] Filtered items:', filteredItems);
    console.log('[MARKETPLACE DEBUG] Available items count:', filteredItems.filter(item => item.available).length);
    
    // Open the marketplace modal
    console.log('[MARKETPLACE DEBUG] Opening UI modal...');
    ui.openModal(filteredItems);
  } catch (error) {
    console.error('[MARKETPLACE DEBUG] Failed to open marketplace:', error);
    alert('Failed to load marketplace data. Please try again later.' + error);
  }
}

// Create and export a singleton instance
const marketplace = {
  initialize,
  openModal
};

export default marketplace;
