/**
 * Quick Add Base Module
 * Core initialization and coordination for the Quick Add feature
 */

import configManager from '../../config/config-manager.js';
import modalManager from '../../ui/modal-manager.js';
import notifications from '../../ui/notifications.js';
import quickAddTemplates from '../../quick-add-templates.js';
import * as ui from './ui.js';
import * as form from './form.js';
import * as search from './search.js';

class QuickAddBase {
  constructor() {
    this.currentTemplate = null;
    
    // DOM elements
    this.modal = document.getElementById('quick-add-modal');
    this.templateSelection = document.getElementById('template-selection');
    this.templateConfig = document.getElementById('template-config');
    this.backBtn = document.getElementById('back-to-templates');
    this.templateName = document.getElementById('selected-template-name');
    this.templateDesc = document.getElementById('selected-template-desc');
    this.form = document.getElementById('quick-add-form');
    this.nameInput = document.getElementById('quick-add-name');
    this.cancelBtn = document.getElementById('quick-add-cancel');
    
    // Initialize modules
    ui.init(this);
    form.init(this);
    search.init(this);
    
    // Initialize event listeners
    this.initEventListeners();
  }
  
  // Initialize event listeners
  initEventListeners() {
    this.form.addEventListener('submit', (e) => form.handleSubmit(e, this));
    this.backBtn.addEventListener('click', () => this.showTemplateSelection());
    this.cancelBtn.addEventListener('click', () => this.closeModal());
    
    // Custom events
    document.addEventListener('quickadd:template:selected', (e) => {
      this.selectTemplate(e.detail.templateId);
    });
  }
  
  // Open the Quick Add modal
  openModal() {
    this.showTemplateSelection();
    ui.populateTemplateList(this, quickAddTemplates);
    modalManager.showModal(this.modal);
    
    // Focus search input
    search.focusSearchInput();
  }
  
  // Close the Quick Add modal
  closeModal() {
    modalManager.closeActiveModal();
  }
  
  // Show template selection view
  showTemplateSelection() {
    this.templateSelection.style.display = 'block';
    this.templateConfig.style.display = 'none';
    
    // Reset search when going back to template selection
    search.resetSearch();
  }
  
  // Select a template
  selectTemplate(templateId) {
    this.currentTemplate = templateId;
    const template = quickAddTemplates[templateId];
    
    // Update template info
    this.templateName.textContent = template.name;
    this.templateDesc.textContent = template.description;
    
    // Documentation links are now handled by the template handlers
    
    // Generate a default name based on the template ID
    this.nameInput.value = templateId;
    
    // Generate form fields
    form.generateFormFields(this, template);
    
    // Show the template configuration view
    this.templateSelection.style.display = 'none';
    this.templateConfig.style.display = 'block';
  }
  
  // Get all templates
  getTemplates() {
    return quickAddTemplates;
  }
  
  // Add server to configuration
  async addServer(name, config, initialState) {
    // Add server to configuration
    configManager.addServer(name, config, initialState);
    
    // Save configuration
    await configManager.saveConfig();
    
    // Show restart warning
    notifications.showRestartWarning();
    
    // Close modal
    this.closeModal();
  }
}

// Create and export a singleton instance
const quickAddBase = new QuickAddBase();
export default quickAddBase;
