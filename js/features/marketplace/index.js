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
    // Load marketplace data
    const items = await data.loadMarketplaceData();
    
    // Filter items based on prerequisites
    const filteredItems = data.filterByPrerequisites(items, prerequisites);
    
    // Open the marketplace modal
    ui.openModal(filteredItems);
  } catch (error) {
    console.error('Failed to open marketplace:', error);
    alert('Failed to load marketplace data. Please try again later.' + error);
  }
}

// Create and export a singleton instance
const marketplace = {
  initialize,
  openModal
};

export default marketplace;
