/**
 * Server Form Quick View
 * Handles quick view setup and form generation
 */

import * as utils from './utils.js';
import * as formFields from './form-fields.js';
import * as viewModes from './view-modes.js';
import * as tavilyHandler from './template-handlers/tavily.js';
import * as filesystemHandler from './template-handlers/filesystem.js';
import * as apifyHandler from './template-handlers/apify.js';
import * as composioHandler from './template-handlers/composio.js';
import * as zapierHandler from './template-handlers/zapier.js';

/**
 * Set up the quick view for a Quick Add server
 * @param {Object} serverForm - The server form instance
 * @param {object} config - Server configuration
 * @param {string} templateId - Template ID
 */
export function setupQuickView(serverForm, config, templateId) {
  // Set up view mode
  viewModes.setupViewMode(config, serverForm.viewToggleContainer, serverForm.quickSection, serverForm.typeSelector, templateId);
  
  // Set template info
  serverForm.quickTemplateName.textContent = config.metadata.templateName || 'Template';
  serverForm.quickTemplateName.dataset.templateId = templateId;
  serverForm.quickTemplateDesc.textContent = utils.getTemplateDescription(templateId);
  
  // Also set up the advanced view
  setupAdvancedView(serverForm, config);
  
  // Generate quick view form based on template type
  generateQuickViewForm(serverForm, config, templateId);
}

/**
 * Set up the advanced view for a Quick Add server
 * @param {Object} serverForm - The server form instance
 * @param {object} config - Server configuration
 */
export function setupAdvancedView(serverForm, config) {
  // Detect type
  const type = config.command === 'npx' ? 'npx'
             : config.command === 'docker' ? 'docker'
             : 'generic';
  
  // Set type radio
  document.querySelector(`input[name="type"][value="${type}"]`).checked = true;
  
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

/**
 * Generate the quick view form based on template type
 * @param {Object} serverForm - The server form instance
 * @param {object} config - Server configuration
 * @param {string} templateId - Template ID
 */
export function generateQuickViewForm(serverForm, config, templateId) {
  // Clear quick view containers
  serverForm.quickInputs.innerHTML = '';
  serverForm.quickAdvancedOptions.innerHTML = '';
  
  // Generate form based on template type
  switch (templateId) {
    case 'tavily-mcp':
      serverForm.quickInputs.innerHTML = tavilyHandler.generateForm(config);
      break;
    case 'filesystem-server':
      serverForm.quickInputs.innerHTML = filesystemHandler.generateForm(config);
      // Initialize directory rows
      const directories = config.args.slice(2) || [];
      filesystemHandler.initDirectoryRows(directories);
      break;
    case 'apify-web-adapter':
      serverForm.quickInputs.innerHTML = apifyHandler.generateForm(config);
      // Parse existing actors from config
      const actorsString = config.args && config.args.length > 3 ? config.args[3] : '';
      const actors = actorsString ? actorsString.split(',') : [];
      console.log('Initializing Apify actors:', actors);
      // Initialize actor rows with a slight delay to ensure DOM is ready
      setTimeout(() => {
        apifyHandler.initActorRows(actors);
        // Make sure the add button is visible
        const addBtn = document.getElementById('apify-add-actor-btn');
        if (addBtn) {
          addBtn.style.display = 'block';
          addBtn.style.marginTop = '10px';
          addBtn.style.marginBottom = '10px';
        }
      }, 100);
      break;
    case 'composio-mcp':
      serverForm.quickInputs.innerHTML = composioHandler.generateForm(config);
      break;
    case 'zapier-mcp':
      serverForm.quickInputs.innerHTML = zapierHandler.generateForm(config);
      break;
    default:
      // For unknown templates, just show a message
      serverForm.quickInputs.innerHTML = `
        <div class="form-group">
          <p>This server was created with a Quick Add template that is no longer available.</p>
          <p>You can still edit it using the Advanced View.</p>
        </div>
      `;
      
      // Switch to advanced view
      document.querySelector('input[name="view-mode"][value="advanced"]').checked = true;
      serverForm.quickSection.classList.remove('active');
      const selectedType = document.querySelector('input[name="type"]:checked').value;
      document.getElementById(`section-${selectedType}`).classList.add('active');
      serverForm.typeSelector.style.display = 'block';
  }
}
