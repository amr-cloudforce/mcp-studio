/**
 * Existing Connections Handler Module
 * Handles existing connections UI and logic
 */

import * as connector from './composio-connector.js';
import * as notifications from '../../ui/notifications-helper.js';

/**
 * Create existing connections container
 * @param {HTMLElement} detailsContainer - The details container
 * @param {Object} item - Composio marketplace item
 */
export function createExistingConnectionsContainer(detailsContainer, item) {
  if (!document.getElementById('composio-existing-connections-container')) {
    const existingContainer = document.createElement('div');
    existingContainer.id = 'composio-existing-connections-container';
    existingContainer.className = 'existing-connections-container';
    existingContainer.style.display = 'none';
    existingContainer.innerHTML = `
      <div class="existing-connections-content">
        <h3>Existing Connections Found</h3>
        <p id="existing-connections-message"></p>
        <div id="existing-connections-list"></div>
        <div style="display: flex; gap: 10px; margin: 10px 0;">
          <button id="composio-delete-all-btn" class="btn btn-danger">Delete All</button>
          <button id="composio-continue-anyway-btn" class="btn btn-secondary">Continue Anyway</button>
        </div>
      </div>
    `;
    
    detailsContainer.insertBefore(existingContainer, detailsContainer.firstChild);
    
    document.getElementById('composio-delete-all-btn').addEventListener('click', () => {
      deleteAllAndConnect(item);
    });
    
    document.getElementById('composio-continue-anyway-btn').addEventListener('click', () => {
      proceedWithConnection(item);
    });
  }
}

/**
 * Show existing connections
 * @param {Array} connections - Array of existing connections
 * @param {Object} item - Composio marketplace item
 */
export function showExistingConnections(connections, item) {
  const container = document.getElementById('composio-existing-connections-container');
  const message = document.getElementById('existing-connections-message');
  const list = document.getElementById('existing-connections-list');
  
  message.textContent = `Found ${connections.length} existing connection(s) for ${item.repo_name}. Delete them first?`;
  
  list.innerHTML = connections.map(conn => `
    <div class="connection-item">
      <span>Connection ID: ${conn.id}</span>
      <span>Status: ${conn.status || 'Unknown'}</span>
      <span>Created: ${conn.created_at ? new Date(conn.created_at).toLocaleDateString() : 'Unknown'}</span>
    </div>
  `).join('');
  
  container.style.display = 'block';
}

/**
 * Delete all connections and then connect
 * @param {Object} item - Composio marketplace item
 */
async function deleteAllAndConnect(item) {
  try {
    const deleteBtn = document.getElementById('composio-delete-all-btn');
    const originalText = deleteBtn.textContent;
    deleteBtn.textContent = 'Deleting...';
    deleteBtn.disabled = true;
    
    await connector.deleteAllConnectionsForApp(item.app_key);
    
    document.getElementById('composio-existing-connections-container').style.display = 'none';
    
    await proceedWithConnection(item);
    
  } catch (error) {
    console.error('Error deleting connections:', error);
    notifications.showError(`Error deleting connections: ${error.message}`);
    
    const deleteBtn = document.getElementById('composio-delete-all-btn');
    deleteBtn.textContent = 'Delete All';
    deleteBtn.disabled = false;
  }
}

/**
 * Proceed with connection (skip existing check)
 * @param {Object} item - Composio marketplace item
 */
async function proceedWithConnection(item) {
  try {
    document.getElementById('composio-existing-connections-container').style.display = 'none';
    
    const connectBtn = document.getElementById('composio-connect-btn');
    connectBtn.textContent = 'Connecting...';
    connectBtn.disabled = true;
    
    const connection = await connector.connectToApp(item, true);
    
    // Import connection flow handler to handle the response
    const { handleConnectionResponse } = await import('./connection-flow-handler.js');
    await handleConnectionResponse(connection, item);
    
    connectBtn.textContent = 'Connect';
    connectBtn.disabled = false;
  } catch (error) {
    console.error('Error proceeding with connection:', error);
    notifications.showError(`Error connecting to ${item.repo_name}: ${error.message}`);
    
    const connectBtn = document.getElementById('composio-connect-btn');
    connectBtn.textContent = 'Connect';
    connectBtn.disabled = false;
  }
}
