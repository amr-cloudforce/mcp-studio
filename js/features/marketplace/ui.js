/**
 * Marketplace UI Module
 * Handles rendering the marketplace UI
 */

import { parseUrlResponse } from '../../utils/url-parser.js';
import quickAdd from '../../quick-add.js';
import { groupByCategory } from './data.js';
import { getCategoryIcon } from './icons.js';
import { getCategoryColor } from './colors.js';

let marketplaceModal;
let marketplaceContent;
let itemsContainer;
let categoriesContainer;
let detailsContainer;
let backButton;
let backToCategoriesButton;
let currentItem = null;
let allItems = [];
let currentCategory = null;

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
            <div id="marketplace-categories-view">
              <div class="marketplace-search">
                <input type="text" id="marketplace-search-input" placeholder="Search categories...">
              </div>
              <div id="marketplace-categories-container" class="marketplace-categories-container"></div>
            </div>
            <div id="marketplace-items-view" style="display: none;">
              <button id="back-to-categories" class="btn btn-reveal">&larr; Back to categories</button>
              <div class="marketplace-category-title">
                <h3 id="category-title"></h3>
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
    categoriesContainer = document.getElementById('marketplace-categories-container');
    itemsContainer = document.getElementById('marketplace-items-container');
    detailsContainer = document.getElementById('marketplace-details-container');
    backButton = document.getElementById('back-to-marketplace');
    backToCategoriesButton = document.getElementById('back-to-categories');
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
  
  // Back to categories button
  backToCategoriesButton.addEventListener('click', () => {
    showCategoriesView();
  });
  
  // Back to items button
  backButton.addEventListener('click', () => {
    showItemsView();
  });
  
  // Search input
  const searchInput = document.getElementById('marketplace-search-input');
  searchInput.addEventListener('input', (e) => {
    const query = e.target.value.toLowerCase();
    if (document.getElementById('marketplace-categories-view').style.display !== 'none') {
      filterCategories(query);
    } else {
      filterItems(query);
    }
  });
}

/**
 * Filter categories based on search query
 * @param {string} query - Search query
 */
function filterCategories(query) {
  const categories = categoriesContainer.querySelectorAll('.marketplace-category-card');
  
  categories.forEach(category => {
    const name = category.querySelector('h3').textContent.toLowerCase();
    
    if (name.includes(query)) {
      category.style.display = 'flex';
    } else {
      category.style.display = 'none';
    }
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
    const serverType = item.querySelector('.server-type').textContent.toLowerCase();
    
    if (name.includes(query) || description.includes(query) || serverType.includes(query)) {
      item.style.display = 'flex'; // Use flex to maintain the flex layout
    } else {
      item.style.display = 'none';
    }
  });
}

/**
 * Populate the marketplace with categories
 * @param {Array} items - Marketplace items
 */
export function populateMarketplace(items) {
  // Store all items for later use
  allItems = items;
  
  // Group items by category
  const categories = groupByCategory(items);
  
  categoriesContainer.innerHTML = '';
  
  if (Object.keys(categories).length === 0) {
    categoriesContainer.innerHTML = '<div class="no-items">No marketplace categories available</div>';
    return;
  }
  
  // Create category cards
  Object.entries(categories).forEach(([category, categoryItems]) => {
    const categoryElement = createCategoryElement(category, categoryItems);
    categoriesContainer.appendChild(categoryElement);
  });
}


/**
 * Create a category element
 * @param {string} category - Category name
 * @param {Array} items - Items in the category
 * @returns {HTMLElement} - Category element
 */
function createCategoryElement(category, items) {
  const categoryElement = document.createElement('div');
  categoryElement.className = 'marketplace-category-card';
  categoryElement.dataset.category = category;
  
  // Count available items
  const availableCount = items.filter(item => item.available).length;
  
  // Get icon for category
  const icon = getCategoryIcon(category);
  
  // Get color for category
  const color = getCategoryColor(category);
  
  // Set the color bar at the top
  categoryElement.style.setProperty('--category-color', color);
  
  // Create category content
  categoryElement.innerHTML = `
    <div class="category-icon">${icon}</div>
    <h3>${category}</h3>
    <div class="category-meta">
      <span class="item-count">${availableCount} available items</span>
    </div>
  `;
  
  // Set the icon color after the HTML is created
  categoryElement.querySelector('.category-icon').style.color = color;
  
  // Add click event
  categoryElement.addEventListener('click', () => {
    showItemsForCategory(category);
  });
  
  return categoryElement;
}

