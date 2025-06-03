/**
 * Apify Marketplace Items Module
 * Main entry point for item management
 */

import * as itemsCore from './items-core.js';
import * as itemsUI from './items-ui.js';

// Re-export core functions for backward compatibility
export const setAllItems = itemsCore.setAllItems;
export const getAllItems = itemsCore.getAllItems;
export const isActorSelected = itemsCore.isActorSelected;
export const getSelectedActors = itemsCore.getSelectedActors;
export const setInstalledFilter = itemsCore.setInstalledFilter;
export const showSearchResults = itemsCore.showSearchResults;

// Re-export UI functions
export const createItemElement = itemsUI.createItemElement;

/**
 * Show all items
 */
export function showAllItems() {
  const container = document.getElementById('apify-marketplace-items-container');
  
  // Clear items container
  container.innerHTML = '';
  
  console.log('[DEBUG] Showing all items:', itemsCore.getAllItems().length);
  
  // Filter for available items only
  const availableItems = itemsCore.getAllItems().filter(item => item.available);
  
  // Create items
  if (availableItems.length > 0) {
    availableItems.forEach(item => {
      const itemElement = itemsUI.createItemElement(item);
      container.appendChild(itemElement);
    });
  } else {
    // Show no items message
    const noItems = document.createElement('div');
    noItems.className = 'no-items';
    noItems.textContent = 'No available Apify actors';
    container.appendChild(noItems);
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
  const itemsContainer = document.getElementById('apify-marketplace-items-container');
  
  // If query is empty, show all items
  if (!query) {
    showAllItems();
    return;
  }
  
  // Filter items based on query
  const filteredItems = itemsCore.getAllItems().filter(item => {
    const itemName = (item.actor_name || item.repo_name || '').toLowerCase();
    const itemTitle = (item.actor_title || '').toLowerCase();
    const itemDesc = (item.actor_description || item.summary_200_words || '').toLowerCase();
    const itemUsername = (item.actor_username || '').toLowerCase();
    const itemCategories = (item.actor_categories || []).join(' ').toLowerCase();
    
    return itemName.includes(query) || 
           itemTitle.includes(query) ||
           itemDesc.includes(query) || 
           itemUsername.includes(query) ||
           itemCategories.includes(query);
  });
  
  // Clear the container
  itemsContainer.innerHTML = '';
  
  // Add filtered items to the container
  if (filteredItems.length > 0) {
    // Filter for available items only
    const availableItems = filteredItems.filter(item => item.available);
    
    if (availableItems.length > 0) {
      availableItems.forEach(item => {
        const itemElement = itemsUI.createItemElement(item, true);
        itemsContainer.appendChild(itemElement);
      });
    } else {
      // Show no results message
      const noResults = document.createElement('div');
      noResults.className = 'no-items';
      noResults.textContent = `No available actors matching "${query}"`;
      itemsContainer.appendChild(noResults);
    }
  } else {
    // Show no results message
    const noResults = document.createElement('div');
    noResults.id = 'apify-no-search-results-items';
    noResults.className = 'no-items';
    noResults.textContent = `No results found for "${query}"`;
    itemsContainer.appendChild(noResults);
  }
}
