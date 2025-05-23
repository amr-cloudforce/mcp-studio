/**
 * Composio Marketplace Items Module
 * Handles item listing and filtering
 */

import { getCategoryColor } from '../marketplace/colors.js';
import { getCategoryIcon } from '../marketplace/icons.js';
import { showDetailsView } from './modal.js';

// State variables
let currentCategory = null;
let allItems = [];

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
 * Create an item element
 * @param {Object} item - Composio marketplace item
 * @param {boolean} showCategory - Whether to show the category label
 * @returns {HTMLElement} - Item element wrapper
 */
export function createItemElement(item, showCategory = false) {
  // Create wrapper for consistent sizing
  const wrapper = document.createElement('div');
  wrapper.className = 'marketplace-item-wrapper';
  
  // Create the actual item element
  const itemElement = document.createElement('div');
  itemElement.className = `marketplace-item ${!item.available ? 'unavailable' : ''}`;
  itemElement.dataset.appKey = item.app_key;
  
  // Get category color for the label
  const categoryColor = getCategoryColor(item.category || 'Uncategorized');
  
  // Create item content
  itemElement.innerHTML = `
    <div class="item-header">
      <span class="server-type">${item.server_type ? item.server_type.toUpperCase() : 'UNKNOWN'}</span>
      ${showCategory ? `<span class="item-category" style="background: ${categoryColor}">${item.category || 'Uncategorized'}</span>` : ''}
    </div>
    <h3>${item.repo_name}</h3>
    <p>${item.summary_200_words ? item.summary_200_words.substring(0, 100) : 'No description available'}...</p>
    <div class="item-footer">
      <span class="stars">⭐ ${item.stars || 0}</span>
    </div>
    ${!item.available ? `<div class="unavailable-overlay">
      <span class="unavailable-reason">${item.unavailableReason}</span>
    </div>` : ''}
  `;
  
  // Add click event
  if (item.available) {
    itemElement.addEventListener('click', () => {
      showItemDetails(item);
    });
  }
  
  // Add the item to the wrapper
  wrapper.appendChild(itemElement);
  
  return wrapper;
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
  const categoryTitle = document.getElementById('composio-category-title');
  categoryTitle.textContent = category;
  
  // Apply category color to title
  const categoryColor = getCategoryColor(category);
  const categoryTitleContainer = document.querySelector('#composio-marketplace-modal .marketplace-category-title');
  categoryTitleContainer.style.borderBottom = `3px solid ${categoryColor}`;
  categoryTitleContainer.style.color = 'var(--text)';
  
  // Set the icon color to match the category
  setTimeout(() => {
    const titleIcon = categoryTitleContainer.querySelector('i');
    if (titleIcon) {
      titleIcon.style.color = categoryColor;
    }
  }, 0);
  
  // Get category icon
  const icon = getCategoryIcon(category);
  
  // Set the title text first
  categoryTitle.textContent = category;
  
  // Then prepend the icon to ensure proper rendering
  categoryTitle.innerHTML = icon + ' ' + categoryTitle.textContent;
  
  // Get the items container
  const itemsContainer = document.getElementById('composio-marketplace-items-container');
  
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
  document.getElementById('composio-marketplace-categories-view').style.display = 'none';
  document.getElementById('composio-marketplace-items-view').style.display = 'block';
  
  // Update search placeholder
  document.getElementById('composio-marketplace-search-input').placeholder = `Search in ${category}...`;
}

/**
 * Show search results as a list of items
 * @param {Array} items - Matching items
 * @param {string} query - Search query
 */
export function showSearchResults(items, query) {
  // Update category title
  const categoryTitle = document.getElementById('composio-category-title');
  categoryTitle.textContent = `Search Results: "${query}"`;
  
  // Apply styling to title
  const categoryTitleContainer = document.querySelector('#composio-marketplace-modal .marketplace-category-title');
  categoryTitleContainer.style.borderBottom = `3px solid var(--primary)`;
  categoryTitleContainer.style.color = 'var(--text)';
  
  // Get the items container
  const itemsContainer = document.getElementById('composio-marketplace-items-container');
  
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
  
  // Update back button text
  const backToCategoriesButton = document.getElementById('composio-back-to-categories');
  backToCategoriesButton.textContent = '← Back to categories';
  
  // Show items view (which now contains search results)
  document.getElementById('composio-marketplace-categories-view').style.display = 'none';
  document.getElementById('composio-marketplace-items-view').style.display = 'block';
  
  // Update search placeholder
  document.getElementById('composio-marketplace-search-input').placeholder = `Refine search...`;
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

/**
 * Show item details
 * @param {Object} item - Composio marketplace item
 */
function showItemDetails(item) {
  // Import the details module dynamically to avoid circular dependencies
  import('./details.js').then(detailsModule => {
    detailsModule.showItemDetails(item);
  });
}
