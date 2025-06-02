/**
 * Composio Marketplace Modal Module
 * Handles the creation and setup of the Composio marketplace modal
 */

const { ipcRenderer } = require('electron');

// DOM element references
let marketplaceModal;
let marketplaceContent;
let categoriesContainer;
let itemsContainer;
let detailsContainer;
let backButton;
let backToCategoriesButton;

/**
 * Create the Composio marketplace modal
 * @returns {Object} - References to DOM elements
 */
export function createModal() {
  // Create modal element if it doesn't exist
  if (!document.getElementById('composio-marketplace-modal')) {
    const modalHtml = `
      <div id="composio-marketplace-modal" class="modal">
        <div class="modal-content marketplace-modal-content">
          <div class="modal-header">
            <span class="close" id="composio-marketplace-close">&times;</span>
            <span class="modal-esc-hint">Press <span class="kbd">ESC</span> to close</span>
            <h2>Composio Apps Marketplace</h2>
          </div>
          
          <!-- API Key Form (initially hidden) -->
          <div id="composio-api-key-view" style="display: none; padding: 20px;">
            <div class="details-header">
              <h3>Composio API Key Required</h3>
              <p>To access Composio apps, please enter your Composio API key below.</p>
            </div>
            <form id="composio-api-key-form" style="margin-top: 20px;">
              <div class="form-group">
                <label for="composio-api-key">API Key</label>
                <input type="text" id="composio-api-key" placeholder="sk_live_..." required>
                <small>Your Composio API key starts with 'sk_live_'</small>
              </div>
              <div class="form-group" style="margin-top: 20px; display: flex; gap: 10px;">
                <button type="submit" class="btn btn-success">Save API Key</button>
                <button type="button" id="composio-api-key-clear" class="btn btn-reveal">Clear Saved Key</button>
              </div>
            </form>
          </div>
          
          <div class="marketplace-container">
            <div class="marketplace-search">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <input type="text" id="composio-marketplace-search-input" placeholder="Search Composio apps..." style="flex: 1;">
                <label class="filter-toggle" style="white-space: nowrap; font-size: 0.85rem;">
                  <input type="checkbox" id="composio-filter-installed">
                  <span class="filter-label">Installed only</span>
                </label>
                <button id="composio-api-key-settings" class="btn btn-reveal" style="white-space: nowrap;">API Key Settings</button>
              </div>
            </div>
            <div id="composio-marketplace-items-view">
              <div class="marketplace-category-title">
                <h3 id="composio-category-title">Composio Apps</h3>
              </div>
              <div id="composio-marketplace-items-container" class="marketplace-items-container"></div>
            </div>
            <div id="composio-marketplace-details-view" style="display: none;">
              <button id="composio-back-to-marketplace" class="btn btn-reveal">&larr; Back to list</button>
              <div id="composio-marketplace-details-container" class="marketplace-details-container"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Append modal to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);
  }
  
  // Cache DOM elements
  marketplaceModal = document.getElementById('composio-marketplace-modal');
  marketplaceContent = marketplaceModal.querySelector('.marketplace-container');
  itemsContainer = document.getElementById('composio-marketplace-items-container');
  detailsContainer = document.getElementById('composio-marketplace-details-container');
  backButton = document.getElementById('composio-back-to-marketplace');
  
  // Debug: Log CSS properties to verify scrolling is enabled
  console.log('[DEBUG] Composio modal CSS check:', {
    itemsContainer: itemsContainer ? {
      overflow: getComputedStyle(itemsContainer).overflow,
      overflowY: getComputedStyle(itemsContainer).overflowY,
      height: getComputedStyle(itemsContainer).height,
      flex: getComputedStyle(itemsContainer).flex
    } : 'not found',
    detailsContainer: detailsContainer ? {
      overflow: getComputedStyle(detailsContainer).overflow,
      overflowY: getComputedStyle(detailsContainer).overflowY,
      height: getComputedStyle(detailsContainer).height,
      flex: getComputedStyle(detailsContainer).flex
    } : 'not found'
  });
  
  return {
    marketplaceModal,
    marketplaceContent,
    itemsContainer,
    detailsContainer,
    backButton
  };
}

/**
 * Show the Composio marketplace modal
 * @param {HTMLElement} modal - The modal element
 */
export async function showModal(modal) {
  // Check if API key exists
  const apiKey = await ipcRenderer.invoke('composio-get-api-key');
  
  if (!apiKey) {
    // Show API key form
    showApiKeyForm();
  } else {
    // Show marketplace content
    showMarketplaceContent();
  }
  
  window.modalManager.showModal(modal);
}

/**
 * Show the API key form
 */
export function showApiKeyForm() {
  // Hide marketplace content
  document.querySelector('#composio-marketplace-modal .marketplace-container').style.display = 'none';
  
  // Show API key form
  document.getElementById('composio-api-key-view').style.display = 'block';
  
  // Set up form submission handler
  const form = document.getElementById('composio-api-key-form');
  form.onsubmit = handleApiKeySubmit;
  
  // Set up clear button handler
  const clearButton = document.getElementById('composio-api-key-clear');
  clearButton.onclick = handleClearApiKey;
  
  // Pre-fill API key if it exists
  ipcRenderer.invoke('composio-get-api-key').then(apiKey => {
    if (apiKey) {
      document.getElementById('composio-api-key').value = apiKey;
      clearButton.style.display = 'block';
    } else {
      clearButton.style.display = 'none';
    }
  });
}

/**
 * Handle clearing the API key
 */
function handleClearApiKey() {
  // Clear API key from storage
  ipcRenderer.invoke('composio-set-api-key', '');
  
  // Clear input field
  document.getElementById('composio-api-key').value = '';
  
  // Hide clear button
  document.getElementById('composio-api-key-clear').style.display = 'none';
  
  // Show success message
  alert('API key cleared successfully');
}

/**
 * Show the marketplace content
 */
export function showMarketplaceContent() {
  // Hide API key form
  document.getElementById('composio-api-key-view').style.display = 'none';
  
  // Show marketplace content
  document.querySelector('#composio-marketplace-modal .marketplace-container').style.display = 'block';
}

/**
 * Handle API key form submission
 * @param {Event} e - Form submission event
 */
function handleApiKeySubmit(e) {
  e.preventDefault();
  
  // Get API key
  const apiKey = document.getElementById('composio-api-key').value.trim();
  
  if (!apiKey) {
    alert('Please enter a valid API key');
    return;
  }
  
  // Save API key to storage
  ipcRenderer.invoke('composio-set-api-key', apiKey);
  
  // Show marketplace content
  showMarketplaceContent();
  
  // Reload marketplace data
  import('../composio-marketplace/index.js').then(module => {
    module.default.openModal();
  });
}

/**
 * Close the Composio marketplace modal
 */
export function closeModal() {
  window.modalManager.closeActiveModal();
}

/**
 * Show all apps directly
 */
export function showAllApps() {
  document.getElementById('composio-marketplace-items-view').style.display = 'block';
  document.getElementById('composio-marketplace-details-view').style.display = 'none';
  
  // Reset search input
  const searchInput = document.getElementById('composio-marketplace-search-input');
  searchInput.value = '';
  
  // Hide any "no results" message
  const noResults = document.getElementById('composio-no-search-results');
  if (noResults) {
    noResults.style.display = 'none';
  }
}

/**
 * Show the items view (now the main view)
 */
export function showItemsView() {
  document.getElementById('composio-marketplace-items-view').style.display = 'block';
  document.getElementById('composio-marketplace-details-view').style.display = 'none';
}

/**
 * Show the details view
 */
export function showDetailsView() {
  document.getElementById('composio-marketplace-items-view').style.display = 'none';
  document.getElementById('composio-marketplace-details-view').style.display = 'block';
}