/**
 * Show items for a specific category
 * @param {string} category - Category name
 */
function showItemsForCategory(category) {
  currentCategory = category;
  
  // Filter items by category
  const categoryItems = allItems.filter(item => (item.category || 'Uncategorized') === category);
  
  // Update category title
  const categoryTitle = document.getElementById('category-title');
  categoryTitle.textContent = category;
  
  // Apply category color to title
  const categoryColor = getCategoryColor(category);
  const categoryTitleContainer = document.querySelector('.marketplace-category-title');
  categoryTitleContainer.style.borderBottom = `3px solid ${categoryColor}`;
  categoryTitleContainer.style.color = 'var(--text)';
  
  // Get category icon
  const icon = getCategoryIcon(category);
  
  // Add icon to title
  categoryTitle.innerHTML = `${icon} ${category}`;
  
  // Clear items container
  itemsContainer.innerHTML = '';
  
  // Create items
  categoryItems.forEach(item => {
    const itemElement = createItemElement(item);
    itemsContainer.appendChild(itemElement);
  });
  
  // Show items view
  document.getElementById('marketplace-categories-view').style.display = 'none';
  document.getElementById('marketplace-items-view').style.display = 'block';
  
  // Update search placeholder
  document.getElementById('marketplace-search-input').placeholder = `Search in ${category}...`;
}

/**
 * Create an item element
 * @param {Object} item - Marketplace item
 * @returns {HTMLElement} - Item element wrapper
 */
function createItemElement(item) {
  // Create wrapper for consistent sizing
  const wrapper = document.createElement('div');
  wrapper.className = 'marketplace-item-wrapper';
  
  // Create the actual item element
  const itemElement = document.createElement('div');
  itemElement.className = `marketplace-item ${!item.available ? 'unavailable' : ''}`;
  itemElement.dataset.repoName = item.repo_name;
  
  // Create item content
  itemElement.innerHTML = `
    <div class="item-header">
      <span class="server-type">${item.server_type ? item.server_type.toUpperCase() : 'UNKNOWN'}</span>
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
  if (item.readme_url) {
    loadReadme(item.readme_url);
  } else {
    document.getElementById('readme-content').innerHTML = `<div class="error">No README URL available</div>`;
  }
  
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
    
    // Check if README URL is available
    if (!item.readme_url) {
      alert('No README URL available for this server');
      importBtn.textContent = 'Import Server';
      importBtn.disabled = false;
      return;
    }
    
    // Fetch the README
    const readmeContent = await window.api.fetchUrl(item.readme_url);
    
    // Parse the README to extract server configuration
    const config = parseUrlResponse(item.repo || '', readmeContent);
    
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
 * Show the categories view
 */
function showCategoriesView() {
  document.getElementById('marketplace-categories-view').style.display = 'block';
  document.getElementById('marketplace-items-view').style.display = 'none';
  document.getElementById('marketplace-details-view').style.display = 'none';
  
  // Reset search placeholder
  document.getElementById('marketplace-search-input').placeholder = 'Search categories...';
  
  // Reset category title container style
  const categoryTitleContainer = document.querySelector('.marketplace-category-title');
  categoryTitleContainer.style.borderBottom = '';
  categoryTitleContainer.style.color = '';
  
  currentCategory = null;
}

/**
 * Show the items view
 */
function showItemsView() {
  document.getElementById('marketplace-categories-view').style.display = 'none';
  document.getElementById('marketplace-items-view').style.display = 'block';
  document.getElementById('marketplace-details-view').style.display = 'none';
  currentItem = null;
}

/**
 * Open the marketplace modal
 * @param {Array} items - Marketplace items
 */
export function openModal(items) {
  // Populate marketplace with categories
  populateMarketplace(items);
  
  // Show categories view
  showCategoriesView();
  
  // Show modal
  window.modalManager.showModal(marketplaceModal);
}
