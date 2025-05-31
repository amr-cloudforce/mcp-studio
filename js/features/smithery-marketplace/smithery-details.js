/**
 * Smithery Details - Server Details Modal & Installation Flow
 * Handles server details display and installation process
 */

import * as api from './smithery-api.js';
import * as connector from './smithery-connector.js';
import { getDefaultConnectionType } from './smithery-config.js';

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
    
    showDetailsModal(title, content);
    setupDetailsEventListeners(server);
  } catch (error) {
    console.error('Failed to load server details:', error);
    showDetailsModal('Error', `<div class="error">Failed to load server details: ${error.message}</div>`);
  }
}

/**
 * Render server details content
 * @param {Object} server - Server details from API
 * @returns {string} HTML content
 */
function renderServerDetails(server) {
  const defaultConnectionType = getDefaultConnectionType(server);
  const hasStdio = server.connections?.some(conn => conn.type === 'stdio');
  const hasHttp = server.connections?.some(conn => conn.type === 'http');
  
  const toolsList = server.tools?.map(tool => 
    `<li><strong>${escapeHtml(tool.name)}</strong>: ${escapeHtml(tool.description || 'No description')}</li>`
  ).join('') || '<li>No tools information available</li>';
  
  return `
    <div class="server-details">
      <div class="server-info">
        <p class="server-description">${escapeHtml(server.description || 'No description available')}</p>
        
        <div class="server-meta">
          <div class="meta-item">
            <strong>Qualified Name:</strong> ${escapeHtml(server.qualifiedName)}
          </div>
          ${server.useCount ? `<div class="meta-item"><strong>Usage:</strong> ${server.useCount.toLocaleString()} uses</div>` : ''}
          ${server.createdAt ? `<div class="meta-item"><strong>Created:</strong> ${new Date(server.createdAt).toLocaleDateString()}</div>` : ''}
          ${server.homepage ? `<div class="meta-item"><strong>Homepage:</strong> <a href="${escapeHtml(server.homepage)}" target="_blank">View</a></div>` : ''}
        </div>
      </div>
      
      <div class="server-tools">
        <h4>Available Tools</h4>
        <ul class="tools-list">${toolsList}</ul>
      </div>
      
      <div class="connection-options">
        <h4>Installation Options</h4>
        <div class="connection-types">
          ${hasHttp ? `
            <div class="connection-type ${defaultConnectionType === 'http' ? 'recommended' : ''}">
              <input type="radio" id="conn-http" name="connection-type" value="http" ${defaultConnectionType === 'http' ? 'checked' : ''}>
              <label for="conn-http">
                <strong>Hosted (HTTP)</strong> ${defaultConnectionType === 'http' ? '<span class="badge">Recommended</span>' : ''}
                <br><small>Uses Smithery's hosted service via @smithery/cli</small>
              </label>
            </div>
          ` : ''}
          
          ${hasStdio ? `
            <div class="connection-type ${defaultConnectionType === 'stdio' ? 'recommended' : ''}">
              <input type="radio" id="conn-stdio" name="connection-type" value="stdio" ${defaultConnectionType === 'stdio' ? 'checked' : ''}>
              <label for="conn-stdio">
                <strong>Local (stdio)</strong> ${defaultConnectionType === 'stdio' ? '<span class="badge">Recommended</span>' : ''}
                <br><small>Runs locally on your machine</small>
              </label>
            </div>
          ` : ''}
        </div>
        
        <div class="stdio-config" style="display: none;">
          <h5>Configuration Parameters</h5>
          <div id="stdio-params"></div>
        </div>
      </div>
      
      <div class="installation-form">
        <div class="form-group">
          <label for="server-name">Server Name:</label>
          <input type="text" id="server-name" value="${escapeHtml(connector.generateUniqueServerName(server.qualifiedName))}" placeholder="Enter server name">
        </div>
        
        <div class="form-actions">
          <button id="install-server" class="btn btn-primary">Install Server</button>
          <button id="close-details" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  `;
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
  
  if (connectionType === 'stdio' && stdioConfig) {
    stdioConfig.style.display = 'block';
    renderStdioParams(server);
  } else if (stdioConfig) {
    stdioConfig.style.display = 'none';
  }
}

/**
 * Render stdio configuration parameters
 * @param {Object} server - Server details
 */
function renderStdioParams(server) {
  const stdioConnection = server.connections?.find(conn => conn.type === 'stdio');
  const paramsContainer = document.getElementById('stdio-params');
  
  if (!stdioConnection?.configSchema?.properties || !paramsContainer) {
    return;
  }
  
  const properties = stdioConnection.configSchema.properties;
  let html = '';
  
  Object.entries(properties).forEach(([key, schema]) => {
    const defaultValue = schema.default || '';
    const description = schema.description || '';
    
    html += `
      <div class="form-group">
        <label for="param-${key}">${key}:</label>
        <input type="text" id="param-${key}" value="${escapeHtml(defaultValue)}" placeholder="${escapeHtml(description)}">
        ${description ? `<small>${escapeHtml(description)}</small>` : ''}
      </div>
    `;
  });
  
  paramsContainer.innerHTML = html;
}

/**
 * Handle server installation
 * @param {Object} server - Server details
 */
async function handleInstallServer(server) {
  const serverName = document.getElementById('server-name')?.value.trim();
  const connectionType = document.querySelector('input[name="connection-type"]:checked')?.value;
  
  if (!serverName) {
    alert('Please enter a server name');
    return;
  }
  
  if (connector.isServerNameTaken(serverName)) {
    alert('Server name already exists. Please choose a different name.');
    return;
  }
  
  try {
    let success = false;
    
    if (connectionType === 'stdio') {
      const userConfig = collectStdioParams();
      success = await connector.installStdioServer(serverName, server, userConfig);
    } else {
      success = await connector.installHttpServer(serverName, server);
    }
    
    if (success) {
      closeDetailsModal();
    }
  } catch (error) {
    console.error('Installation failed:', error);
    alert(`Installation failed: ${error.message}`);
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
 */
function showDetailsModal(title, content) {
  // Implementation depends on existing modal system
  // This is a placeholder - should integrate with existing modal manager
  console.log('Show details modal:', title, content);
}

/**
 * Close details modal
 */
function closeDetailsModal() {
  // Implementation depends on existing modal system
  console.log('Close details modal');
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
