/**
 * Bundle Configuration Modal
 * Handles the bundle configuration modal and tool installation workflow
 */

import * as bundleStatus from './status.js';
import * as bundleUI from './ui.js';
import * as modalUI from './modal-ui.js';
import * as marketplaceIntegration from './marketplace-integration.js';

// Current bundle being configured
let currentBundle = null;

/**
 * Initialize the modal system
 */
export function initialize() {
  console.log('Initializing Bundle Modal...');
  createConfigurationModal();
}

/**
 * Create the configuration modal HTML
 */
function createConfigurationModal() {
  // Check if modal already exists
  if (document.getElementById('bundle-configuration-modal')) {
    return;
  }
  
  const modalHTML = `
    <div id="bundle-configuration-modal" class="modal" style="display: none;">
      <div class="modal-content bundle-modal-content">
        <div class="modal-header">
          <h2 id="bundle-modal-title">Configure Bundle</h2>
          <span class="close" id="bundle-modal-close">&times;</span>
        </div>
        <div class="modal-body">
          <div id="bundle-modal-description" class="bundle-modal-description"></div>
          
          <div class="bundle-tools-section">
            <h3>Tools to Install:</h3>
            <div id="bundle-tools-list" class="bundle-tools-list">
              <!-- Tools will be populated here -->
            </div>
          </div>
          
          <div class="bundle-prompts-section">
            <h3>Included Prompts:</h3>
            <div id="bundle-prompts-list" class="bundle-prompts-list">
              <!-- Prompts will be populated here -->
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button id="bundle-install-remaining" class="btn btn-primary">Install Remaining</button>
          <button id="bundle-modal-cancel" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  `;
  
  // Add to body
  document.body.insertAdjacentHTML('beforeend', modalHTML);
  
  // Set up event listeners
  setupModalEventListeners();
}

/**
 * Set up modal event listeners
 */
function setupModalEventListeners() {
  const modal = document.getElementById('bundle-configuration-modal');
  const closeBtn = document.getElementById('bundle-modal-close');
  const cancelBtn = document.getElementById('bundle-modal-cancel');
  const installBtn = document.getElementById('bundle-install-remaining');
  
  // Close modal events
  closeBtn.addEventListener('click', closeModal);
  cancelBtn.addEventListener('click', closeModal);
  
  // Click outside modal to close
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
  
  // Install remaining button
  installBtn.addEventListener('click', handleInstallRemaining);
}

/**
 * Show configuration modal for a bundle
 * @param {Object} bundle - Bundle object
 */
export function showConfigurationModal(bundle) {
  console.log('Showing configuration modal for bundle:', bundle.name);
  
  const modal = document.getElementById('bundle-configuration-modal');
  const title = document.getElementById('bundle-modal-title');
  const description = document.getElementById('bundle-modal-description');
  
  // Set bundle data
  currentBundle = bundle;
  
  // Update modal content
  title.textContent = `Configure ${bundle.name}`;
  description.textContent = bundle.description;
  
  // Populate tools and prompts
  modalUI.populateToolsList(bundle);
  modalUI.populatePromptsList(bundle);
  
  // Set up tool configuration event listeners
  setupToolEventListeners();
  
  // Update install button state
  modalUI.updateInstallButtonState(bundle);
  
  // Show modal
  modal.style.display = 'block';
}

/**
 * Set up event listeners for tool configuration buttons
 */
function setupToolEventListeners() {
  const toolButtons = document.querySelectorAll('.tool-configure-btn');
  toolButtons.forEach(button => {
    if (!button.disabled) {
      button.addEventListener('click', () => {
        const toolData = JSON.parse(button.dataset.toolData);
        marketplaceIntegration.handleToolConfiguration(toolData);
      });
    }
  });
}

/**
 * Close the configuration modal
 */
function closeModal() {
  const modal = document.getElementById('bundle-configuration-modal');
  modal.style.display = 'none';
  currentBundle = null;
}

/**
 * Handle install remaining button
 */
function handleInstallRemaining() {
  if (!currentBundle) {
    console.error('No current bundle');
    return;
  }
  
  const uninstalledTools = bundleStatus.getUninstalledTools(currentBundle);
  
  if (uninstalledTools.length === 0) {
    alert('All tools are already installed!');
    return;
  }
  
  console.log('Installing remaining tools:', uninstalledTools);
  
  // Close modal temporarily
  closeModal();
  
  // Install tools sequentially
  marketplaceIntegration.installToolsSequentially(uninstalledTools, 0);
  
  // Refresh the bundles UI after installation
  setTimeout(() => {
    bundleUI.refreshBundles();
  }, 2000);
}
