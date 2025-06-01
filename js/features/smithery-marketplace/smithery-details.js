/**
 * Smithery Details - Server Details Modal & Installation Flow
 * Handles server details display and installation process
 */

import * as api from './smithery-api.js';
import * as connector from './smithery-connector.js';
import { getDefaultConnectionType } from './smithery-config.js';
import { renderServerDetails, renderStdioParams } from './smithery-details-renderer.js';

/**
 * Show server details modal
 * @param {string} qualifiedName - Server qualified name
 */
export async function showServerDetails(qualifiedName) {
  try {
    // Show loading state
    showDetailsModal('Loading...', '<div class="loading">Loading server details...</div>');
    
    // Fetch server details
    const server = await api.getServerDetails(qualifiedName);
    
    // Render details
    const title = server.displayName || server.qualifiedName;
    const content = renderServerDetails(server);
    
    showDetailsModal(title, content, server);
  } catch (error) {
    console.error('Failed to load server details:', error);
    showDetailsModal('Error', `<div class="error">Failed to load server details: ${error.message}</div>`);
  }
}



/**
 * Set up event listeners for details modal
 * @param {Object} server - Server details
 */
function setupDetailsEventListeners(server) {
  // Connection type change
  document.querySelectorAll('input[name="connection-type"]').forEach(radio => {
    radio.addEventListener('change', () => {
      handleConnectionTypeChange(server, radio.value);
    });
  });
  
  // Install button
  document.getElementById('install-server')?.addEventListener('click', () => {
    handleInstallServer(server);
  });
  
  // Close button
  document.getElementById('close-details')?.addEventListener('click', () => {
    closeDetailsModal();
  });
  
  // Collapsible sections
  document.querySelectorAll('.collapsible-header').forEach(header => {
    header.addEventListener('click', () => {
      toggleCollapsible(header);
    });
  });
  
  // Initialize with default connection type
  const defaultType = getDefaultConnectionType(server);
  handleConnectionTypeChange(server, defaultType);
}

/**
 * Handle connection type change
 * @param {Object} server - Server details
 * @param {string} connectionType - Selected connection type
 */
function handleConnectionTypeChange(server, connectionType) {
  const stdioConfig = document.querySelector('.stdio-config');
  const httpConfig = document.querySelector('.http-config');
  
  if (connectionType === 'stdio') {
    if (stdioConfig) {
      stdioConfig.style.display = 'block';
      renderStdioParams(server);
    }
    if (httpConfig) {
      httpConfig.style.display = 'none';
    }
  } else {
    if (stdioConfig) {
      stdioConfig.style.display = 'none';
    }
    if (httpConfig) {
      httpConfig.style.display = 'block';
    }
  }
}



/**
 * Handle server installation
 * @param {Object} server - Server details
 */
async function handleInstallServer(server) {
  console.log('[DEBUG] Install button clicked! Server:', server);
  
  const serverName = document.getElementById('smithery-server-name')?.value.trim();
  const connectionType = document.querySelector('input[name="connection-type"]:checked')?.value;
  
  console.log('[DEBUG] Server name:', serverName);
  console.log('[DEBUG] Connection type:', connectionType);
  
  if (!serverName) {
    alert('Please enter a server name');
    return;
  }
  
  if (connector.isServerNameTaken(serverName)) {
    alert('Server name already exists. Please choose a different name.');
    return;
  }
  
  try {
    console.log('[DEBUG] Starting installation...');
    
    // Show loading state
    const installBtn = document.getElementById('install-server');
    if (installBtn) {
      installBtn.textContent = 'Installing...';
      installBtn.disabled = true;
    }
    
    let success = false;
    
    if (connectionType === 'stdio') {
      console.log('[DEBUG] Installing stdio server...');
      const userConfig = collectStdioParams();
      success = await connector.installStdioServer(serverName, server, userConfig);
    } else {
      console.log('[DEBUG] Installing HTTP server...');
      success = await connector.installHttpServer(serverName, server);
    }
    
    console.log('[DEBUG] Installation result:', success);
    
    if (success) {
      console.log('[DEBUG] Installation successful, closing modal');
      closeDetailsModal();
    } else {
      console.log('[DEBUG] Installation failed');
      alert('Installation failed. Please try again.');
    }
  } catch (error) {
    console.error('[DEBUG] Installation error:', error);
    alert(`Installation failed: ${error.message}`);
  } finally {
    // Reset button state
    const installBtn = document.getElementById('install-server');
    if (installBtn) {
      installBtn.textContent = 'Install Server';
      installBtn.disabled = false;
    }
  }
}

/**
 * Collect stdio parameters from form
 * @returns {Object} User configuration
 */
function collectStdioParams() {
  const config = {};
  const paramInputs = document.querySelectorAll('[id^="param-"]');
  
  paramInputs.forEach(input => {
    const key = input.id.replace('param-', '');
    const value = input.value.trim();
    if (value) {
      config[key] = value;
    }
  });
  
  return config;
}

/**
 * Show details modal
 * @param {string} title - Modal title
 * @param {string} content - Modal content HTML
 * @param {Object} server - Server object (optional, for event listeners)
 */
function showDetailsModal(title, content, server = null) {
  // Hide items view, show details view (same pattern as Composio)
  document.getElementById('smithery-marketplace-items-view').style.display = 'none';
  document.getElementById('smithery-marketplace-details-view').style.display = 'block';
  
  // Get the details container
  const detailsContainer = document.getElementById('smithery-marketplace-details-container');
  
  // Set the content
  detailsContainer.innerHTML = content;
  
  // Set up event listeners after DOM is updated (only if server is provided)
  if (server) {
    // Use setTimeout to ensure DOM is fully updated
    setTimeout(() => {
      console.log('[DEBUG] Setting up event listeners for server:', server.qualifiedName);
      
      // Check if buttons exist
      const installBtn = document.getElementById('install-server');
      const closeBtn = document.getElementById('close-details');
      const radioButtons = document.querySelectorAll('input[name="connection-type"]');
      
      console.log('[DEBUG] Install button found:', !!installBtn);
      console.log('[DEBUG] Close button found:', !!closeBtn);
      console.log('[DEBUG] Radio buttons found:', radioButtons.length);
      
      setupDetailsEventListeners(server);
    }, 0);
  }
}

/**
 * Close details modal
 */
function closeDetailsModal() {
  // Show items view, hide details view (same pattern as Composio)
  document.getElementById('smithery-marketplace-items-view').style.display = 'block';
  document.getElementById('smithery-marketplace-details-view').style.display = 'none';
}

/**
 * Toggle collapsible section
 * @param {HTMLElement} header - The header element that was clicked
 */
function toggleCollapsible(header) {
  const targetId = header.getAttribute('data-target');
  const content = document.getElementById(targetId);
  const icon = header.querySelector('.collapse-icon');
  
  if (!content || !icon) return;
  
  if (content.classList.contains('collapsed')) {
    content.classList.remove('collapsed');
    icon.textContent = '▼';
  } else {
    content.classList.add('collapsed');
    icon.textContent = '▶';
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  if (typeof text !== 'string') return '';
  
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
