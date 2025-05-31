/**
 * Server Form Submission
 * Handles form submission and validation
 */

import configManager from '../../config/config-manager.js';
import modalManager from '../modal-manager.js';
import notifications from '../notifications.js';
import * as formFields from './form-fields.js';
import * as tavilyHandler from './template-handlers/tavily.js';
import * as filesystemHandler from './template-handlers/filesystem.js';
import * as apifyHandler from './template-handlers/apify.js';
import * as composioHandler from './template-handlers/composio.js';
import * as zapierHandler from './template-handlers/zapier.js';

/**
 * Handle form submission
 * @param {Event} e - Form submit event
 * @param {Object} serverForm - The server form instance
 */
export async function handleSubmit(e, serverForm) {
  e.preventDefault();
  
  const name = serverForm.nameInput.value.trim();
  
  if (!name) {
    alert('Name is required');
    return;
  }
  
  let config = { command: '', args: [] };
  
  // Check if quick view is active
  const isQuickViewActive = document.querySelector('input[name="view-mode"][value="quick"]')?.checked;
  
  if (isQuickViewActive) {
    // Handle quick view form submission
    const templateId = serverForm.quickTemplateName.dataset.templateId;
    
    // Get the original config to preserve metadata
    const originalConfig = serverForm.currentServer ? configManager.getServer(serverForm.currentServer)?.config : null;
    if (originalConfig && originalConfig.metadata) {
      config.metadata = originalConfig.metadata;
    }
    
    // Handle based on template type
    switch (templateId) {
      case 'tavily-mcp':
        config = tavilyHandler.handleSubmit(config);
        break;
      case 'filesystem-server':
        config = filesystemHandler.handleSubmit(config);
        break;
      case 'apify-web-adapter':
        config = apifyHandler.handleSubmit(config);
        break;
      case 'composio-mcp':
        config = composioHandler.handleSubmit(config);
        break;
      case 'zapier-mcp':
        config = zapierHandler.handleSubmit(config);
        break;
      default:
        // For unknown templates, use the advanced view
        const type = document.querySelector('input[name="type"]:checked').value;
        config = handleAdvancedSubmit(serverForm, config, type);
        break;
    }
    
    // If config is null, validation failed
    if (!config) return;
  } else {
    // Handle advanced view form submission
    const type = document.querySelector('input[name="type"]:checked').value;
    config = handleAdvancedSubmit(serverForm, config, type);
    
    // If config is null, validation failed
    if (!config) return;
  }
  
  // Add or update configuration
  if (serverForm.currentServer) {
    // Editing existing server
    configManager.updateServer(name, serverForm.currentServer, config, config.disabled);
  } else {
    // Adding new server
    const state = config.disabled ? 'inactive' : 'active';
    configManager.addServer(name, config, state);
  }
  await configManager.saveConfig();
  
  // Show restart warning
  notifications.showRestartWarning();
  
  // Close modal
  modalManager.closeActiveModal();
}

/**
 * Handle advanced form submission
 * @param {Object} serverForm - The server form instance
 * @param {object} config - Server configuration
 * @param {string} type - Server type
 * @returns {object} - Updated server configuration
 */
export function handleAdvancedSubmit(serverForm, config, type) {
  return formFields.handleAdvancedSubmit(
    type, config,
    serverForm.cmdInput, serverForm.genericArgs, serverForm.genericEnv, serverForm.genericDis,
    serverForm.npxRepo, serverForm.npxFlags, serverForm.npxArgs, serverForm.npxEnv, serverForm.npxDis,
    serverForm.dockerImage, serverForm.dockerFlags, serverForm.dockerPorts, serverForm.dockerVolumes, serverForm.dockerEnv, serverForm.dockerDis
  );
}
