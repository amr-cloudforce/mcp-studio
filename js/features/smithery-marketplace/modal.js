/**
 * Smithery Marketplace Modal Module
 * Handles the creation and setup of the Smithery marketplace modal
 */

const { ipcRenderer } = require('electron');

// DOM element references
let marketplaceModal;
let marketplaceContent;
let itemsContainer;
let detailsContainer;
let backButton;

/**
 * Create the Smithery marketplace modal
 * @returns {Object} - References to DOM elements
 */
export function createModal() {
  // Create modal element if it doesn't exist
  if (!document.getElementById('smithery-marketplace-modal')) {
    const modalHtml = `
      <div id="smithery-marketplace-modal" class="modal">
        <div class="modal-content marketplace-modal-content">
          <div class="modal-header">
            <span class="close" id="smithery-marketplace-close">&times;</span>
            <span class="modal-esc-hint">Press <span class="kbd">ESC</span> to close</span>
            <h2>Smithery Registry</h2>
          </div>
          
          <!-- API Key Form (initially hidden) -->
          <div id="smithery-api-key-view" style="display: none; padding: 20px;">
            <div class="details-header">
              <h3>Smithery API Key Required</h3>
              <p>To access Smithery registry, please enter your Smithery API key and profile below.</p>
            </div>
            <form id="smithery-api-key-form" style="margin-top: 20px;">
              <div class="form-group">
                <label for="smithery-api-key">API Key</label>
                <input type="password" id="smithery-api-key" placeholder="Enter your Smithery API key" required>
                <small>Your Smithery API key</small>
              </div>
              <div class="form-group" style="margin-top: 15px;">
                <label for="smithery-profile">Profile</label>
                <input type="text" id="smithery-profile" placeholder="Enter your profile name" required>
                <small>Your Smithery profile name</small>
              </div>
              <div class="form-group" style="margin-top: 20px; display: flex; gap: 10px;">
                <button type="submit" class="btn btn-success">Save Credentials</button>
                <button type="button" id="smithery-api-key-clear" class="btn btn-reveal">Clear Saved Credentials</button>
              </div>
            </form>
          </div>
          
          <div class="marketplace-container">
            <div class="marketplace-search">
              <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px;">
                <input type="text" id="smithery-marketplace-search-input" placeholder="Search Smithery servers..." style="flex: 1;">
                <label class="filter-toggle" style="white-space: nowrap; font-size: 0.85rem;">
                  <input type="checkbox" id="smithery-filter-installed">
                  <span class="filter-label">Installed only</span>
                </label>
                <button id="smithery-api-key-settings" class="btn btn-reveal" style="white-space: nowrap;">API Key Settings</button>
              </div>
            </div>
            <div id="smithery-marketplace-items-view">
              <div class="marketplace-category-title">
                <h3 id="smithery-category-title">Smithery Servers</h3>
              </div>
              <div id="smithery-marketplace-items-container" class="marketplace-items-container"></div>
            </div>
            <div id="smithery-marketplace-details-view" style="display: none;">
              <button id="smithery-back-to-marketplace" class="btn btn-reveal">&larr; Back to list</button>
              <div id="smithery-marketplace-details-container" class="marketplace-details-container"></div>
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
  marketplaceModal = document.getElementById('smithery-marketplace-modal');
  marketplaceContent = marketplaceModal.querySelector('.marketplace-container');
  itemsContainer = document.getElementById('smithery-marketplace-items-container');
  detailsContainer = document.getElementById('smithery-marketplace-details-container');
  backButton = document.getElementById('smithery-back-to-marketplace');
  
  return {
    marketplaceModal,
    marketplaceContent,
    itemsContainer,
    detailsContainer,
    backButton
  };
}

/**
 * Show the Smithery marketplace modal
 * @param {HTMLElement} modal - The modal element
 */
export async function showModal(modal) {
  // Check if API key exists
  const credentials = await ipcRenderer.invoke('smithery-get-credentials');
  
  if (!credentials || !credentials.apiKey || !credentials.profile) {
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
  document.querySelector('#smithery-marketplace-modal .marketplace-container').style.display = 'none';
  
  // Show API key form
  document.getElementById('smithery-api-key-view').style.display = 'block';
  
  // Set up form submission handler
  const form = document.getElementById('smithery-api-key-form');
  form.onsubmit = handleApiKeySubmit;
  
  // Set up clear button handler
  const clearButton = document.getElementById('smithery-api-key-clear');
  clearButton.onclick = handleClearCredentials;
  
  // Pre-fill credentials if they exist
  ipcRenderer.invoke('smithery-get-credentials').then(credentials => {
    if (credentials && credentials.apiKey && credentials.profile) {
      document.getElementById('smithery-api-key').value = credentials.apiKey;
      document.getElementById('smithery-profile').value = credentials.profile;
      clearButton.style.display = 'block';
    } else {
      clearButton.style.display = 'none';
    }
  });
}

/**
 * Handle clearing the credentials
 */
function handleClearCredentials() {
  // Clear credentials from storage
  ipcRenderer.invoke('smithery-set-credentials', { apiKey: '', profile: '' });
  
  // Clear input fields
  document.getElementById('smithery-api-key').value = '';
  document.getElementById('smithery-profile').value = '';
  
  // Hide clear button
  document.getElementById('smithery-api-key-clear').style.display = 'none';
  
  // Show success message
  alert('Credentials cleared successfully');
}

/**
 * Show the marketplace content
 */
export function showMarketplaceContent() {
  // Hide API key form
  document.getElementById('smithery-api-key-view').style.display = 'none';
  
  // Show marketplace content
  document.querySelector('#smithery-marketplace-modal .marketplace-container').style.display = 'block';
}

/**
 * Handle API key form submission
 * @param {Event} e - Form submission event
 */
function handleApiKeySubmit(e) {
  e.preventDefault();
  
  // Get credentials
  const apiKey = document.getElementById('smithery-api-key').value.trim();
  const profile = document.getElementById('smithery-profile').value.trim();
  
  if (!apiKey || !profile) {
    alert('Please enter both API key and profile');
    return;
  }
  
  // Save credentials to storage
  ipcRenderer.invoke('smithery-set-credentials', { apiKey, profile });
  
  // Show marketplace content
  showMarketplaceContent();
  
  // Reload marketplace data
  import('./index.js').then(module => {
    module.default.openModal();
  });
}

/**
 * Close the Smithery marketplace modal
 */
export function closeModal() {
  window.modalManager.closeActiveModal();
}

/**
 * Show the items view
 */
export function showItemsView() {
  document.getElementById('smithery-marketplace-items-view').style.display = 'block';
  document.getElementById('smithery-marketplace-details-view').style.display = 'none';
}

/**
 * Show the details view
 */
export function showDetailsView() {
  document.getElementById('smithery-marketplace-items-view').style.display = 'none';
  document.getElementById('smithery-marketplace-details-view').style.display = 'block';
}
