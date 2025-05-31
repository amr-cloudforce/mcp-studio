/**
 * Marketplace UI Module
 * Handles rendering the marketplace UI
 */

import { groupByCategory } from './data.js';
import { filterByNPX, getFilterStats } from './filters.js';

// Import modular components
import * as modalModule from './modal.js';
import * as categoriesModule from './categories.js';
import * as itemsModule from './items.js';
import * as searchModule from './search.js';

// DOM element references
let marketplaceModal;
let categoriesContainer;
let backButton;
let backToCategoriesButton;
let allItems = [];
let showExperimental = false;

/**
 * Initialize the marketplace UI
 */
export function init() {
  // Create modal and get DOM references
  const domElements = modalModule.createModal();
  
  // Store DOM references
  marketplaceModal = domElements.marketplaceModal;
  categoriesContainer = domElements.categoriesContainer;
  backButton = domElements.backButton;
  backToCategoriesButton = domElements.backToCategoriesButton;
  
  // Set up event listeners
  setupEventListeners();
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Close button
  document.getElementById('marketplace-close').addEventListener('click', () => {
    modalModule.closeModal();
  });
  
  // Back to categories button
  backToCategoriesButton.addEventListener('click', () => {
    // Reset search input when going back to categories
    searchModule.resetSearch();
    showCategoriesView();
  });
  
  // Back to items button
  backButton.addEventListener('click', () => {
    showItemsView();
  });
  
  // Filter toggle
  document.addEventListener('change', (e) => {
    if (e.target.id === 'show-experimental') {
      showExperimental = e.target.checked;
      applyFilter();
    }
  });
}

/**
 * Show the categories view
 */
function showCategoriesView() {
  modalModule.showCategoriesView();
  itemsModule.setCurrentCategory(null);
}

/**
 * Show the items view
 */
function showItemsView() {
  modalModule.showItemsView();
}

/**
 * Populate the marketplace with categories
 * @param {Array} items - Marketplace items
 */
export function populateMarketplace(items) {
  // Store all items for later use
  itemsModule.setAllItems(items);
  
  // Populate categories
  categoriesModule.populateCategories(items, categoriesContainer, groupByCategory);
}

/**
 * Apply current filter to items
 */
function applyFilter() {
  const filteredItems = filterByNPX(allItems, showExperimental);
  
  // Update items module with filtered items
  itemsModule.setAllItems(filteredItems);
  
  // Refresh the display
  itemsModule.showAllItems();
  
  // Update search with filtered items
  searchModule.initSearch(
    filteredItems,
    document.getElementById('marketplace-items-container'),
    itemsModule.showSearchResults
  );
  
  // Update filter stats
  updateFilterStats();
}

/**
 * Update filter statistics display
 */
function updateFilterStats() {
  const stats = getFilterStats(allItems);
  const statsElement = document.getElementById('filter-stats');
  
  if (statsElement) {
    if (showExperimental) {
      statsElement.textContent = `(${stats.total} total)`;
    } else {
      statsElement.textContent = `(${stats.npx} NPX, ${stats.experimental} experimental)`;
    }
  }
}

/**
 * Open the marketplace modal
 * @param {Array} items - Marketplace items
 */
export function openModal(items) {
  console.log('[MARKETPLACE DEBUG] Opening modal with items:', items);
  console.log('[MARKETPLACE DEBUG] Number of items received:', items.length);
  
  // Store all items
  allItems = items;
  
  // Reset filter state
  showExperimental = false;
  const filterCheckbox = document.getElementById('show-experimental');
  if (filterCheckbox) {
    filterCheckbox.checked = false;
  }
  
  // Apply initial filter (NPX only)
  const filteredItems = filterByNPX(allItems, showExperimental);
  
  // Store filtered items for later use
  itemsModule.setAllItems(filteredItems);
  console.log('[MARKETPLACE DEBUG] Items stored in module');
  
  // Display filtered items
  console.log('[MARKETPLACE DEBUG] Calling showAllItems()');
  itemsModule.showAllItems();
  
  // Initialize search functionality with filtered items
  searchModule.initSearch(
    filteredItems,
    document.getElementById('marketplace-items-container'),
    itemsModule.showSearchResults
  );
  
  // Update filter stats
  updateFilterStats();
  
  // Show items view directly
  console.log('[MARKETPLACE DEBUG] Showing items view');
  showItemsView();
  
  // Show modal
  console.log('[MARKETPLACE DEBUG] Showing modal');
  modalModule.showModal(marketplaceModal);
}
