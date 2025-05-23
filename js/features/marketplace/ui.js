/**
 * Marketplace UI Module
 * Handles rendering the marketplace UI
 */

import { groupByCategory } from './data.js';

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
 * Open the marketplace modal
 * @param {Array} items - Marketplace items
 */
export function openModal(items) {
  // Populate marketplace with categories
  populateMarketplace(items);
  
  // Initialize search functionality with the populated items
  searchModule.initSearch(
    itemsModule.getAllItems(),
    categoriesContainer,
    itemsModule.showSearchResults
  );
  
  // Show categories view
  showCategoriesView();
  
  // Show modal
  modalModule.showModal(marketplaceModal);
}
