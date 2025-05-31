/**
 * Server Form Modal Operations
 * Handles modal opening, closing, and form filling
 */

import configManager from '../../config/config-manager.js';
import modalManager from '../modal-manager.js';
import * as utils from './utils.js';
import * as formFields from './form-fields.js';

/**
 * Open the server form modal
 * @param {Object} serverForm - The server form instance
 * @param {string} name - Server name (optional, for editing)
 */
export function openModal(serverForm, name = null) {
  if (name) {
    const server = configManager.getServer(name);
    if (server) {
      fillForm(serverForm, name, server.config, true);
    } else {
      console.error(`Server "${name}" not found`);
      return;
    }
  } else {
    fillForm(serverForm, '', { command: '', args: [], env: {} }, false);
  }
  
  modalManager.showModal(serverForm.modal);
}

/**
 * Open the server form modal with a pre-configured server
 * @param {Object} serverForm - The server form instance
 * @param {object} config - Server configuration object
 * @param {string} config.name - Server name
 * @param {object} config.config - Server configuration
 */
export function openModalWithConfig(serverForm, config) {
  if (!config || !config.config) {
    console.error('Invalid configuration object');
    return;
  }
  
  fillForm(serverForm, config.name || '', config.config, false);
  modalManager.showModal(serverForm.modal);
}

/**
 * Fill the form with server data
 * @param {Object} serverForm - The server form instance
 * @param {string} name - Server name
 * @param {object} config - Server configuration
 * @param {boolean} isExisting - Whether this is an existing server
 */
export function fillForm(serverForm, name, config, isExisting) {
  serverForm.currentServer = isExisting ? name : null;
  serverForm.modalTitle.textContent = isExisting ? 'Edit Server' : 'Add Server';
  
  // Reset form
  serverForm.form.reset();
  
  // Clear dynamic containers
  [serverForm.genericArgs, serverForm.genericEnv, serverForm.npxArgs, serverForm.npxEnv, 
   serverForm.dockerPorts, serverForm.dockerVolumes, serverForm.dockerEnv, serverForm.quickInputs, 
   serverForm.quickAdvancedOptions].forEach(c => c.innerHTML = '');
  
  // Add one blank row each
  utils.addGenericArg(serverForm.genericArgs, '');
  utils.addGenericEnv(serverForm.genericEnv, '', '');
  utils.addNpxArg(serverForm.npxArgs, '');
  utils.addNpxEnv(serverForm.npxEnv, '', '');
  utils.addDockerPort(serverForm.dockerPorts, '');
  utils.addDockerVolume(serverForm.dockerVolumes, '');
  utils.addDockerEnv(serverForm.dockerEnv, '', '');
  
  // Set name
  serverForm.nameInput.value = name || '';
  
  // Check if this is a Quick Add server
  const templateId = config.metadata && config.metadata.quickAddTemplate;
  if (templateId) {
    // This is a Quick Add server, show the quick view
    import('./quick-view.js').then(({ setupQuickView }) => {
      setupQuickView(serverForm, config, templateId);
    });
    return;
  }
  
  // Hide view toggle for non-Quick Add servers
  serverForm.viewToggleContainer.style.display = 'none';
  serverForm.typeSelector.style.display = 'block';
  
  // Detect type
  const type = config.command === 'npx' ? 'npx'
             : config.command === 'docker' ? 'docker'
             : 'generic';
  
  // Set type radio
  document.querySelector(`input[name="type"][value="${type}"]`).checked = true;
  const selectedRadio = document.querySelector(`input[name="type"][value="${type}"]`);
  selectedRadio.checked = true;
  selectedRadio.dispatchEvent(new Event('change'));
  
  // Fill type-specific fields
  if (type === 'generic') {
    formFields.setupGenericForm(config, serverForm.cmdInput, serverForm.genericArgs, serverForm.genericEnv, serverForm.genericDis);
  }
  
  if (type === 'npx') {
    formFields.setupNpxForm(config, serverForm.npxRepo, serverForm.npxFlags, serverForm.npxArgs, serverForm.npxEnv, serverForm.npxDis);
  }
  
  if (type === 'docker') {
    formFields.setupDockerForm(config, serverForm.dockerImage, serverForm.dockerFlags, serverForm.dockerPorts, serverForm.dockerVolumes, serverForm.dockerEnv, serverForm.dockerDis);
  }
}
