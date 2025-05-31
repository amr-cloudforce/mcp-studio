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

import modalManager from '../modal-manager.js';
import * as utils from './utils.js';
import * as formFields from './form-fields.js';
import * as viewModes from './view-modes.js';
import * as modalOperations from './modal-operations.js';
import * as formSubmission from './form-submission.js';

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
    this.form.addEventListener('submit', (e) => formSubmission.handleSubmit(e, this));
    
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
    return modalOperations.openModal(this, name);
  }
  
  /**
   * Open the server form modal with a pre-configured server
   * @param {object} config - Server configuration object
   * @param {string} config.name - Server name
   * @param {object} config.config - Server configuration
   */
  openModalWithConfig(config) {
    return modalOperations.openModalWithConfig(this, config);
  }

  /**
   * Fill the form with server data
   * @param {string} name - Server name
   * @param {object} config - Server configuration
   * @param {boolean} isExisting - Whether this is an existing server
   */
  fillForm(name, config, isExisting) {
    return modalOperations.fillForm(this, name, config, isExisting);
  }
}

// Create and export a singleton instance
const serverForm = new ServerForm();
export default serverForm;
