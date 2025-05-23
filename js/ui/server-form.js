/**
 * Server Form
 * Handles the server form functionality
 */

import configManager from '../config/config-manager.js';
import modalManager from './modal-manager.js';
import notifications from './notifications.js';
import * as FormFields from './server-form/form-fields.js';
import * as ViewModes from './server-form/view-modes.js';
import * as Utils from './server-form/utils.js';
import * as TavilyHandler from './server-form/template-handlers/tavily.js';
import * as FilesystemHandler from './server-form/template-handlers/filesystem.js';
import * as ApifyHandler from './server-form/template-handlers/apify.js';

class ServerForm {
  constructor() {
    this.form = document.getElementById('server-form');
    this.modal = document.getElementById('server-modal');
    this.modalTitle = document.getElementById('modal-title');
    this.nameInput = document.getElementById('server-name');
    
    this.viewToggleContainer = document.getElementById('view-toggle-container');
    this.quickSection = document.getElementById('section-quick');
    this.quickTemplateName = document.getElementById('quick-template-name');
    this.quickTemplateDesc = document.getElementById('quick-template-desc');
    this.quickInputs = document.getElementById('quick-inputs');
    this.quickShowAdvanced = document.getElementById('quick-show-advanced');
    this.quickAdvancedOptions = document.getElementById('quick-advanced-options');
    
    this.typeSelector = document.querySelector('.type-selector');
    
    this.cmdInput = document.getElementById('server-cmd');
    this.genericArgs = document.getElementById('args-container');
    this.genericEnv = document.getElementById('env-container');
    this.addArgBtnG = document.getElementById('add-arg-btn');
    this.addEnvBtnG = document.getElementById('add-env-btn');
    this.genericDis = document.getElementById('server-disabled');
    
    this.npxRepo = document.getElementById('npx-repo');
    this.npxFlags = document.querySelectorAll('#section-npx input[data-flag]');
    this.npxArgs = document.getElementById('npx-args-container');
    this.npxEnv = document.getElementById('npx-env-container');
    this.addArgBtnN = document.getElementById('add-npx-arg-btn');
    this.addEnvBtnN = document.getElementById('add-npx-env-btn');
    this.npxDis = document.getElementById('npx-disabled');
    
    this.dockerImage = document.getElementById('docker-image');
    this.dockerFlags = document.querySelectorAll('#section-docker input[data-flag]');
    this.dockerPorts = document.getElementById('docker-ports');
    this.dockerVolumes = document.getElementById('docker-volumes');
    this.dockerEnv = document.getElementById('docker-env-container');
    this.addPortBtn = document.getElementById('add-docker-port-btn');
    this.addVolBtn = document.getElementById('add-docker-volume-btn');
    this.addEnvBtnD = document.getElementById('add-docker-env-btn');
    this.dockerDis = document.getElementById('docker-disabled');
    
    this.cancelBtn = document.getElementById('cancel-btn');
    
    this.currentServer = null;
  }

  initialize() {
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    this.cancelBtn.addEventListener('click', () => modalManager.closeActiveModal());
    
    ViewModes.setupViewModeToggle(this.viewModeRadios, this.quickSection, this.typeSelector);
    ViewModes.setupQuickViewAdvancedOptionsToggle(this.quickShowAdvanced, this.quickAdvancedOptions);
    ViewModes.setupTypeSelector(this.typeRadios, this.quickSection, this.typeSelector);
    
    this.addArgBtnG.addEventListener('click', () => FormFields.addGenericArg(this.genericArgs, ''));
    this.addEnvBtnG.addEventListener('click', () => FormFields.addGenericEnv(this.genericEnv, '', ''));
    this.addArgBtnN.addEventListener('click', () => FormFields.addNpxArg(this.npxArgs, ''));
    this.addEnvBtnN.addEventListener('click', () => FormFields.addNpxEnv(this.npxEnv, '', ''));
    this.addPortBtn.addEventListener('click', () => FormFields.addDockerPort(this.dockerPorts, ''));
    this.addVolBtn.addEventListener('click', () => FormFields.addDockerVolume(this.dockerVolumes, ''));
    this.addEnvBtnD.addEventListener('click', () => FormFields.addDockerEnv(this.dockerEnv, '', ''));
    
    return this;
  }

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

