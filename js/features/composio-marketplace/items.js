/**
 * Composio Marketplace Items Module
 * Handles item listing and filtering
 */

import { getCategoryColor } from '../marketplace/colors.js';
import { getCategoryIcon } from '../marketplace/icons.js';
import { showDetailsView } from './modal.js';
import * as connector from './composio-connector.js';
import * as notifications from '../../ui/notifications-helper.js';

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
      <button class="btn btn-primary connect-btn">Connect</button>
    </div>
    ${!item.available ? `<div class="unavailable-overlay">
      <span class="unavailable-reason">${item.unavailableReason}</span>
    </div>` : ''}
  `;
  
  // Add click event for the item (show details)
  if (item.available) {
    const itemTitle = itemElement.querySelector('h3');
    const itemDesc = itemElement.querySelector('p');
    
    if (itemTitle) {
      itemTitle.addEventListener('click', () => {
        showItemDetails(item);
      });
    }
    
    if (itemDesc) {
      itemDesc.addEventListener('click', () => {
        showItemDetails(item);
      });
    }
    
    // Add click event for the connect button
    const connectBtn = itemElement.querySelector('.connect-btn');
    if (connectBtn) {
      connectBtn.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent item click
        connectToApp(item);
      });
    }
  }
  
  // Add the item to the wrapper
  wrapper.appendChild(itemElement);
  
  return wrapper;
}

/**
 * Connect to a Composio app
 * @param {Object} item - The Composio app item
 */
async function connectToApp(item) {
  try {
    // Get the connect button
    const connectBtn = event.target;
    const originalText = connectBtn.textContent;
    
    // Show loading state
    connectBtn.textContent = 'Connecting...';
    connectBtn.disabled = true;
    
    // Connect to the app
    const connection = await connector.connectToApp(item);
    
    // Handle connection response
    if (connection.redirectUrl) {
      // OAuth flow
      const confirmed = confirm(`OAuth authentication required for ${item.repo_name}. Open the authorization URL in a new tab?`);
      if (confirmed) {
        window.open(connection.redirectUrl, '_blank');
        alert('After completing the authorization, click "Connect" again to create the MCP server.');
      }
    } else if (connection.connectionStatus === 'ACTIVE') {
      // Connection is already active, create MCP server
      const serverName = `${item.repo_name.toLowerCase()}-mcp`;
      const mcpServer = await connector.createMcpServer(serverName);
      
      // Add MCP server to configuration
      await connector.addMcpServerToConfig(serverName, mcpServer);
      
      // Show success message
      notifications.showSuccess(`Successfully connected to ${item.repo_name} and created MCP server "${serverName}"`);
    } else {
      // Other status (like PENDING_PARAMS)
      notifications.showWarning(`Connection initiated with status: ${connection.connectionStatus}. Please check the connection details.`);
    }
    
    // Reset button
    connectBtn.textContent = originalText;
    connectBtn.disabled = false;
  } catch (error) {
    console.error('Error connecting to app:', error);
    notifications.showError(`Error connecting to ${item.repo_name}: ${error.message}`);
    
    // Reset button
    if (event && event.target) {
      const connectBtn = event.target;
      connectBtn.textContent = 'Connect';
      connectBtn.disabled = false;
    }
  }
}

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
  const categoryTitle = document.getElementById('composio-category-title');
  if (categoryTitle) {
    categoryTitle.textContent = category;
    
    // Apply category color to title
    const categoryColor = getCategoryColor(category);
    const categoryTitleContainer = document.querySelector('#composio-marketplace-modal .marketplace-category-title');
    if (categoryTitleContainer) {
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
    }
  }
  
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
  const categoryTitle = document.getElementById('composio-category-title');
  if (categoryTitle) {
    categoryTitle.textContent = `Search Results: "${query}"`;
    
    // Apply styling to title
    const categoryTitleContainer = document.querySelector('#composio-marketplace-modal .marketplace-category-title');
    if (categoryTitleContainer) {
      categoryTitleContainer.style.borderBottom = `3px solid var(--primary)`;
      categoryTitleContainer.style.color = 'var(--text)';
    }
  }
  
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
