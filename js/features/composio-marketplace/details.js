/**
 * Composio Marketplace Details Module
 * Handles item details view
 */

import quickAdd from '../../quick-add.js';
import { showDetailsView } from './modal.js';

// Current item being viewed
let currentItem = null;

/**
 * Set current item
 * @param {Object} item - Composio marketplace item
 */
export function setCurrentItem(item) {
  currentItem = item;
}

/**
 * Get current item
 * @returns {Object} - Current Composio marketplace item
 */
export function getCurrentItem() {
  return currentItem;
}

/**
 * Show item details
 * @param {Object} item - Composio marketplace item
 */
export function showItemDetails(item) {
  setCurrentItem(item);
  
  // Hide items view, show details view
  document.getElementById('composio-marketplace-items-view').style.display = 'none';
  document.getElementById('composio-marketplace-details-view').style.display = 'block';
  
  // Get the details container
  const detailsContainer = document.getElementById('composio-marketplace-details-container');
  
  // Populate details
  detailsContainer.innerHTML = `
    <div class="details-header">
      <div class="details-header-top">
        <h2>${item.repo_name}</h2>
        <button id="composio-import-server-btn" class="btn btn-success">Import Server</button>
      </div>
      <div class="details-meta">
        <span class="server-type">${item.server_type ? item.server_type.toUpperCase() : 'UNKNOWN'}</span>
        <span class="stars">⭐ ${item.stars || 0}</span>
        <span class="category">${item.category || 'Uncategorized'}</span>
      </div>
    </div>
    <div class="details-summary">
      <p>${item.summary_200_words || 'No description available'}</p>
    </div>
    <div class="details-readme">
      <h3>App Details</h3>
      <div id="composio-readme-content" class="readme-content">
        <div class="readme-html">
          <p>This Composio app provides integration with ${item.repo_name}.</p>
          <p>To use this app, you'll need to:</p>
          <ol>
            <li>Click "Import Server" to add this app to your MCP servers</li>
            <li>Configure any required authentication details</li>
            <li>Start using the app with Claude</li>
          </ol>
          <p>For more information, refer to the Composio documentation.</p>
        </div>
      </div>
    </div>
  `;
  
  // Add import button event listener
  document.getElementById('composio-import-server-btn').addEventListener('click', () => {
    importServer(item);
  });
}

/**
 * Import a server from the Composio marketplace
 * @param {Object} item - Composio marketplace item
 */
async function importServer(item) {
  try {
    // Show loading state
    const importBtn = document.getElementById('composio-import-server-btn');
    importBtn.textContent = 'Importing...';
    importBtn.disabled = true;
    
    // Get Composio service using the same approach as in quick-add-connection.js
    const composioService = require('./composio-service.js');
    
    // Initialize SDK if not already initialized
    try {
      const apiKey = localStorage.getItem('composioApiKey');
      if (apiKey) {
        composioService.initializeSDK(apiKey);
      } else {
        // For demo purposes, we'll use a placeholder
        // In a real app, we would prompt the user for their API key
        console.warn('No Composio API key found. Using demo connection.');
        addToQuickAddTemplates(item, {
          config: {
            command: 'npx',
            args: ['-y', '@composio/client', item.app_key],
            env: {
              COMPOSIO_CONNECTION_ID: 'demo-connection-id'
            }
          }
        });
        
        // Close the marketplace modal
        window.modalManager.closeActiveModal();
        
        // Open Quick Add modal
        quickAdd.openModal();
        
        return;
      }
    } catch (error) {
      console.warn('Failed to initialize Composio SDK:', error);
      alert('Failed to initialize Composio SDK: ' + error.message);
      importBtn.textContent = 'Import Server';
      importBtn.disabled = false;
      return;
    }
    
    // Initiate connection
    try {
      const connection = await composioService.initiateConnection(item.app_key);
      
      // Create server configuration
      const serverConfig = {
        command: 'npx',
        args: ['-y', '@composio/client', item.app_key],
        env: {
          COMPOSIO_CONNECTION_ID: connection.id
        }
      };
      
      // Add to Quick Add templates
      addToQuickAddTemplates(item, { config: serverConfig });
      
      // Close the marketplace modal
      window.modalManager.closeActiveModal();
      
      // Open Quick Add modal
      quickAdd.openModal();
    } catch (error) {
      console.error('Failed to initiate connection:', error);
      alert('Failed to initiate connection: ' + error.message);
      importBtn.textContent = 'Import Server';
      importBtn.disabled = false;
    }
  } catch (error) {
    alert(`Error importing server: ${error.message}`);
    const importBtn = document.getElementById('composio-import-server-btn');
    importBtn.textContent = 'Import Server';
    importBtn.disabled = false;
  }
}

/**
 * Add a Composio marketplace item to Quick Add templates
 * @param {Object} item - Composio marketplace item
 * @param {Object} config - Server configuration
 */
function addToQuickAddTemplates(item, config) {
  // Use app_key as the template ID
  const templateId = `composio-${item.app_key}`;
  
  // Create a template object
  const template = {
    name: item.repo_name,
    description: item.summary_200_words || 'No description available',
    category: 'Composio Apps',
    documentationUrl: null,
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234A56E2'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/%3E%3C/svg%3E`,
    userInputs: [],
    config: config.config
  };
  
  // Add the template to the global templates object
  window.quickAddTemplates[templateId] = template;
}
