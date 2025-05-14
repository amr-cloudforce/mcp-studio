/**
 * Marketplace UI Module
 * Handles rendering the marketplace UI
 */

import { parseUrlResponse } from '../../utils/url-parser.js';
import quickAdd from '../../quick-add.js';

let marketplaceModal;
let marketplaceContent;
let itemsContainer;
let detailsContainer;
let backButton;
let currentItem = null;

/**
 * Initialize the marketplace UI
 */
export function init() {
  createModal();
  setupEventListeners();
}

/**
 * Create the marketplace modal
 */
function createModal() {
  // Create modal element if it doesn't exist
  if (!document.getElementById('marketplace-modal')) {
    const modalHtml = `
      <div id="marketplace-modal" class="modal">
        <div class="modal-content marketplace-modal-content">
          <div class="modal-header">
            <span class="close" id="marketplace-close">&times;</span>
            <span class="modal-esc-hint">Press <span class="kbd">ESC</span> to close</span>
            <h2>MCP Server Marketplace</h2>
          </div>
          <div class="marketplace-container">
            <div id="marketplace-items-view">
              <div class="marketplace-search">
                <input type="text" id="marketplace-search-input" placeholder="Search servers...">
              </div>
              <div id="marketplace-items-container" class="marketplace-items-container"></div>
            </div>
            <div id="marketplace-details-view" style="display: none;">
              <button id="back-to-marketplace" class="btn btn-reveal">&larr; Back to list</button>
              <div id="marketplace-details-container" class="marketplace-details-container"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Append modal to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);
    
    // Cache DOM elements
    marketplaceModal = document.getElementById('marketplace-modal');
    marketplaceContent = document.querySelector('.marketplace-container');
    itemsContainer = document.getElementById('marketplace-items-container');
    detailsContainer = document.getElementById('marketplace-details-container');
    backButton = document.getElementById('back-to-marketplace');
  }
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Close button
  document.getElementById('marketplace-close').addEventListener('click', () => {
    window.modalManager.closeActiveModal();
  });
  
  // Back button
  backButton.addEventListener('click', () => {
    showItemsView();
  });
  
  // Search input
  const searchInput = document.getElementById('marketplace-search-input');
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    filterItems(query);
  });
}

/**
 * Filter items based on search query
 * @param {string} query - Search query
 */
function filterItems(query) {
  const items = itemsContainer.querySelectorAll('.marketplace-item');
  
  items.forEach(item => {
    const name = item.querySelector('h3').textContent.toLowerCase();
    const description = item.querySelector('p').textContent.toLowerCase();
    const category = item.querySelector('.category').textContent.toLowerCase();
    
    if (name.includes(query) || description.includes(query) || category.includes(query)) {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

/**
 * Populate the marketplace with items
 * @param {Array} items - Marketplace items
 */
export function populateMarketplace(items) {
  itemsContainer.innerHTML = '';
  
  if (items.length === 0) {
    itemsContainer.innerHTML = '<div class="no-items">No marketplace items available</div>';
    return;
  }
  
  // Group items by category
  const categories = {};
  items.forEach(item => {
    const category = item.category || 'Uncategorized';
    if (!categories[category]) {
      categories[category] = [];
    }
    categories[category].push(item);
  });
  
  // Create category sections
  Object.entries(categories).forEach(([category, categoryItems]) => {
    const categorySection = document.createElement('div');
    categorySection.className = 'marketplace-category';
    categorySection.innerHTML = `<h3>${category}</h3>`;
    
    // Create items
    categoryItems.forEach(item => {
      const itemElement = createItemElement(item);
      categorySection.appendChild(itemElement);
    });
    
    itemsContainer.appendChild(categorySection);
  });
}

/**
 * Create an item element
 * @param {Object} item - Marketplace item
 * @returns {HTMLElement} - Item element
 */
function createItemElement(item) {
  const itemElement = document.createElement('div');
  itemElement.className = `marketplace-item ${!item.available ? 'unavailable' : ''}`;
  itemElement.dataset.repoName = item.repo_name;
  
  // Create item content
  itemElement.innerHTML = `
    <span class="category">${item.category || 'Uncategorized'}</span>
    <h3>${item.repo_name}</h3>
    <p>${item.summary_200_words ? item.summary_200_words.substring(0, 100) : 'No description available'}...</p>
    <div class="item-footer">
      <span class="stars">⭐ ${item.stars || 0}</span>
      <span class="server-type">${item.server_type ? item.server_type.toUpperCase() : 'UNKNOWN'}</span>
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
  
  return itemElement;
}

/**
 * Show item details
 * @param {Object} item - Marketplace item
 */
function showItemDetails(item) {
  currentItem = item;
  
  // Hide items view, show details view
  document.getElementById('marketplace-items-view').style.display = 'none';
  document.getElementById('marketplace-details-view').style.display = 'block';
  
  // Populate details
  detailsContainer.innerHTML = `
    <div class="details-header">
      <h2>${item.repo_name}</h2>
      <div class="details-meta">
        <span class="server-type">${item.server_type ? item.server_type.toUpperCase() : 'UNKNOWN'}</span>
        <span class="stars">⭐ ${item.stars || 0}</span>
        <span class="category">${item.category || 'Uncategorized'}</span>
      </div>
    </div>
    <div class="details-summary">
      <p>${item.summary_200_words || 'No description available'}</p>
    </div>
    <div class="details-links">
      ${item.repo ? `<a href="${item.repo}" target="_blank" class="external-link">View on GitHub</a>` : ''}
    </div>
    <div class="details-readme">
      <h3>README</h3>
      <div id="readme-content" class="readme-content">
        <div class="loading">Loading README...</div>
      </div>
    </div>
    <div class="details-actions">
      <button id="import-server-btn" class="btn btn-success">Import Server</button>
    </div>
  `;
  
  // Load README
  loadReadme(item.readme_url);
  
  // Add import button event listener
  document.getElementById('import-server-btn').addEventListener('click', () => {
    importServer(item);
  });
}

/**
 * Load README content
 * @param {string} url - README URL
 */
async function loadReadme(url) {
  const readmeContent = document.getElementById('readme-content');
  
  try {
    const response = await window.api.fetchUrl(url);
    
    // Simple markdown to HTML conversion (just for code blocks)
    let html = response
      .replace(/```(\w*)([\s\S]*?)```/g, '<pre><code>$2</code></pre>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
    
    readmeContent.innerHTML = `<div class="readme-html">${html}</div>`;
  } catch (error) {
    readmeContent.innerHTML = `<div class="error">Failed to load README: ${error.message}</div>`;
  }
}

/**
 * Import a server from the marketplace
 * @param {Object} item - Marketplace item
 */
async function importServer(item) {
  try {
    // Show loading state
    const importBtn = document.getElementById('import-server-btn');
    importBtn.textContent = 'Importing...';
    importBtn.disabled = true;
    
    // Fetch the README
    const readmeContent = await window.api.fetchUrl(item.readme_url);
    
    // Parse the README to extract server configuration
    const config = parseUrlResponse(item.repo, readmeContent);
    
    if (!config) {
      alert('Could not find a valid server configuration in the README');
      importBtn.textContent = 'Import Server';
      importBtn.disabled = false;
      return;
    }
    
    // Close the marketplace modal
    window.modalManager.closeActiveModal();
    
    // Add the server to Quick Add templates
    addToQuickAddTemplates(item, config);
    
    // Open Quick Add modal
    quickAdd.openModal();
  } catch (error) {
    alert(`Error importing server: ${error.message}`);
    const importBtn = document.getElementById('import-server-btn');
    importBtn.textContent = 'Import Server';
    importBtn.disabled = false;
  }
}

/**
 * Add a marketplace item to Quick Add templates
 * @param {Object} item - Marketplace item
 * @param {Object} config - Server configuration
 */
function addToQuickAddTemplates(item, config) {
  // Create a template ID
  const templateId = `marketplace-${item.repo_name}`;
  
  // Create a template object
  const template = {
    name: item.repo_name,
    description: item.summary_200_words || 'No description available',
    category: item.category || 'Marketplace',
    documentationUrl: item.repo,
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234A56E2'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/%3E%3C/svg%3E`,
    userInputs: [],
    config: config.config
  };
  
  // Add the template to the global templates object
  window.quickAddTemplates[templateId] = template;
}

/**
 * Show the items view
 */
function showItemsView() {
  document.getElementById('marketplace-items-view').style.display = 'block';
  document.getElementById('marketplace-details-view').style.display = 'none';
  currentItem = null;
}

/**
 * Open the marketplace modal
 * @param {Array} items - Marketplace items
 */
export function openModal(items) {
  // Populate marketplace
  populateMarketplace(items);
  
  // Show items view
  showItemsView();
  
  // Show modal
  window.modalManager.showModal(marketplaceModal);
}
