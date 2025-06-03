/**
 * Composio Marketplace Items UI Module
 * Handles UI rendering for marketplace items
 */

import { getCategoryColor } from '../marketplace/colors.js';
import { getCategoryIcon } from '../marketplace/icons.js';
import * as connector from './composio-connector.js';

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
  const isInstalled = connector.isComposioServerInstalled(item.app_key);
  
  // Create toolkit logo HTML
  const logoHtml = item.toolkit_logo ? 
    `<img src="${item.toolkit_logo}" alt="${item.toolkit_name || 'Toolkit'} logo" class="toolkit-logo" onerror="this.style.display='none'">` : 
    '';
  
  // Create item content with toolkit logo
  itemElement.innerHTML = `
    <div class="item-header">
      <span class="server-type">${item.server_type ? item.server_type.toUpperCase() : 'UNKNOWN'}</span>
      ${showCategory ? `<span class="item-category" style="background: ${categoryColor}">${item.category || 'Uncategorized'}</span>` : ''}
    </div>
    <div class="item-title-row">
      ${logoHtml}
      <h3>
        ${item.repo_name}
        ${isInstalled ? '<span class="installed-badge">✓ Installed</span>' : ''}
      </h3>
    </div>
    <p>${item.summary_200_words ? item.summary_200_words.substring(0, 100) : 'No description available'}...</p>
    <div class="item-footer">
      <span class="stars">⭐ ${item.stars || 0}</span>
      ${item.tools_count ? `<span class="toolkit-name">${item.tools_count} tools</span>` : ''}
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
  }
  
  // Add the item to the wrapper
  wrapper.appendChild(itemElement);
  
  return wrapper;
}

/**
 * Show filtered items
 * @param {Array} items - Filtered items to display
 * @param {boolean} showOnlyInstalled - Whether showing only installed items
 */
export function showFilteredItems(items, showOnlyInstalled = false) {
  const itemsContainer = document.getElementById('composio-marketplace-items-container');
  if (!itemsContainer) return;
  
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
    noItems.textContent = showOnlyInstalled ? 'No installed Composio apps found' : 'No available Composio apps';
    itemsContainer.appendChild(noItems);
  }
}

/**
 * Update category title and styling
 * @param {string} title - Title text
 * @param {string} category - Category name (optional)
 * @param {boolean} isSearch - Whether this is a search results view
 */
export function updateCategoryTitle(title, category = null, isSearch = false) {
  const categoryTitle = document.getElementById('composio-category-title');
  if (!categoryTitle) return;
  
  categoryTitle.textContent = title;
  
  // Apply category color to title
  const categoryColor = isSearch ? 'var(--primary)' : getCategoryColor(category || 'Uncategorized');
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
    
    if (category && !isSearch) {
      // Get category icon
      const icon = getCategoryIcon(category);
      
      // Set the title text first
      categoryTitle.textContent = title;
      
      // Then prepend the icon to ensure proper rendering
      categoryTitle.innerHTML = icon + ' ' + categoryTitle.textContent;
    }
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
