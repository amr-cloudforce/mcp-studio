/**
 * Smithery Marketplace Search Module
 * Handles search functionality for the marketplace
 */

let allItems = [];
let searchInput;
let resultsContainer;
let showResultsCallback;
let searchTimeout;

/**
 * Initialize search functionality
 * @param {Array} items - All items to search through
 * @param {HTMLElement} container - Container to show results in
 * @param {Function} callback - Callback to show search results
 */
export function initSearch(items, container, callback) {
  allItems = items || [];
  resultsContainer = container;
  showResultsCallback = callback;
  
  // Get search input
  searchInput = document.getElementById('smithery-marketplace-search-input');
  
  if (searchInput) {
    // Remove existing listeners
    searchInput.removeEventListener('input', handleSearchInput);
    
    // Add search listener
    searchInput.addEventListener('input', handleSearchInput);
    
    console.log('[DEBUG] Search initialized with', allItems.length, 'items');
  } else {
    console.error('Search input not found');
  }
}

/**
 * Handle search input
 * @param {Event} event - Input event
 */
function handleSearchInput(event) {
  const query = event.target.value.trim().toLowerCase();
  
  // Clear previous timeout
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
  
  // Debounce search
  searchTimeout = setTimeout(() => {
    performSearch(query);
  }, 300);
}

/**
 * Perform search
 * @param {string} query - Search query
 */
function performSearch(query) {
  if (!query) {
    // Show all items if query is empty
    if (showResultsCallback) {
      showResultsCallback(allItems);
    }
    return;
  }
  
  // Filter items based on query
  const filteredItems = allItems.filter(item => {
    const searchableText = [
      item.displayName || '',
      item.qualifiedName || '',
      item.name || '',
      item.description || ''
    ].join(' ').toLowerCase();
    
    return searchableText.includes(query);
  });
  
  console.log('[DEBUG] Search query:', query, 'Results:', filteredItems.length);
  
  // Show filtered results
  if (showResultsCallback) {
    showResultsCallback(filteredItems);
  }
}

/**
 * Clear search
 */
export function clearSearch() {
  if (searchInput) {
    searchInput.value = '';
  }
  
  if (showResultsCallback) {
    showResultsCallback(allItems);
  }
}
