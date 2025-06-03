/**
 * Bundle Modal UI Components
 * Handles UI rendering for bundle configuration modal
 */

import * as bundleStatus from './status.js';

/**
 * Create a tool element
 * @param {Object} tool - Tool object
 * @param {boolean} isInstalled - Whether tool is installed
 * @returns {HTMLElement} Tool element
 */
export function createToolElement(tool, isInstalled) {
  const toolDiv = document.createElement('div');
  toolDiv.className = `bundle-tool-item ${isInstalled ? 'installed' : 'not-installed'}`;
  
  const statusIcon = isInstalled ? '✓' : '☐';
  const statusText = isInstalled ? 'Installed' : 'Configure';
  const buttonClass = isInstalled ? 'btn-success' : 'btn-primary';
  const buttonDisabled = isInstalled ? 'disabled' : '';
  
  toolDiv.innerHTML = `
    <div class="tool-info">
      <span class="tool-status">${statusIcon}</span>
      <span class="tool-name">${escapeHtml(tool.displayName)}</span>
      <span class="tool-type">(${tool.type})</span>
    </div>
    <button class="btn ${buttonClass} tool-configure-btn" 
            data-tool-type="${tool.type}" 
            data-tool-data="${escapeHtml(JSON.stringify(tool))}"
            ${buttonDisabled}>
      ${statusText}
    </button>
  `;
  
  return toolDiv;
}

/**
 * Create a prompt element
 * @param {Object} prompt - Prompt object
 * @returns {HTMLElement} Prompt element
 */
export function createPromptElement(prompt) {
  const promptDiv = document.createElement('div');
  promptDiv.className = 'bundle-prompt-item';
  
  promptDiv.innerHTML = `
    <div class="prompt-header">
      <span class="prompt-name">${escapeHtml(prompt.name)}</span>
    </div>
    <div class="prompt-description">${escapeHtml(prompt.description)}</div>
    <div class="prompt-content">${escapeHtml(prompt.content)}</div>
  `;
  
  return promptDiv;
}

/**
 * Populate the tools list
 * @param {Object} bundle - Bundle object
 */
export function populateToolsList(bundle) {
  const toolsList = document.getElementById('bundle-tools-list');
  toolsList.innerHTML = '';
  
  bundle.tools.forEach(tool => {
    const isInstalled = bundleStatus.isToolInstalled(tool);
    const toolElement = createToolElement(tool, isInstalled);
    toolsList.appendChild(toolElement);
  });
}

/**
 * Populate the prompts list
 * @param {Object} bundle - Bundle object
 */
export function populatePromptsList(bundle) {
  const promptsList = document.getElementById('bundle-prompts-list');
  promptsList.innerHTML = '';
  
  if (!bundle.prompts || bundle.prompts.length === 0) {
    promptsList.innerHTML = '<div class="no-prompts">No prompts included in this bundle</div>';
    return;
  }
  
  bundle.prompts.forEach(prompt => {
    const promptElement = createPromptElement(prompt);
    promptsList.appendChild(promptElement);
  });
}

/**
 * Update install button state
 * @param {Object} bundle - Bundle object
 */
export function updateInstallButtonState(bundle) {
  const installBtn = document.getElementById('bundle-install-remaining');
  const uninstalledTools = bundleStatus.getUninstalledTools(bundle);
  
  if (uninstalledTools.length === 0) {
    installBtn.textContent = 'All Tools Installed';
    installBtn.disabled = true;
    installBtn.className = 'btn btn-success';
  } else {
    installBtn.textContent = `Install Remaining (${uninstalledTools.length})`;
    installBtn.disabled = false;
    installBtn.className = 'btn btn-primary';
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
