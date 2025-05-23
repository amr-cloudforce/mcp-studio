/**
 * Marketplace Search Module
 * Handles search functionality
 */

import { filterCategories } from './categories.js';
import { filterItems, getAllItems } from './items.js';

/**
 * Initialize search functionality
 * @param {Array} allItems - All marketplace items
 * @param {HTMLElement} categoriesContainer - The categories container element
 * @param {Function} showSearchResults - Function to show search results
 */
export function initSearch(allItems, categoriesContainer, showSearchResults) {
  // Search input
  const searchInput = document.getElementById('marketplace-search-input');
  
  // Add input event listener
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    handleSearch(query, allItems, categoriesContainer, showSearchResults);
  });
  
  // Add a blur event to ensure search is properly applied when focus is lost
  searchInput.addEventListener('blur', () => {
    // Re-apply the current search to ensure consistent state
    const query = searchInput.value.toLowerCase();
    handleSearch(query, allItems, categoriesContainer, showSearchResults);
  });
}

/**
 * Handle search input
 * @param {string} query - Search query
 * @param {Array} allItems - All marketplace items (initial value, may be stale)
 * @param {HTMLElement} categoriesContainer - The categories container element
 * @param {Function} showSearchResults - Function to show search results
 */
function handleSearch(query, allItems, categoriesContainer, showSearchResults) {
  // Always use the latest items from the items module
  const latestItems = getAllItems();
  
  if (document.getElementById('marketplace-categories-view').style.display !== 'none') {
    filterCategories(query, latestItems, categoriesContainer, showSearchResults);
  } else {
    filterItems(query);
  }
}

/**
 * Reset search input
 */
export function resetSearch() {
  const searchInput = document.getElementById('marketplace-search-input');
  searchInput.value = '';
  searchInput.placeholder = 'Search all tools...';
}

/**
 * Update search placeholder
 * @param {string} placeholder - New placeholder text
 */
export function updateSearchPlaceholder(placeholder) {
  const searchInput = document.getElementById('marketplace-search-input');
  searchInput.placeholder = placeholder;
}

/**
 * Get current search query
 * @returns {string} - Current search query
 */
export function getCurrentSearchQuery() {
  const searchInput = document.getElementById('marketplace-search-input');
  return searchInput.value.toLowerCase();
}
