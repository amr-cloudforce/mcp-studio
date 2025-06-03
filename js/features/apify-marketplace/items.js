/**
 * Apify Marketplace Items Module
 * Handles item listing and filtering
 */

import { showDetailsView } from './modal.js';
import * as connector from './connector.js';

// State variables
let currentCategory = null;
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
 * Create an item element
 * @param {Object} item - Apify marketplace item
 * @param {boolean} showCategory - Whether to show the category label
 * @returns {HTMLElement} - Item element wrapper
 */
export function createItemElement(item, showCategory = false) {
  // Create wrapper for consistent sizing
  const wrapper = document.createElement('div');
  wrapper.className = 'marketplace-item-wrapper';
  
  // Create the actual item element
  const itemElement = document.createElement('div');
  const isSelected = selectedActors.has(item.actor_id);
  const isInstalled = selectedActors.has(item.actor_id); // For Apify, selected = installed
  itemElement.className = `marketplace-item ${!item.available ? 'unavailable' : ''} ${isSelected ? 'selected' : ''}`;
  itemElement.dataset.actorId = item.actor_id;
  
  // Create documentation URL for Apify
  const docUrl = `https://apify.com/${item.actor_id}`;
  
  // Create item content
  itemElement.innerHTML = `
    <div class="doc-link" data-url="${docUrl}">
      📖 Documentation ↗️
    </div>
    <div class="item-header">
      <span class="server-type">${item.server_type ? item.server_type.toUpperCase() : 'APIFY'}</span>
      ${showCategory ? `<span class="item-category">${item.category || 'Apify Actors'}</span>` : ''}
    </div>
    <div class="item-title-row">
      <h3>${item.actor_title || item.actor_name || item.repo_name}${isInstalled ? '<span class="installed-badge">✓ Installed</span>' : ''}</h3>
    </div>
    <p>${item.actor_description || item.summary_200_words ? (item.actor_description || item.summary_200_words).substring(0, 100) : 'No description available'}...</p>
    <div class="item-footer">
      <span class="stars">⭐ ${item.stars || 0}</span>
      <span class="author">by ${item.actor_username || 'Unknown'}</span>
    </div>
    <div class="marketplace-item-actions">
      <button  style="display:none" class="btn btn-primary view-details-btn" data-actor="${item.actor_id}">
        Details
      </button>
      <button class="btn ${isSelected ? 'btn-danger' : 'btn-primary'} add-remove-btn" data-actor-id="${item.actor_id}">
        ${isSelected ? 'Remove' : 'Add'}
      </button>
    </div>
    ${!item.available ? `<div class="unavailable-overlay">
      <span class="unavailable-reason">${item.unavailableReason}</span>
    </div>` : ''}
  `;
  
  // Add click event for buttons
  if (item.available) {
    // Details button
    const detailsBtn = itemElement.querySelector('.view-details-btn');
    if (detailsBtn) {
      detailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showItemDetails(item);
      });
    }
    
    // Add/Remove button
    const addRemoveBtn = itemElement.querySelector('.add-remove-btn');
    if (addRemoveBtn) {
      addRemoveBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await toggleActor(item.actor_id, addRemoveBtn);
      });
    }
  }
  
  // Add click event for documentation link
  const docLink = itemElement.querySelector('.doc-link');
  if (docLink) {
    docLink.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = docLink.dataset.url;
      if (url) {
        require('electron').ipcRenderer.invoke('open-url', url);
      }
    });
  }
  
  // Add the item to the wrapper
  wrapper.appendChild(itemElement);
  
  return wrapper;
}

/**
 * Show all items
 */
export function showAllItems() {
  // Get the items container
  const itemsContainer = document.getElementById('apify-marketplace-items-container');
  
  // Clear items container
  itemsContainer.innerHTML = '';
  
  console.log('[DEBUG] Showing all items:', allItems.length);
  
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
    noItems.textContent = 'No available Apify actors';
    itemsContainer.appendChild(noItems);
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
  const filteredItems = allItems.filter(item => {
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
        const itemElement = createItemElement(item, true);
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

/**
 * Toggle actor selection
 * @param {string} actorId - Actor ID to toggle
 * @param {HTMLElement} button - Button element
 */
async function toggleActor(actorId, button) {
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
 * Show item details
 * @param {Object} item - Apify marketplace item
 */
function showItemDetails(item) {
  // Import the details module dynamically to avoid circular dependencies
  import('./details.js').then(detailsModule => {
    detailsModule.showItemDetails(item);
  });
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
    availableItems.forEach(item => {
      const itemElement = createItemElement(item);
      itemsContainer.appendChild(itemElement);
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
    availableItems.forEach(item => {
      const itemElement = createItemElement(item, true);
      itemsContainer.appendChild(itemElement);
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
