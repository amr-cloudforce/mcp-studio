/**
 * Smithery Marketplace UI Module
 * Handles rendering the Smithery marketplace UI
 */

// Import modular components
import * as modalModule from './modal.js';
import * as itemsModule from './items.js';
import * as searchModule from './search.js';

// DOM element references
let marketplaceModal;
let backButton;

/**
 * Initialize the Smithery marketplace UI
 */
export function init() {
  // Create modal and get DOM references
  const domElements = modalModule.createModal();
  
  // Store DOM references
  marketplaceModal = domElements.marketplaceModal;
  backButton = domElements.backButton;
  
  // Set up event listeners
  setupEventListeners();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Close button
  const closeButton = document.getElementById('smithery-marketplace-close');
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      modalModule.closeModal();
    });
  }
  
  // Back to items button
  if (backButton) {
    backButton.addEventListener('click', () => {
      showItemsView();
    });
  }
  
  // Back to marketplace button (from details view)
  const backToMarketplaceButton = document.getElementById('smithery-back-to-marketplace');
  if (backToMarketplaceButton) {
    backToMarketplaceButton.addEventListener('click', () => {
      showItemsView();
    });
  }
  
  // API Key Settings button
  const apiKeySettingsButton = document.getElementById('smithery-api-key-settings');
  if (apiKeySettingsButton) {
    apiKeySettingsButton.addEventListener('click', () => {
      modalModule.showApiKeyForm();
    });
  }
}

/**
 * Show the items view
 */
function showItemsView() {
  modalModule.showItemsView();
}

/**
 * Populate the Smithery marketplace with items
 * @param {Array} items - Smithery marketplace items
 */
export function populateMarketplace(items) {
  console.log('[DEBUG] Populating marketplace with items:', items);
  
  // Store all items for later use
  itemsModule.setAllItems(items);
  
  // Display all items directly
  itemsModule.showAllItems();
}

/**
 * Open the Smithery marketplace modal
 * @param {Array} items - Smithery marketplace items
 */
export function openModal(items) {
  console.log('[DEBUG] Opening modal with items:', items);
  
  // Populate marketplace with items directly
  populateMarketplace(items);
  
  // Get all items after they've been stored
  const allItems = itemsModule.getAllItems();
  console.log('[DEBUG] All items retrieved from itemsModule:', allItems);
  
  // Initialize search functionality with the populated items
  searchModule.initSearch(
    allItems,
    document.getElementById('smithery-marketplace-items-container'),
    itemsModule.showSearchResults
  );
  
  // Show items view directly
  modalModule.showItemsView();
  
  // Show modal
  modalModule.showModal(marketplaceModal);
}
