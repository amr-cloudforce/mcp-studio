/**
 * Apify Marketplace Modal Module
 * Handles the creation and setup of the Apify marketplace modal
 */

const { ipcRenderer } = require('electron');

// DOM element references
let marketplaceModal;
let marketplaceContent;
let itemsContainer;
let detailsContainer;
let backButton;

/**
 * Create the Apify marketplace modal
 * @returns {Object} - References to DOM elements
 */
export function createModal() {
  // Create modal element if it doesn't exist
  if (!document.getElementById('apify-marketplace-modal')) {
    const modalHtml = `
      <div id="apify-marketplace-modal" class="modal">
        <div class="modal-content marketplace-modal-content">
          <div class="modal-header">
            <span class="close" id="apify-marketplace-close">&times;</span>
            <span class="modal-esc-hint">Press <span class="kbd">ESC</span> to close</span>
            <h2>Apify Actors Marketplace</h2>
          </div>
          
          <!-- API Key Form (initially hidden) -->
          <div id="apify-api-key-view" style="display: none; padding: 20px;">
            <div class="details-header">
              <h3>Apify API Key Required</h3>
              <p>To access Apify actors, please enter your Apify API key below.</p>
            </div>
            <form id="apify-api-key-form" style="margin-top: 20px;">
              <div class="form-group">
                <label for="apify-api-key">API Key</label>
                <input type="text" id="apify-api-key" placeholder="apify_api_..." required>
                <small>You can find your API key in your <a href="https://console.apify.com/account/integrations" target="_blank">Apify Console</a></small>
              </div>
              <div class="form-group" style="margin-top: 20px; display: flex; gap: 10px;">
                <button type="submit" class="btn btn-success">Save API Key</button>
                <button type="button" id="apify-api-key-clear" class="btn btn-reveal">Clear Saved Key</button>
              </div>
            </form>
          </div>
          
          <div class="marketplace-container">
            <div class="marketplace-search">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <input type="text" id="apify-marketplace-search-input" placeholder="Search Apify actors..." style="flex: 1;">
                <label class="filter-toggle" style="white-space: nowrap; font-size: 0.85rem;">
                  <input type="checkbox" id="apify-filter-installed">
                  <span class="filter-label">Installed only</span>
                </label>
                <button id="apify-api-key-settings" class="btn btn-reveal" style="white-space: nowrap;">API Key Settings</button>
              </div>
            </div>
            <div id="apify-marketplace-items-view">
              <div class="marketplace-category-title">
                <h3 id="apify-category-title">Apify Actors</h3>
              </div>
              <div id="apify-marketplace-items-container" class="marketplace-items-container"></div>
            </div>
            <div id="apify-marketplace-details-view" style="display: none;">
              <button id="apify-back-to-marketplace" class="btn btn-reveal">&larr; Back to list</button>
              <div id="apify-marketplace-details-container" class="marketplace-details-container"></div>
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
  marketplaceModal = document.getElementById('apify-marketplace-modal');
  marketplaceContent = marketplaceModal.querySelector('.marketplace-container');
  itemsContainer = document.getElementById('apify-marketplace-items-container');
  detailsContainer = document.getElementById('apify-marketplace-details-container');
  backButton = document.getElementById('apify-back-to-marketplace');
  
  return {
    marketplaceModal,
    marketplaceContent,
    itemsContainer,
    detailsContainer,
    backButton
  };
}

/**
 * Show the Apify marketplace modal
 * @param {HTMLElement} modal - The modal element
 */
export async function showModal(modal) {
  // Check if API key exists
  const apiKey = await ipcRenderer.invoke('apify-get-api-key');
  
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
  document.querySelector('#apify-marketplace-modal .marketplace-container').style.display = 'none';
  
  // Show API key form
  document.getElementById('apify-api-key-view').style.display = 'block';
  
  // Set up form submission handler
  const form = document.getElementById('apify-api-key-form');
  form.onsubmit = handleApiKeySubmit;
  
  // Set up clear button handler
  const clearButton = document.getElementById('apify-api-key-clear');
  clearButton.onclick = handleClearApiKey;
  
  // Set up settings button handler
  const settingsButton = document.getElementById('apify-api-key-settings');
  if (settingsButton) {
    settingsButton.onclick = showApiKeyForm;
  }
  
  // Pre-fill API key if it exists
  ipcRenderer.invoke('apify-get-api-key').then(apiKey => {
    if (apiKey) {
      document.getElementById('apify-api-key').value = apiKey;
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
  ipcRenderer.invoke('apify-set-api-key', '');
  
  // Clear input field
  document.getElementById('apify-api-key').value = '';
  
  // Hide clear button
  document.getElementById('apify-api-key-clear').style.display = 'none';
  
  // Show success message
  alert('API key cleared successfully');
}

/**
 * Show the marketplace content
 */
export function showMarketplaceContent() {
  // Hide API key form
  document.getElementById('apify-api-key-view').style.display = 'none';
  
  // Show marketplace content
  document.querySelector('#apify-marketplace-modal .marketplace-container').style.display = 'block';
}

/**
 * Handle API key form submission
 * @param {Event} e - Form submission event
 */
function handleApiKeySubmit(e) {
  e.preventDefault();
  
  // Get API key
  const apiKey = document.getElementById('apify-api-key').value.trim();
  
  if (!apiKey) {
    alert('Please enter a valid API key');
    return;
  }
  
  // Save API key to storage
  ipcRenderer.invoke('apify-set-api-key', apiKey);
  
  // Show marketplace content
  showMarketplaceContent();
  
  // Reload marketplace data
  import('../apify-marketplace/index.js').then(module => {
    module.default.openModal();
  });
}

/**
 * Close the Apify marketplace modal
 */
export function closeModal() {
  window.modalManager.closeActiveModal();
}

/**
 * Show all actors directly
 */
export function showAllActors() {
  document.getElementById('apify-marketplace-items-view').style.display = 'block';
  document.getElementById('apify-marketplace-details-view').style.display = 'none';
  
  // Reset search input
  const searchInput = document.getElementById('apify-marketplace-search-input');
  searchInput.value = '';
  
  // Hide any "no results" message
  const noResults = document.getElementById('apify-no-search-results');
  if (noResults) {
    noResults.style.display = 'none';
  }
}

/**
 * Show the items view (now the main view)
 */
export function showItemsView() {
  document.getElementById('apify-marketplace-items-view').style.display = 'block';
  document.getElementById('apify-marketplace-details-view').style.display = 'none';
}

/**
 * Show the details view
 */
export function showDetailsView() {
  document.getElementById('apify-marketplace-items-view').style.display = 'none';
  document.getElementById('apify-marketplace-details-view').style.display = 'block';
}
