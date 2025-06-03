/**
 * Composio Marketplace Items Module
 * Handles item listing and filtering logic
 */

import { createItemElement, showFilteredItems, updateCategoryTitle } from './items-ui.js';
import * as connector from './composio-connector.js';

// State variables
let currentCategory = null;
let allItems = [];
let filteredItems = [];
let showOnlyInstalled = false;

/**
 * Set all items
 * @param {Array} items - All Composio marketplace items
 */
export function setAllItems(items) {
  console.log('[DEBUG] Setting all items in items.js:', items);
  // Force all items to have available flag set to true
  allItems = items.map(item => ({
    ...item,
    available: true
  }));
}

/**
 * Get all items
 * @returns {Array} - All Composio marketplace items
 */
export function getAllItems() {
  return allItems;
}

/**
 * Set current category
 * @param {string} category - Category name
 */
export function setCurrentCategory(category) {
  currentCategory = category;
}

/**
 * Get current category
 * @returns {string} - Current category
 */
export function getCurrentCategory() {
  return currentCategory;
}

/**
 * Set filter for installed apps
 * @param {boolean} showInstalled - Whether to show only installed apps
 */
export function setInstalledFilter(showInstalled) {
  showOnlyInstalled = showInstalled;
  applyFilters();
}

/**
 * Apply current filters to the items
 */
function applyFilters() {
  console.log('[DEBUG] Composio applyFilters called, showOnlyInstalled:', showOnlyInstalled);
  let items = allItems;
  
  if (showOnlyInstalled) {
    const installedApps = connector.getInstalledComposioServers();
    console.log('[DEBUG] Installed Composio apps:', installedApps);
    items = items.filter(item => 
      installedApps.includes(item.app_key)
    );
  }
  
  console.log('[DEBUG] Filtered Composio items count:', items.length);
  filteredItems = items;
  showFilteredItems(filteredItems, showOnlyInstalled);
}

/**
 * Create an item element (re-exported from UI module)
 */
export { createItemElement };

/**
 * Show all items
 */
export function showAllItems() {
  setCurrentCategory(null);
  
  // Get the items container
  const itemsContainer = document.getElementById('composio-marketplace-items-container');
  
  // Clear items container
  itemsContainer.innerHTML = '';
  
  // Filter for available items only
  const availableItems = allItems.filter(item => item.available);
  
  // Create items
  if (availableItems.length > 0) {
    availableItems.forEach(item => {
      const itemElement = createItemElement(item);
      itemsContainer.appendChild(itemElement);
    });
  } else {
    // Show no items message
    const noItems = document.createElement('div');
    noItems.className = 'no-items';
    noItems.textContent = 'No available Composio apps';
    itemsContainer.appendChild(noItems);
  }
}

/**
 * Show items for a specific category
 * @param {string} category - Category name
 */
export function showItemsForCategory(category) {
  setCurrentCategory(category);
  
  // Filter items by category
  const categoryItems = allItems.filter(item => (item.category || 'Uncategorized') === category);
  
  // Update category title
  updateCategoryTitle(category, category, false);
  
  // Get the items container
  const itemsContainer = document.getElementById('composio-marketplace-items-container');
  if (!itemsContainer) return;
  
  // Clear items container
  itemsContainer.innerHTML = '';
  
  // Filter for available items only
  const availableItems = categoryItems.filter(item => item.available);
  
  // Create items
  if (availableItems.length > 0) {
    availableItems.forEach(item => {
      const itemElement = createItemElement(item);
      itemsContainer.appendChild(itemElement);
    });
  } else {
    // Show no items message
    const noItems = document.createElement('div');
    noItems.className = 'no-items';
    noItems.textContent = `No available items in ${category}`;
    itemsContainer.appendChild(noItems);
  }
  
  // Show items view
  const itemsView = document.getElementById('composio-marketplace-items-view');
  if (itemsView) {
    itemsView.style.display = 'block';
  }
  
  // Update search placeholder
  const searchInput = document.getElementById('composio-marketplace-search-input');
  if (searchInput) {
    searchInput.placeholder = `Search in ${category}...`;
  }
}

