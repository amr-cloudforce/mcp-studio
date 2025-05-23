/**
 * Composio Marketplace Module
 * Main entry point for the Composio apps marketplace feature
 */

import * as data from './data.js';
import * as ui from './ui.js';

let prerequisites = {
  docker: false,
  nodejs: false
};

/**
 * Initialize the Composio marketplace module
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
 * Open the Composio marketplace modal
 */
export async function openModal() {
  try {
    // Load Composio apps data
    const items = await data.loadComposioApps();
    
    // Filter items based on prerequisites
    const filteredItems = data.filterByPrerequisites(items, prerequisites);
    
    // Open the marketplace modal
    ui.openModal(filteredItems);
  } catch (error) {
    console.error('Failed to open Composio marketplace:', error);
    alert('Failed to load Composio apps data. Please try again later.' + error);
  }
}

// Create and export a singleton instance
const composioMarketplace = {
  initialize,
  openModal
};

export default composioMarketplace;
