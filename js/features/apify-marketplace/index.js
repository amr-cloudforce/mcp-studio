/**
 * Apify Marketplace Module
 * Main entry point for the Apify actors marketplace feature
 */

import * as data from './data.js';
import * as ui from './ui.js';

/**
 * Initialize the Apify marketplace module
 */
export function initialize() {
  // Initialize UI
  ui.init();
  
  return this;
}

/**
 * Open the Apify marketplace modal
 */
export async function openModal() {
  try {
    console.log('[DEBUG] Opening Apify marketplace modal');
    
    // Load Apify actors data
    console.log('[DEBUG] Loading Apify actors data');
    const items = await data.loadApifyActors();
    console.log('[DEBUG] Loaded Apify actors data:', items);
    
    // Force all items to have "Apify Actors" category
    const apifyItems = items.map(item => ({
      ...item,
      category: 'Apify Actors'
    }));
    
    // Open the marketplace modal
    console.log('[DEBUG] Opening marketplace modal with Apify items');
    ui.openModal(apifyItems);
  } catch (error) {
    console.error('Failed to open Apify marketplace:', error);
    alert('Failed to load Apify actors data. Please try again later.' + error);
  }
}

// Create and export a singleton instance
const apifyMarketplace = {
  initialize,
  openModal
};

export default apifyMarketplace;