/**
 * Show search results as a list of items
 * @param {Array} items - Matching items
 * @param {string} query - Search query
 */
export function showSearchResults(items, query) {
  // Update category title
  updateCategoryTitle(`Search Results: "${query}"`, null, true);
  
  // Get the items container
  const itemsContainer = document.getElementById('composio-marketplace-items-container');
  if (!itemsContainer) return;
  
  // Clear items container
  itemsContainer.innerHTML = '';
  
  // Filter for available items only
  const availableItems = items.filter(item => item.available);
  
  // Create items with category labels
  if (availableItems.length > 0) {
    availableItems.forEach(item => {
      const itemElement = createItemElement(item, true);
      itemsContainer.appendChild(itemElement);
    });
  } else {
    // Show no results message
    const noResults = document.createElement('div');
    noResults.className = 'no-items';
    noResults.id = 'composio-no-search-results';
    noResults.textContent = `No available items matching "${query}"`;
    itemsContainer.appendChild(noResults);
  }
  
  // Show items view (which now contains search results)
  const itemsView = document.getElementById('composio-marketplace-items-view');
  if (itemsView) {
    itemsView.style.display = 'block';
  }
  
  // Update search placeholder
  const searchInput = document.getElementById('composio-marketplace-search-input');
  if (searchInput) {
    searchInput.placeholder = `Refine search...`;
  }
}

/**
 * Filter items based on search query
 * @param {string} query - Search query
 */
export function filterItems(query) {
  // Normalize query
  query = query.trim().toLowerCase();
  
  // Get the items container
  const itemsContainer = document.getElementById('composio-marketplace-items-container');
  
  // Get the current category items
  let categoryItems = [];
  if (currentCategory) {
    categoryItems = allItems.filter(item => (item.category || 'Uncategorized') === currentCategory);
  } else {
    // If we're in search results view, use all items
    categoryItems = allItems;
  }
  
  // If query is empty, show all items for the current category or search
  if (!query) {
    // Clear the container
    itemsContainer.innerHTML = '';
    
    // Show all items for the current category or search
    if (categoryItems.length > 0) {
      // Filter for available items only
      const availableItems = categoryItems.filter(item => item.available);
      
      if (availableItems.length > 0) {
        availableItems.forEach(item => {
          const itemElement = createItemElement(item, !currentCategory);
          itemsContainer.appendChild(itemElement);
        });
      } else {
        // Show no items message
        const noItems = document.createElement('div');
        noItems.className = 'no-items';
        noItems.textContent = currentCategory ? 
          `No available items in ${currentCategory}` : 
          'No available items';
        itemsContainer.appendChild(noItems);
      }
    }
    
    return;
  }
  
  // Filter items based on query
  const filteredItems = categoryItems.filter(item => {
    const itemName = item.repo_name.toLowerCase();
    const itemDesc = (item.summary_200_words || '').toLowerCase();
    const itemType = (item.server_type || '').toLowerCase();
    const itemCategory = (item.category || 'Uncategorized').toLowerCase();
    
    return itemName.includes(query) || 
           itemDesc.includes(query) || 
           itemType.includes(query) ||
           itemCategory.includes(query);
  });
  
  // Clear the container
  itemsContainer.innerHTML = '';
  
  // Add filtered items to the container
  if (filteredItems.length > 0) {
    // Filter for available items only
    const availableItems = filteredItems.filter(item => item.available);
    
    if (availableItems.length > 0) {
      availableItems.forEach(item => {
        const itemElement = createItemElement(item, !currentCategory);
        itemsContainer.appendChild(itemElement);
      });
    } else {
      // Show no results message
      const noResults = document.createElement('div');
      noResults.id = 'composio-no-search-results-items';
      noResults.className = 'no-items';
      noResults.textContent = `No available items matching "${query}"`;
      itemsContainer.appendChild(noResults);
    }
  } else {
    // Show no results message
    const noResults = document.createElement('div');
    noResults.id = 'composio-no-search-results-items';
    noResults.className = 'no-items';
    noResults.textContent = `No results found for "${query}"`;
    itemsContainer.appendChild(noResults);
  }
}
