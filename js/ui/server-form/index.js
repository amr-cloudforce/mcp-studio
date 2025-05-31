/*
 * CODING CONSTITUTION - MANDATORY RULES:
 * 
 * 1. Never change anything that has not been discussed with the user or is unrelated to the current task.
 * 2. Never add placeholders or dummy or demo data without an explicit request from the user.
 * 3. Never make a code file larger than 300 lines of code; if it exceeds this, split it as appropriate. 
 *    THE only exceptions ARE JSON DATA FILES, PACKAGE.JSON OR OTHER FILES THAT ARE NOT MEANT TO BE SPLIT.
 * 4. Never make assumptions on behalf of the user. If you don't know how to do something or keep going 
 *    round in circles, you stop and think about the cause instead of doing trial and error and wasting 
 *    the user's time and money.
 * 5. When there is a bug, your most important task is to identify the possible reasons and use debugging 
 *    techniques (don't ever ask the user to read code and debug for you) to reduce the search radius, 
 *    e.g. add a log that would confirm an assumption before starting to code.
 * 6. When you fix something and the error is not fixed because you made a wrong assumption, you undo 
 *    this yourself without an explicit request from the user.
 * 
 * WARNING: NOT ADHERING TO THESE LAWS IS CONSIDERED BREAKING THE LAW AND COULD LEAD TO SEVERE DAMAGE.
 */

/**
 * Server Form
 * Main entry point for the server form module
 */

import configManager from '../../config/config-manager.js';
import modalManager from '../modal-manager.js';
import notifications from '../notifications.js';
import * as utils from './utils.js';
import * as formFields from './form-fields.js';
import * as viewModes from './view-modes.js';
import * as tavilyHandler from './template-handlers/tavily.js';
import * as filesystemHandler from './template-handlers/filesystem.js';
import * as apifyHandler from './template-handlers/apify.js';
import * as composioHandler from './template-handlers/composio.js';

class ServerForm {
  constructor() {
    // Current server being edited
    this.currentServer = null;
    this.initialized = false;
  }
  
  // Initialize DOM elements and event listeners after modals are loaded
  initializeDOMElements() {
    if (this.initialized) return;
    
    // Form elements
    this.form = document.getElementById('server-form');
    this.modal = document.getElementById('server-modal');
    this.modalTitle = document.getElementById('modal-title');
    this.nameInput = document.getElementById('server-name');
    
    // View toggle
    this.viewToggleContainer = document.getElementById('view-toggle-container');
    this.viewModeRadios = document.querySelectorAll('input[name="view-mode"]');
    
    // Quick view elements
    this.quickSection = document.getElementById('section-quick');
    this.quickTemplateName = document.getElementById('quick-template-name');
    this.quickTemplateDesc = document.getElementById('quick-template-desc');
    this.quickInputs = document.getElementById('quick-inputs');
    this.quickShowAdvanced = document.getElementById('quick-show-advanced');
    this.quickAdvancedOptions = document.getElementById('quick-advanced-options');
    
    // Type selector
    this.typeSelector = document.querySelector('.type-selector');
    this.typeRadios = document.querySelectorAll('input[name="type"]');
    
    // Generic fields
    this.cmdInput = document.getElementById('server-cmd');
    this.genericArgs = document.getElementById('args-container');
    this.genericEnv = document.getElementById('env-container');
    this.addArgBtnG = document.getElementById('add-arg-btn');
    this.addEnvBtnG = document.getElementById('add-env-btn');
    this.genericDis = document.getElementById('server-disabled');
    
    // NPX fields
    this.npxRepo = document.getElementById('npx-repo');
    this.npxFlags = document.querySelectorAll('#section-npx input[data-flag]');
    this.npxArgs = document.getElementById('npx-args-container');
    this.npxEnv = document.getElementById('npx-env-container');
    this.addArgBtnN = document.getElementById('add-npx-arg-btn');
    this.addEnvBtnN = document.getElementById('add-npx-env-btn');
    this.npxDis = document.getElementById('npx-disabled');
    
    // Docker fields
    this.dockerImage = document.getElementById('docker-image');
    this.dockerFlags = document.querySelectorAll('#section-docker input[data-flag]');
    this.dockerPorts = document.getElementById('docker-ports');
    this.dockerVolumes = document.getElementById('docker-volumes');
    this.dockerEnv = document.getElementById('docker-env-container');
    this.addPortBtn = document.getElementById('add-docker-port-btn');
    this.addVolBtn = document.getElementById('add-docker-volume-btn');
    this.addEnvBtnD = document.getElementById('add-docker-env-btn');
    this.dockerDis = document.getElementById('docker-disabled');
    
    // Cancel button
    this.cancelBtn = document.getElementById('cancel-btn');
    
    this.initialized = true;
  }

