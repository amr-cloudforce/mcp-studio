/**
 * Marketplace Details Module
 * Handles item details view
 */

import { formatRepoName, markdownToHtml } from './utils.js';
import { parseUrlResponse } from '../../utils/url-parser.js';
import quickAdd from '../../quick-add.js';

// Current item being viewed
let currentItem = null;

/**
 * Set current item
 * @param {Object} item - Marketplace item
 */
export function setCurrentItem(item) {
  currentItem = item;
}

/**
 * Get current item
 * @returns {Object} - Current marketplace item
 */
export function getCurrentItem() {
  return currentItem;
}

/**
 * Show item details
 * @param {Object} item - Marketplace item
 */
export function showItemDetails(item) {
  setCurrentItem(item);
  
  // Hide items view, show details view
  document.getElementById('marketplace-items-view').style.display = 'none';
  document.getElementById('marketplace-details-view').style.display = 'block';
  
  // Format the repository name
  const formattedName = formatRepoName(item.repo_name);
  
  // Get the details container
  const detailsContainer = document.getElementById('marketplace-details-container');
  
  // Populate details
  detailsContainer.innerHTML = `
    <div class="details-header">
      <div class="details-header-top">
        <h2>${formattedName}</h2>
        <button id="import-server-btn" class="btn btn-success">Import Server</button>
      </div>
      <div class="details-meta">
        <span class="server-type">${item.server_types ? item.server_types[0].toUpperCase() : (item.server_type ? item.server_type.toUpperCase() : 'UNKNOWN')}</span>
        <span class="stars">⭐ ${item.stars || 0}</span>
        <span class="category">${item.category || 'Uncategorized'}</span>
      </div>
    </div>
    <div class="details-summary">
      <p>${item.summary_50_words || item.summary_200_words || 'No description available'}</p>
    </div>
    ${item.topics && item.topics.length > 0 ? `
    <div class="details-topics">
      <h4>Topics</h4>
      <div class="topics-list">
        ${item.topics.map(topic => `<span class="topic-badge">${topic}</span>`).join('')}
      </div>
    </div>` : ''}
    ${item.sample_commands && item.sample_commands.length > 0 ? `
    <div class="details-commands">
      <h4>Sample Command</h4>
      <div class="command-box">
        <code>${item.sample_commands[0]}</code>
        <button class="copy-btn" onclick="navigator.clipboard.writeText('${item.sample_commands[0].replace(/'/g, "\\'")}')">Copy</button>
      </div>
    </div>` : ''}
    <div class="details-links">
      ${item.repo ? `<button class="btn btn-link external-link" onclick="require('electron').ipcRenderer.invoke('open-url', '${item.repo}')">View on GitHub</button>` : ''}
    </div>
    <div class="details-readme">
      <h3>README</h3>
      <div id="readme-content" class="readme-content">
        <div class="loading">Loading README...</div>
      </div>
    </div>
  `;
  
  // Load README
  if (item.readme_url) {
    loadReadme(item.readme_url);
  } else {
    document.getElementById('readme-content').innerHTML = `<div class="error">No README URL available</div>`;
  }
  
  // Add import button event listener
  document.getElementById('import-server-btn').addEventListener('click', () => {
    importServer(item);
  });
}

/**
 * Load README content
 * @param {string} url - README URL
 */
async function loadReadme(url) {
  const readmeContent = document.getElementById('readme-content');
  
  try {
    const response = await require('electron').ipcRenderer.invoke('fetch-url', url);
    
    // Convert markdown to HTML
    const html = markdownToHtml(response);
    
    readmeContent.innerHTML = `<div class="readme-html">${html}</div>`;
  } catch (error) {
    readmeContent.innerHTML = `<div class="error">Failed to load README: ${error.message}</div>`;
  }
}

/**
 * Import a server from the marketplace
 * @param {Object} item - Marketplace item
 */