  fillForm(name, config, isExisting) {
    this.currentServer = isExisting ? name : null;
    this.modalTitle.textContent = isExisting ? 'Edit Server' : 'Add Server';
    
    this.form.reset();
    
    [this.genericArgs, this.genericEnv, this.npxArgs, this.npxEnv, 
     this.dockerPorts, this.dockerVolumes, this.dockerEnv, this.quickInputs, 
     this.quickAdvancedOptions].forEach(c => c.innerHTML = '');
    
    FormFields.addGenericArg(this.genericArgs, '');
    FormFields.addGenericEnv(this.genericEnv, '', '');
    FormFields.addNpxArg(this.npxArgs, '');
    FormFields.addNpxEnv(this.npxEnv, '', '');
    FormFields.addDockerPort(this.dockerPorts, '');
    FormFields.addDockerVolume(this.dockerVolumes, '');
    FormFields.addDockerEnv(this.dockerEnv, '', '');
    
    this.nameInput.value = name || '';
    
    if (config.metadata && config.metadata.quickAddTemplate) {
      ViewModes.setupQuickView(this.viewToggleContainer, this.quickSection, this.typeSelector, this.quickTemplateName, this.quickTemplateDesc, Utils.getTemplateDescription, (cfg) => ViewModes.setupAdvancedView(this.cmdInput, this.genericDis, this.genericArgs, this.genericEnv, this.npxDis, this.npxFlags, this.npxRepo, this.npxArgs, this.npxEnv, this.dockerDis, this.dockerFlags, this.dockerImage, this.dockerEnv, FormFields.addGenericArg, FormFields.addGenericEnv, FormFields.addNpxArg, FormFields.addNpxEnv, FormFields.addDockerEnv, cfg), this.generateQuickViewForm.bind(this), config);
      return;
    }
    
    this.viewToggleContainer.style.display = 'none';
    this.typeSelector.style.display = 'block';
    
    const type = config.command === 'npx' ? 'npx'
               : config.command === 'docker' ? 'docker'
               : 'generic';
    
    document.querySelector(`input[name="type"][value="${type}"]`).checked = true;
    const selectedRadio = document.querySelector(`input[name="type"][value="${type}"]`);
    selectedRadio.checked = true;
    selectedRadio.dispatchEvent(new Event('change'));
    
    ViewModes.setupAdvancedView(this.cmdInput, this.genericDis, this.genericArgs, this.genericEnv, this.npxDis, this.npxFlags, this.npxRepo, this.npxArgs, this.npxEnv, this.dockerDis, this.dockerFlags, this.dockerImage, this.dockerEnv, FormFields.addGenericArg, FormFields.addGenericEnv, FormFields.addNpxArg, FormFields.addNpxEnv, FormFields.addDockerEnv, config);
  }

  async handleSubmit(e) {
    e.preventDefault();
    
    const name = this.nameInput.value.trim();
    
    if (!name) {
      alert('Name is required');
      return;
    }
    
    let config = { command: '', args: [] };
    
    const isQuickViewActive = document.querySelector('input[name="view-mode"][value="quick"]')?.checked;
    
    if (isQuickViewActive) {
      const templateId = this.quickTemplateName.dataset.templateId;
      
      const originalConfig = this.currentServer ? configManager.getServer(this.currentServer)?.config : null;
      if (originalConfig && originalConfig.metadata) {
        config.metadata = originalConfig.metadata;
      }
      
      switch (templateId) {
        case 'tavily-mcp':
          TavilyHandler.handleTavilySubmit(config);
          break;
        case 'filesystem-server':
          FilesystemHandler.handleFilesystemSubmit(config);
          break;
        case 'apify-web-adapter':
          ApifyHandler.handleApifySubmit(config);
          break;
        default:
          const type = document.querySelector('input[name="type"]:checked').value;
          Utils.handleAdvancedSubmit(config, type, this.cmdInput, this.genericArgs, this.genericEnv, this.genericDis, this.npxRepo, this.npxArgs, this.npxEnv, this.npxDis, this.dockerFlags, this.dockerImage, this.dockerPorts, this.dockerVolumes, this.dockerEnv, this.dockerDis);
          break;
      }
    } else {
      const type = document.querySelector('input[name="type"]:checked').value;
      Utils.handleAdvancedSubmit(config, type, this.cmdInput, this.genericArgs, this.genericEnv, this.genericDis, this.npxRepo, this.npxArgs, this.npxEnv, this.npxDis, this.dockerFlags, this.dockerImage, this.dockerPorts, this.dockerVolumes, this.dockerEnv, this.dockerDis);
    }
    
    configManager.updateServer(name, this.currentServer, config, config.disabled);
    await configManager.saveConfig();
    
    notifications.showRestartWarning();
    
    modalManager.closeActiveModal();
  }
  
  generateQuickViewForm(config) {
    const templateId = config.metadata.quickAddTemplate;
    
    this.quickInputs.innerHTML = '';
    this.quickAdvancedOptions.innerHTML = '';
    
    switch (templateId) {
      case 'tavily-mcp':
        TavilyHandler.generateTavilyForm(this.quickInputs, config);
        break;
      case 'filesystem-server':
        FilesystemHandler.generateFilesystemForm(this.quickInputs, config);
        break;
      case 'apify-web-adapter':
        ApifyHandler.generateApifyForm(this.quickInputs, config);
        break;
      default:
        this.quickInputs.innerHTML = `
          <div class="form-group">
            <p>This server was created with a Quick Add template that is no longer available.</p>
            <p>You can still edit it using the Advanced View.</p>
          </div>
        `;
        
        document.querySelector('input[name="view-mode"][value="advanced"]').checked = true;
        this.quickSection.classList.remove('active');
        const selectedType = document.querySelector('input[name="type"]:checked').value;
        document.getElementById(`section-${selectedType}`).classList.add('active');
        this.typeSelector.style.display = 'block';
    }
  }
}

const serverForm = new ServerForm();
export default serverForm;