  /**
   * Initialize the server form
   */
  initialize() {
    // Initialize DOM elements first
    this.initializeDOMElements();
    
    // Set up form submission handler
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    
    // Set up cancel button
    this.cancelBtn.addEventListener('click', () => modalManager.closeActiveModal());
    
    // Set up view mode toggle
    viewModes.initViewModeToggle(this.quickSection, this.typeSelector, this.viewModeRadios);
    
    // Set up quick view advanced options toggle
    viewModes.initAdvancedOptionsToggle(this.quickShowAdvanced, this.quickAdvancedOptions);
    
    // Set up type selector
    formFields.initTypeSelector(this.typeRadios);
    
    // Set up dynamic row buttons
    this.addArgBtnG.addEventListener('click', () => utils.addGenericArg(this.genericArgs, ''));
    this.addEnvBtnG.addEventListener('click', () => utils.addGenericEnv(this.genericEnv, '', ''));
    this.addArgBtnN.addEventListener('click', () => utils.addNpxArg(this.npxArgs, ''));
    this.addEnvBtnN.addEventListener('click', () => utils.addNpxEnv(this.npxEnv, '', ''));
    this.addPortBtn.addEventListener('click', () => utils.addDockerPort(this.dockerPorts, ''));
    this.addVolBtn.addEventListener('click', () => utils.addDockerVolume(this.dockerVolumes, ''));
    this.addEnvBtnD.addEventListener('click', () => utils.addDockerEnv(this.dockerEnv, '', ''));
    
    return this;
  }

  /**
   * Open the server form modal
   * @param {string} name - Server name (optional, for editing)
   */
  openModal(name = null) {
    if (name) {
      const server = configManager.getServer(name);
      if (server) {
        this.fillForm(name, server.config, true);
      } else {
        console.error(`Server "${name}" not found`);
        return;
      }
    } else {
      this.fillForm('', { command: '', args: [], env: {} }, false);
    }
    
    modalManager.showModal(this.modal);
  }
  
  /**
   * Open the server form modal with a pre-configured server
   * @param {object} config - Server configuration object
   * @param {string} config.name - Server name
   * @param {object} config.config - Server configuration
   */
  openModalWithConfig(config) {
    if (!config || !config.config) {
      console.error('Invalid configuration object');
      return;
    }
    
    this.fillForm(config.name || '', config.config, false);
    modalManager.showModal(this.modal);
  }

  /**
   * Fill the form with server data
   * @param {string} name - Server name
   * @param {object} config - Server configuration
   * @param {boolean} isExisting - Whether this is an existing server
   */
  fillForm(name, config, isExisting) {
    this.currentServer = isExisting ? name : null;
    this.modalTitle.textContent = isExisting ? 'Edit Server' : 'Add Server';
    
    // Reset form
    this.form.reset();
    
    // Clear dynamic containers
    [this.genericArgs, this.genericEnv, this.npxArgs, this.npxEnv, 
     this.dockerPorts, this.dockerVolumes, this.dockerEnv, this.quickInputs, 
     this.quickAdvancedOptions].forEach(c => c.innerHTML = '');
    
    // Add one blank row each
    utils.addGenericArg(this.genericArgs, '');
    utils.addGenericEnv(this.genericEnv, '', '');
    utils.addNpxArg(this.npxArgs, '');
    utils.addNpxEnv(this.npxEnv, '', '');
    utils.addDockerPort(this.dockerPorts, '');
    utils.addDockerVolume(this.dockerVolumes, '');
    utils.addDockerEnv(this.dockerEnv, '', '');
    
    // Set name
    this.nameInput.value = name || '';
    
    // Check if this is a Quick Add server
    const templateId = config.metadata && config.metadata.quickAddTemplate;
    if (templateId) {
      // This is a Quick Add server, show the quick view
      this.setupQuickView(config, templateId);
      return;
    }
    
    // Hide view toggle for non-Quick Add servers
    this.viewToggleContainer.style.display = 'none';
    this.typeSelector.style.display = 'block';
    
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
      formFields.setupGenericForm(config, this.cmdInput, this.genericArgs, this.genericEnv, this.genericDis);
    }
    
    if (type === 'npx') {
      formFields.setupNpxForm(config, this.npxRepo, this.npxFlags, this.npxArgs, this.npxEnv, this.npxDis);
    }
    
