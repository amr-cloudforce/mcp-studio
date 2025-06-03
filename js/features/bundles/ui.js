/**
 * Bundles UI Management
 * Handles the bundles listing view and interactions
 */

import * as bundleData from './data.js';
import * as bundleStatus from './status.js';
import * as bundleModal from './modal.js';

/**
 * Initialize the bundles UI
 */
export function initialize() {
  console.log('Initializing Bundles UI...');
  
  // Create bundles view container if it doesn't exist
  createBundlesView();
  
  // Set up search functionality
  setupSearchHandlers();
}

/**
 * Create the bundles view container
 */
function createBundlesView() {
  // Check if bundles view already exists
  if (document.getElementById('bundles-view')) {
    return;
  }
  
  // Create bundles view HTML
  const bundlesViewHTML = `
    <div id="bundles-view" class="view-container" style="display: none;">
      <div class="bundles-header">
        <h2>📦 MCP Bundles</h2>
        <div class="bundles-search">
          <input type="text" id="bundles-search-input" placeholder="Search bundles..." />
        </div>
      </div>
      <div id="bundles-container" class="bundles-container">
        <!-- Bundles will be populated here -->
      </div>
    </div>
  `;
  
  // Add to main content area
  const mainContent = document.querySelector('.main-content') || document.body;
  mainContent.insertAdjacentHTML('beforeend', bundlesViewHTML);
}

/**
 * Show the bundles view
 */
export function showBundlesView() {
  console.log('Showing bundles view...');
  
  // Hide other views
  hideAllViews();
  
  // Show bundles view
  const bundlesView = document.getElementById('bundles-view');
  if (bundlesView) {
    bundlesView.style.display = 'block';
    
    // Load and display bundles
    displayBundles();
  }
}

/**
 * Hide all views
 */
function hideAllViews() {
  // Hide main server content
  const mainContent = document.querySelector('.main-content');
  if (mainContent) {
    const children = mainContent.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (child.id !== 'bundles-view') {
        child.style.display = 'none';
      }
    }
  }
  
  // Hide marketplace views
  const views = [
    'marketplace-view',
    'composio-marketplace-view',
    'apify-marketplace-view',
    'smithery-marketplace-view'
  ];
  
  views.forEach(viewId => {
    const view = document.getElementById(viewId);
    if (view) {
      view.style.display = 'none';
    }
  });
}

/**
 * Display all bundles
 */
function displayBundles() {
  const bundles = bundleData.getAllBundles();
  const container = document.getElementById('bundles-container');
  
  if (!container) {
    console.error('Bundles container not found');
    return;
  }
  
  // Clear container
  container.innerHTML = '';
  
  if (bundles.length === 0) {
    container.innerHTML = '<div class="no-bundles">No bundles available</div>';
    return;
  }
  
  // Create bundle items
  bundles.forEach(bundle => {
    const bundleElement = createBundleElement(bundle);
    container.appendChild(bundleElement);
  });
}

/**
 * Create a bundle element
 * @param {Object} bundle - Bundle object
 * @returns {HTMLElement} Bundle element
 */
function createBundleElement(bundle) {
  const bundleDiv = document.createElement('div');
  bundleDiv.className = 'bundle-item';
  bundleDiv.dataset.bundleId = bundle.id;
  
  // Get bundle status
  const status = bundleStatus.getBundleStatus(bundle);
  
  // Create tools list
  const toolsList = bundle.tools.map(tool => tool.displayName).join(', ');
  
  // Create status indicator
  const statusClass = status.isComplete ? 'complete' : 'incomplete';
  const statusText = status.isComplete ? '✓ Complete' : `${status.installedTools}/${status.totalTools} installed`;
  
  bundleDiv.innerHTML = `
    <div class="bundle-header">
      <div class="bundle-icon">${bundle.icon}</div>
      <div class="bundle-info">
        <h3 class="bundle-name">${escapeHtml(bundle.name)}</h3>
        <p class="bundle-description">${escapeHtml(bundle.description)}</p>
        <div class="bundle-tools">Tools: ${escapeHtml(toolsList)}</div>
      </div>
      <div class="bundle-status ${statusClass}">
        ${statusText}
      </div>
    </div>
    <div class="bundle-actions">
      <button class="btn btn-secondary bundle-docs-btn" data-bundle-id="${bundle.id}">
        📖 Documentation
      </button>
      <button class="btn btn-primary bundle-configure-btn" data-bundle-id="${bundle.id}">
        ⚙️ Configure
      </button>
    </div>
  `;
  
  // Add event listeners
  const docsBtn = bundleDiv.querySelector('.bundle-docs-btn');
  const configureBtn = bundleDiv.querySelector('.bundle-configure-btn');
  
  docsBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    showBundleDocumentation(bundle);
  });
  
  configureBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    console.log('Configure button clicked for bundle:', bundle.id);
    bundleModal.showConfigurationModal(bundle);
  });
  
  return bundleDiv;
}

/**
 * Show bundle documentation
 * @param {Object} bundle - Bundle object
 */
function showBundleDocumentation(bundle) {
  // For now, show an alert with bundle info
  // In the future, this could open a dedicated documentation modal
  const toolsList = bundle.tools.map(tool => `• ${tool.displayName} (${tool.type})`).join('\n');
  const promptsList = bundle.prompts.map(prompt => `• ${prompt.name}: ${prompt.description}`).join('\n');
  
  const docText = `${bundle.name}

${bundle.description}

Tools:
${toolsList}

Prompts:
${promptsList}`;
  
  alert(docText);
}

/**
 * Set up search handlers
 */
function setupSearchHandlers() {
  const searchInput = document.getElementById('bundles-search-input');
  if (searchInput) {
    searchInput.addEventListener('input', handleSearch);
  }
}

/**
 * Handle search input
 * @param {Event} event - Input event
 */
function handleSearch(event) {
  const query = event.target.value;
  const filteredBundles = bundleData.searchBundles(query);
  displayFilteredBundles(filteredBundles);
}

/**
 * Display filtered bundles
 * @param {Array} bundles - Filtered bundles array
 */
function displayFilteredBundles(bundles) {
  const container = document.getElementById('bundles-container');
  
  if (!container) {
    return;
  }
  
  // Clear container
  container.innerHTML = '';
  
  if (bundles.length === 0) {
    container.innerHTML = '<div class="no-bundles">No bundles match your search</div>';
    return;
  }
  
  // Create bundle items
  bundles.forEach(bundle => {
    const bundleElement = createBundleElement(bundle);
    container.appendChild(bundleElement);
  });
}

/**
 * Refresh bundles display (call after config changes)
 */
export function refreshBundles() {
  const bundlesView = document.getElementById('bundles-view');
  if (bundlesView && bundlesView.style.display !== 'none') {
    displayBundles();
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
