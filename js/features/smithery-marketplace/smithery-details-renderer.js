/**
 * Smithery Details Renderer
 * Handles HTML rendering for server details
 */

import * as connector from './smithery-connector.js';
import { getDefaultConnectionType } from './smithery-config.js';

/**
 * Render server details content
 * @param {Object} server - Server details from API
 * @returns {string} HTML content
 */
export function renderServerDetails(server) {
  console.log('[DEBUG] Server data received:', server);
  console.log('[DEBUG] Server connections:', server.connections);
  
  const defaultConnectionType = getDefaultConnectionType(server);
  const hasStdio = server.connections?.some(conn => conn.type === 'stdio');
  const hasHttp = server.connections?.some(conn => conn.type === 'http');
  
  console.log('[DEBUG] hasHttp:', hasHttp, 'hasStdio:', hasStdio);
  console.log('[DEBUG] defaultConnectionType:', defaultConnectionType);
  
  const toolsList = server.tools?.map(tool => 
    `<li><strong>${escapeHtml(tool.name)}</strong>: ${escapeHtml(tool.description || 'No description')}</li>`
  ).join('') || '<li>No tools information available</li>';
  
  console.log('[DEBUG] About to render template with hasHttp:', hasHttp, 'hasStdio:', hasStdio);
  
  const htmlContent = `
    <div class="server-details">
      <div class="server-info collapsible">
        <h4 class="collapsible-header" data-target="server-description-content">
          <span class="collapse-icon">▶</span> Description
        </h4>
        <div id="server-description-content" class="collapsible-content collapsed">
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
      </div>
      
      <div class="server-tools collapsible">
        <h4 class="collapsible-header" data-target="server-tools-content">
          <span class="collapse-icon">▶</span> Available Tools
        </h4>
        <div id="server-tools-content" class="collapsible-content collapsed">
          <ul class="tools-list">${toolsList}</ul>
        </div>
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
        
        <div class="http-config" style="display: ${defaultConnectionType === 'http' ? 'block' : 'none'};">
          <div class="config-warning">
            <h5>⚠️ Configuration Required</h5>
            <p>Before installing, please configure any required parameters (API keys, etc.) on the Smithery website:</p>
            <p><a href="https://smithery.ai/server/${escapeHtml(server.qualifiedName)}" target="_blank" class="smithery-link">https://smithery.ai/server/${escapeHtml(server.qualifiedName)}</a></p>
            <p><small>Click the link above to configure the server parameters, then return here to install.</small></p>
          </div>
        </div>
        
        <div class="stdio-config" style="display: none;">
          <h5>Configuration Parameters</h5>
          <div id="stdio-params"></div>
        </div>
      </div>
      
      <div class="installation-form">
        <div class="form-group">
          <label for="smithery-server-name">Server Name:</label>
          <input type="text" id="smithery-server-name" value="${escapeHtml(connector.generateUniqueServerName(server.qualifiedName))}" placeholder="Enter server name">
        </div>
        
        <div class="form-actions">
          <button id="install-server" class="btn btn-primary">Install Server</button>
          <button id="close-details" class="btn btn-secondary">Close</button>
        </div>
      </div>
    </div>
  `;
  
  console.log('[DEBUG] Generated HTML content length:', htmlContent.length);
  console.log('[DEBUG] Connection types section:', htmlContent.includes('connection-types'));
  
  return htmlContent;
}

/**
 * Render stdio configuration parameters
 * @param {Object} server - Server details
 */
export function renderStdioParams(server) {
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