async function importServer(item) {
  try {
    // Show loading state
    const importBtn = document.getElementById('import-server-btn');
    importBtn.textContent = 'Importing...';
    importBtn.disabled = true;
    
    // Try to use mcpServers configuration first
    if (item.mcpServers && item.mcpServers.length > 0) {
      const mcpServer = item.mcpServers[0];
      
      // Create config from mcpServers data
      const config = {
        config: {
          [mcpServer.id]: {
            command: mcpServer.tool,
            args: mcpServer.params || [],
            env: mcpServer.env || {}
          }
        }
      };
      
      // Close the marketplace modal
      window.modalManager.closeActiveModal();
      
      // Add the server to Quick Add templates
      addToQuickAddTemplates(item, config);
      
      // Open Quick Add modal
      quickAdd.openModal();
      return;
    }
    
    // Fallback to README parsing if no mcpServers data
    if (!item.readme_url) {
      alert('No server configuration or README URL available for this server');
      importBtn.textContent = 'Import Server';
      importBtn.disabled = false;
      return;
    }
    
    // Fetch the README
    const readmeContent = await require('electron').ipcRenderer.invoke('fetch-url', item.readme_url);
    
    // Parse the README to extract server configuration
    const config = parseUrlResponse(item.repo || '', readmeContent);
    
    if (!config) {
      alert('Could not find a valid server configuration in the README');
      importBtn.textContent = 'Import Server';
      importBtn.disabled = false;
      return;
    }
    
    // Close the marketplace modal
    window.modalManager.closeActiveModal();
    
    // Add the server to Quick Add templates
    addToQuickAddTemplates(item, config);
    
    // Open Quick Add modal
    quickAdd.openModal();
  } catch (error) {
    alert(`Error importing server: ${error.message}`);
    const importBtn = document.getElementById('import-server-btn');
    importBtn.textContent = 'Import Server';
    importBtn.disabled = false;
  }
}

/**
 * Add a marketplace item to Quick Add templates
 * @param {Object} item - Marketplace item
 * @param {Object} config - Server configuration
 */
function addToQuickAddTemplates(item, config) {
  // Use repo_name directly as the template ID without the "marketplace-" prefix
  const templateId = item.repo_name;
  
  // Format the name to be more human-readable
  const formattedName = formatRepoName(item.repo_name);
  
  // Truncate description to ~150 characters
  let description = item.summary_50_words || item.summary_200_words || 'No description available';
  if (description.length > 150) {
    // Find a good breaking point (end of sentence or space)
    let breakPoint = description.substring(0, 150).lastIndexOf('. ');
    if (breakPoint === -1 || breakPoint < 100) {
      breakPoint = description.substring(0, 150).lastIndexOf(' ');
    }
    if (breakPoint === -1) breakPoint = 150;
    
    description = description.substring(0, breakPoint) + '...';
  }
  
  // Extract user inputs dynamically from mcpServers data
  let userInputs = [];
  if (item.mcpServers && item.mcpServers.length > 0) {
    const mcpServer = item.mcpServers[0];
    const paramTypes = mcpServer.parameter_types || {};
    const paramDocs = mcpServer.parameter_docs || {};
    
    // Create user inputs for each parameter
    userInputs = Object.keys(paramTypes).map(paramName => {
      const paramType = paramTypes[paramName];
      const paramDoc = paramDocs[paramName] || '';
      
      // Map parameter types to Quick Add input types
      let inputType = 'text';
      if (paramType === 'bool' || paramType === 'boolean') {
        inputType = 'checkbox';
      } else if (paramType === 'number' || paramType === 'int') {
        inputType = 'number';
      } else if (paramType === 'password' || paramName.toLowerCase().includes('token') || paramName.toLowerCase().includes('key')) {
        inputType = 'password';
      }
      
      return {
        name: paramName,
        displayName: paramName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
        type: inputType,
        description: paramDoc,
        required: true,
        placeholder: paramType === 'bool' ? undefined : `Enter ${paramName.toLowerCase().replace(/_/g, ' ')}`
      };
    });
    
    console.log(`[MARKETPLACE DEBUG] Created ${userInputs.length} user inputs for ${item.repo_name}:`, userInputs);
  }
  
  // Create a template object
  const template = {
    name: formattedName,
    description: description,
    category: item.category || 'Marketplace',
    documentationUrl: item.repo,
    icon: `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='%234A56E2'%3E%3Cpath d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z'/%3E%3C/svg%3E`,
    userInputs: userInputs,
    config: config.config
  };
  
  // Add the template to the global templates object
  window.quickAddTemplates[templateId] = template;
}