    if (type === 'docker') {
      formFields.setupDockerForm(config, this.dockerImage, this.dockerFlags, this.dockerPorts, this.dockerVolumes, this.dockerEnv, this.dockerDis);
    }
  }

  /**
   * Handle form submission
   * @param {Event} e - Form submit event
   */
  async handleSubmit(e) {
    e.preventDefault();
    
    const name = this.nameInput.value.trim();
    
    if (!name) {
      alert('Name is required');
      return;
    }
    
    let config = { command: '', args: [] };
    
    // Check if quick view is active
    const isQuickViewActive = document.querySelector('input[name="view-mode"][value="quick"]')?.checked;
    
    if (isQuickViewActive) {
      // Handle quick view form submission
      const templateId = this.quickTemplateName.dataset.templateId;
      
      // Get the original config to preserve metadata
      const originalConfig = this.currentServer ? configManager.getServer(this.currentServer)?.config : null;
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
        default:
          // For unknown templates, use the advanced view
          const type = document.querySelector('input[name="type"]:checked').value;
          config = this.handleAdvancedSubmit(config, type);
          break;
      }
      
      // If config is null, validation failed
      if (!config) return;
    } else {
      // Handle advanced view form submission
      const type = document.querySelector('input[name="type"]:checked').value;
      config = this.handleAdvancedSubmit(config, type);
      
      // If config is null, validation failed
      if (!config) return;
    }
    
    // Update configuration
    configManager.updateServer(name, this.currentServer, config, config.disabled);
    await configManager.saveConfig();
    
    // Show restart warning
    notifications.showRestartWarning();
    
    // Close modal
    modalManager.closeActiveModal();
  }
  
  /**
   * Handle advanced form submission
   * @param {object} config - Server configuration
   * @param {string} type - Server type
   * @returns {object} - Updated server configuration
   */
  handleAdvancedSubmit(config, type) {
    return formFields.handleAdvancedSubmit(
      type, config,
      this.cmdInput, this.genericArgs, this.genericEnv, this.genericDis,
      this.npxRepo, this.npxFlags, this.npxArgs, this.npxEnv, this.npxDis,
      this.dockerImage, this.dockerFlags, this.dockerPorts, this.dockerVolumes, this.dockerEnv, this.dockerDis
    );
  }
  
  /**
   * Set up the quick view for a Quick Add server
   * @param {object} config - Server configuration
   * @param {string} templateId - Template ID
   */
  setupQuickView(config, templateId) {
    // Set up view mode
    viewModes.setupViewMode(config, this.viewToggleContainer, this.quickSection, this.typeSelector, templateId);
    
    // Set template info
    this.quickTemplateName.textContent = config.metadata.templateName || 'Template';
    this.quickTemplateName.dataset.templateId = templateId;
    this.quickTemplateDesc.textContent = utils.getTemplateDescription(templateId);
    
    // Also set up the advanced view
    this.setupAdvancedView(config);
    
    // Generate quick view form based on template type
    this.generateQuickViewForm(config, templateId);
  }
  
  /**
   * Set up the advanced view for a Quick Add server
   * @param {object} config - Server configuration
   */
  setupAdvancedView(config) {
    // Detect type
    const type = config.command === 'npx' ? 'npx'
               : config.command === 'docker' ? 'docker'
               : 'generic';
    
    // Set type radio
    document.querySelector(`input[name="type"][value="${type}"]`).checked = true;
    
    // Fill type-specific fields
    if (type === 'generic') {
      formFields.setupGenericForm(config, this.cmdInput, this.genericArgs, this.genericEnv, this.genericDis);
    }
    
    if (type === 'npx') {
      formFields.setupNpxForm(config, this.npxRepo, this.npxFlags, this.npxArgs, this.npxEnv, this.npxDis);
    }
    
    if (type === 'docker') {
      formFields.setupDockerForm(config, this.dockerImage, this.dockerFlags, this.dockerPorts, this.dockerVolumes, this.dockerEnv, this.dockerDis);
    }
  }
  
  /**
   * Generate the quick view form based on template type
   * @param {object} config - Server configuration
   * @param {string} templateId - Template ID
   */
  generateQuickViewForm(config, templateId) {
    // Clear quick view containers
    this.quickInputs.innerHTML = '';
    this.quickAdvancedOptions.innerHTML = '';
    
    // Generate form based on template type
    switch (templateId) {
      case 'tavily-mcp':
        this.quickInputs.innerHTML = tavilyHandler.generateForm(config);
        break;
      case 'filesystem-server':
        this.quickInputs.innerHTML = filesystemHandler.generateForm(config);
        // Initialize directory rows
        const directories = config.args.slice(2) || [];
        filesystemHandler.initDirectoryRows(directories);
        break;
      case 'apify-web-adapter':
        this.quickInputs.innerHTML = apifyHandler.generateForm(config);
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
        this.quickInputs.innerHTML = composioHandler.generateForm(config);
        break;
      default:
        // For unknown templates, just show a message
        this.quickInputs.innerHTML = `
          <div class="form-group">
            <p>This server was created with a Quick Add template that is no longer available.</p>
            <p>You can still edit it using the Advanced View.</p>
          </div>
        `;
        
        // Switch to advanced view
        document.querySelector('input[name="view-mode"][value="advanced"]').checked = true;
        this.quickSection.classList.remove('active');
        const selectedType = document.querySelector('input[name="type"]:checked').value;
        document.getElementById(`section-${selectedType}`).classList.add('active');
        this.typeSelector.style.display = 'block';
    }
  }
}

// Create and export a singleton instance
const serverForm = new ServerForm();
export default serverForm;
