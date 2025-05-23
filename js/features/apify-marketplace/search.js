/**
 * Apify Marketplace Search Module
 * Handles search functionality for Apify marketplace
 */

import { filterItems, getAllItems } from './items.js';

/**
 * Initialize search functionality
 * @param {Array} allItems - All marketplace items
 * @param {HTMLElement} itemsContainer - The items container element
 * @param {Function} showSearchResults - Function to show search results
 */
export function initSearch(allItems, itemsContainer, showSearchResults) {
  // Search input
  const searchInput = document.getElementById('apify-marketplace-search-input');
  
  if (!searchInput) {
    console.error('Apify marketplace search input not found');
    return;
  }
  
  console.log('[DEBUG] Search initialized with', allItems.length, 'items');
  
  // Add input event listener
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    handleSearch(query, allItems, itemsContainer, showSearchResults);
  });
  
  // Add a blur event to ensure search is properly applied when focus is lost
  searchInput.addEventListener('blur', () => {
    // Re-apply the current search to ensure consistent state
    const query = searchInput.value.toLowerCase();
    handleSearch(query, allItems, itemsContainer, showSearchResults);
  });
}

/**
 * Handle search input
 * @param {string} query - Search query
 * @param {Array} allItems - All marketplace items (initial value, may be stale)
 * @param {HTMLElement} itemsContainer - The items container element
 * @param {Function} showSearchResults - Function to show search results
 */
function handleSearch(query, allItems, itemsContainer, showSearchResults) {
  // Always use the latest items from the items module
  const latestItems = getAllItems();
  
  // For Apify marketplace, we always filter items directly (no categories view)
  filterItems(query);
}

/**
 * Reset search input
 */
export function resetSearch() {
  const searchInput = document.getElementById('apify-marketplace-search-input');
  if (searchInput) {
    searchInput.value = '';
    searchInput.placeholder = 'Search Apify actors...';
  }
}

/**
 * Update search placeholder
 * @param {string} placeholder - New placeholder text
 */
export function updateSearchPlaceholder(placeholder) {
  const searchInput = document.getElementById('apify-marketplace-search-input');
  if (searchInput) {
    searchInput.placeholder = placeholder;
  }
}

/**
 * Get current search query
 * @returns {string} - Current search query
 */
export function getCurrentSearchQuery() {
  const searchInput = document.getElementById('apify-marketplace-search-input');
  return searchInput ? searchInput.value.toLowerCase() : '';
}
