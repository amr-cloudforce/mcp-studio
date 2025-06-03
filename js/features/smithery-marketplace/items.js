/**
 * Smithery Marketplace Items Module
 * Handles rendering and managing marketplace items
 */

import * as connector from './smithery-connector.js';

let allItems = [];
let filteredItems = [];
let showOnlyInstalled = false;

/**
 * Set all items for the marketplace
 * @param {Array} items - Array of marketplace items
 */
export function setAllItems(items) {
  allItems = items || [];
}

/**
 * Get all items
 * @returns {Array} All marketplace items
 */
export function getAllItems() {
  return allItems;
}

/**
 * Show all items in the marketplace
 */
export function showAllItems() {
  const container = document.getElementById('smithery-marketplace-items-container');
  if (!container) {
    console.error('Items container not found');
    return;
  }
  
  renderItems(allItems, container);
}

/**
 * Set filter for installed servers
 * @param {boolean} showInstalled - Whether to show only installed servers
 */
export function setInstalledFilter(showInstalled) {
  showOnlyInstalled = showInstalled;
  applyFilters();
}

/**
 * Apply current filters to the items
 */
function applyFilters() {
  let items = allItems;
  
  if (showOnlyInstalled) {
    const installedServers = connector.getInstalledSmitheryServers();
    items = items.filter(item => 
      installedServers.includes(item.qualifiedName || item.name)
    );
  }
  
  filteredItems = items;
  showSearchResults(filteredItems);
}

/**
 * Show search results
 * @param {Array} items - Filtered items to display
 */
export function showSearchResults(items) {
  const container = document.getElementById('smithery-marketplace-items-container');
  if (!container) {
    console.error('Items container not found');
    return;
  }
  
  renderItems(items, container);
}

/**
 * Render items in the container
 * @param {Array} items - Items to render
 * @param {HTMLElement} container - Container element
 */
function renderItems(items, container) {
  container.innerHTML = '';
  
  if (!items || items.length === 0) {
    container.innerHTML = '<div class="no-results">No servers found</div>';
    return;
  }
  
  items.forEach(item => {
    const itemElement = createItemElement(item);
    container.appendChild(itemElement);
  });
}

/**
 * Create an item element
 * @param {Object} item - Item data
 * @returns {HTMLElement} Item element
 */
function createItemElement(item) {
  const element = document.createElement('div');
  element.className = 'marketplace-item';
  element.setAttribute('data-server-name', item.qualifiedName || item.name);
  
  const useCount = item.useCount ? `${item.useCount.toLocaleString()} uses` : '';
  const createdDate = item.createdAt ? new Date(item.createdAt).toLocaleDateString() : '';
  const isInstalled = connector.isSmitheryServerInstalled(item.qualifiedName || item.name);
  
  element.innerHTML = `
    <div class="marketplace-item-header">
      <h3 class="marketplace-item-title">
        ${escapeHtml(item.displayName || item.qualifiedName || item.name)}
        ${isInstalled ? '<span class="installed-badge">✓ Installed</span>' : ''}
      </h3>
      <div class="marketplace-item-meta">
        ${useCount ? `<span class="use-count">${useCount}</span>` : ''}
        ${createdDate ? `<span class="created-date">${createdDate}</span>` : ''}
      </div>
    </div>
    <p class="marketplace-item-description">${escapeHtml(item.description || 'No description available')}</p>
    <div class="marketplace-item-actions">
      <button class="btn btn-primary view-details-btn" data-server="${escapeHtml(item.qualifiedName || item.name)}">
        Details
      </button>
      ${isInstalled ? 
        '<button class="btn btn-secondary" disabled>Already Installed</button>' :
        `<button class="btn btn-secondary quick-install-btn" data-server="${escapeHtml(item.qualifiedName || item.name)}">Quick Install</button>`
      }
    </div>
  `;
  
  // Add event listeners
  const viewDetailsBtn = element.querySelector('.view-details-btn');
  const quickInstallBtn = element.querySelector('.quick-install-btn');
  
  if (viewDetailsBtn) {
    viewDetailsBtn.addEventListener('click', () => {
      showItemDetails(item);
    });
  }
  
  if (quickInstallBtn) {
    quickInstallBtn.addEventListener('click', () => {
      quickInstallItem(item);
    });
  }
  
  return element;
}

/**
 * Show item details
 * @param {Object} item - Item to show details for
 */
async function showItemDetails(item) {
  try {
    // Import details module dynamically
    const details = await import('./smithery-details.js');
    await details.showServerDetails(item.qualifiedName || item.name, item);
  } catch (error) {
    console.error('Failed to show item details:', error);
    alert('Failed to load item details: ' + error.message);
  }
}

/**
 * Quick install item
 * @param {Object} item - Item to install
 */
async function quickInstallItem(item) {
  try {
    // Import connector module dynamically
    const connector = await import('./smithery-connector.js');
    
    // Generate unique name
    const serverName = connector.generateUniqueServerName(item.qualifiedName || item.name);
    
    // Install with default settings
    const success = await connector.installServer(serverName, item);
    
    if (success) {
      console.log(`Quick installed server: ${serverName}`);
      alert(`Successfully installed: ${serverName}`);
    }
  } catch (error) {
    console.error('Quick install failed:', error);
    alert(`Quick install failed: ${error.message}`);
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
