/**
 * Apify Marketplace Items Core Module
 * Handles core item management functionality
 */

import * as connector from './connector.js';

// State variables
let allItems = [];
let selectedActors = new Set();
let showOnlyInstalled = false;

/**
 * Set all items
 * @param {Array} items - All Apify marketplace items
 */
export function setAllItems(items) {
  console.log('[DEBUG] Setting all items in items.js:', items);
  // Force all items to have available flag set to true
  allItems = items.map(item => ({
    ...item,
    available: true
  }));
  
  // Load selected actors from configuration
  loadSelectedActors();
}

/**
 * Get all items
 * @returns {Array} - All Apify marketplace items
 */
export function getAllItems() {
  return allItems;
}

/**
 * Load selected actors from server configuration
 */
async function loadSelectedActors() {
  try {
    const configuredActors = await connector.getConfiguredActors();
    selectedActors = new Set(configuredActors);
    console.log('[DEBUG] Loaded selected actors:', Array.from(selectedActors));
  } catch (error) {
    console.error('Failed to load selected actors:', error);
    selectedActors = new Set();
  }
}

/**
 * Check if an actor is selected
 * @param {string} actorId - Actor ID to check
 * @returns {boolean} - True if selected
 */
export function isActorSelected(actorId) {
  return selectedActors.has(actorId);
}

/**
 * Get all selected actors
 * @returns {Array} - Array of selected actor IDs
 */
export function getSelectedActors() {
  return Array.from(selectedActors);
}

/**
 * Set filter for installed actors
 * @param {boolean} showInstalled - Whether to show only installed actors
 */
export function setInstalledFilter(showInstalled) {
  console.log('[DEBUG] Apify filter toggled:', showInstalled);
  console.log('[DEBUG] Selected actors:', Array.from(selectedActors));
  showOnlyInstalled = showInstalled;
  applyFilters();
}

/**
 * Apply current filters to the items
 */
function applyFilters() {
  let items = allItems;
  
  if (showOnlyInstalled) {
    items = items.filter(item => selectedActors.has(item.actor_id));
  }
  
  console.log('[DEBUG] Filtered items count:', items.length);
  showFilteredItems(items);
}

/**
 * Show filtered items
 * @param {Array} items - Filtered items to display
 */
function showFilteredItems(items) {
  const itemsContainer = document.getElementById('apify-marketplace-items-container');
  
  // Clear items container
  itemsContainer.innerHTML = '';
  
  // Filter for available items only
  const availableItems = items.filter(item => item.available);
  
  // Create items
  if (availableItems.length > 0) {
    // Import createItemElement dynamically to avoid circular dependency
    import('./items-ui.js').then(itemsUI => {
      availableItems.forEach(item => {
        const itemElement = itemsUI.createItemElement(item);
        itemsContainer.appendChild(itemElement);
      });
    });
  } else {
    // Show no items message
    const noItems = document.createElement('div');
    noItems.className = 'no-items';
    noItems.textContent = showOnlyInstalled ? 'No installed Apify actors' : 'No available Apify actors';
    itemsContainer.appendChild(noItems);
  }
}

/**
 * Toggle actor selection
 * @param {string} actorId - Actor ID to toggle
 * @param {HTMLElement} button - Button element
 */
export async function toggleActor(actorId, button) {
  console.log('[DEBUG] toggleActor called with actorId:', actorId);
  const isSelected = selectedActors.has(actorId);
  
  try {
    button.disabled = true;
    button.textContent = isSelected ? 'Removing...' : 'Adding...';
    
    let success;
    if (isSelected) {
      success = await connector.removeActor(actorId);
      if (success) {
        selectedActors.delete(actorId);
      }
    } else {
      success = await connector.addActor(actorId);
      if (success) {
        selectedActors.add(actorId);
      }
    }
    
    if (success) {
      // Update the UI
      updateItemUI(actorId);
      
      // Show success message
      const action = isSelected ? 'removed from' : 'added to';
      console.log(`[DEBUG] Actor ${actorId} ${action} server configuration`);
    } else {
      alert(`Failed to ${isSelected ? 'remove' : 'add'} actor. Please try again.`);
    }
  } catch (error) {
    console.error('Failed to toggle actor:', error);
    alert(`Failed to ${isSelected ? 'remove' : 'add'} actor. Please try again.`);
  } finally {
    button.disabled = false;
    // Reset button text
    const newIsSelected = selectedActors.has(actorId);
    button.textContent = newIsSelected ? 'Remove' : 'Add';
  }
}

/**
 * Update the UI for a specific item
 * @param {string} actorId - Actor ID to update
 */
function updateItemUI(actorId) {
  const itemElement = document.querySelector(`[data-actor-id="${actorId}"]`);
  if (!itemElement) return;
  
  const isSelected = selectedActors.has(actorId);
  const button = itemElement.querySelector('.add-remove-btn');
  
  if (isSelected) {
    itemElement.classList.add('selected');
    button.textContent = 'Remove';
    button.className = 'btn btn-danger add-remove-btn';
  } else {
    itemElement.classList.remove('selected');
    button.textContent = 'Add';
    button.className = 'btn btn-primary add-remove-btn';
  }
}

/**
 * Show search results as a list of items
 * @param {Array} items - Matching items
 * @param {string} query - Search query
 */
export function showSearchResults(items, query) {
  // Apply installed filter if active
  let filteredItems = items;
  if (showOnlyInstalled) {
    filteredItems = items.filter(item => selectedActors.has(item.actor_id));
  }
  
  const itemsContainer = document.getElementById('apify-marketplace-items-container');
  
  // Clear items container
  itemsContainer.innerHTML = '';
  
  // Filter for available items only
  const availableItems = filteredItems.filter(item => item.available);
  
  // Create items with category labels
  if (availableItems.length > 0) {
    // Import createItemElement dynamically to avoid circular dependency
    import('./items-ui.js').then(itemsUI => {
      availableItems.forEach(item => {
        const itemElement = itemsUI.createItemElement(item, true);
        itemsContainer.appendChild(itemElement);
      });
    });
  } else {
    // Show no results message
    const noResults = document.createElement('div');
    noResults.className = 'no-items';
    noResults.id = 'apify-no-search-results';
    noResults.textContent = showOnlyInstalled ? 
      `No installed actors matching "${query}"` : 
      `No available actors matching "${query}"`;
    itemsContainer.appendChild(noResults);
  }
}
