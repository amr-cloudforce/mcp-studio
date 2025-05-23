/**
 * Composio Marketplace UI Module
 * Handles rendering the Composio marketplace UI
 */

import { groupByCategory } from './data.js';

// Import modular components
import * as modalModule from './modal.js';
import * as categoriesModule from '../marketplace/categories.js';
import * as itemsModule from './items.js';
import * as searchModule from '../marketplace/search.js';

// DOM element references
let marketplaceModal;
let categoriesContainer;
let backButton;
let backToCategoriesButton;

/**
 * Initialize the Composio marketplace UI
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
  document.getElementById('composio-marketplace-close').addEventListener('click', () => {
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
  
  // API Key Settings button
  document.getElementById('composio-api-key-settings').addEventListener('click', () => {
    modalModule.showApiKeyForm();
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
 * Populate the Composio marketplace with categories
 * @param {Array} items - Composio marketplace items
 */
export function populateMarketplace(items) {
  // Store all items for later use
  itemsModule.setAllItems(items);
  
  // Populate categories
  categoriesModule.populateCategories(items, categoriesContainer, groupByCategory);
}

/**
 * Open the Composio marketplace modal
 * @param {Array} items - Composio marketplace items
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
