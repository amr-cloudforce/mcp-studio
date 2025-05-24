/**
 * Composio Marketplace Details Module
 * Handles item details view
 */

import { showDetailsView } from './modal.js';
import * as connector from './composio-connector.js';
import * as notifications from '../../ui/notifications-helper.js';
import configManager from '../../config/config-manager.js';
import { createExistingConnectionsContainer, showExistingConnections } from './existing-connections-handler.js';
import { createConnectionContainers, handleConnectionResponse, hideAllContainers } from './connection-flow-handler.js';

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
        <button id="composio-connect-btn" class="btn btn-primary">Connect</button>
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
            <li>Click "Connect" to connect to this app</li>
            <li>Complete any required authentication (OAuth or API key)</li>
            <li>Click "Check and Save" to automatically create an MCP server</li>
            <li>Start using the app with Claude</li>
          </ol>
          <p>For more information, refer to the Composio documentation.</p>
        </div>
      </div>
    </div>
  `;
  
  // Add connect button event listener
  document.getElementById('composio-connect-btn').addEventListener('click', () => {
    connectToApp(item);
  });
  
  // Create containers
  createExistingConnectionsContainer(detailsContainer, item);
  createConnectionContainers(detailsContainer, item);
}

/**
 * Connect to a Composio app
 * @param {Object} item - Composio marketplace item
 */
async function connectToApp(item) {
  try {
    // Show loading state
    const connectBtn = document.getElementById('composio-connect-btn');
    const originalText = connectBtn.textContent;
    connectBtn.textContent = 'Checking...';
    connectBtn.disabled = true;
    
    // Hide any previously shown containers
    hideAllContainers();
    
    // Check for existing connections first
    const existingConnections = await connector.checkExistingConnections(item.app_key);
    
    if (existingConnections.length > 0) {
      // Show existing connections
      showExistingConnections(existingConnections, item);
      
      // Reset button
      connectBtn.textContent = originalText;
      connectBtn.disabled = false;
      return;
    }
    
    // No existing connections, proceed with normal flow
    connectBtn.textContent = 'Connecting...';
    
    // Connect to the app (skip existing check since we already did it)
    const connection = await connector.connectToApp(item, true);
    
    // Handle connection response
    await handleConnectionResponse(connection, item);
    
    // Reset button
    connectBtn.textContent = originalText;
    connectBtn.disabled = false;
  } catch (error) {
    console.error('Error connecting to app:', error);
    notifications.showError(`Error connecting to ${item.repo_name}: ${error.message}`);
    
    // Reset button
    const connectBtn = document.getElementById('composio-connect-btn');
    connectBtn.textContent = 'Connect';
    connectBtn.disabled = false;
  }
}
