/**
 * Quick Add
 * Handles the Quick Add feature for MCP servers
 */

import configManager from './config/config-manager.js';
import modalManager from './ui/modal-manager.js';
import notifications from './ui/notifications.js';
import quickAddTemplates from './quick-add-templates.js';

class QuickAdd {
  constructor() {
    this.currentTemplate = null;
    
    // DOM elements
    this.modal = document.getElementById('quick-add-modal');
    this.closeBtn = document.getElementById('quick-add-close');
    this.templateList = document.getElementById('template-list');
    this.templateSelection = document.getElementById('template-selection');
    this.templateConfig = document.getElementById('template-config');
    this.backBtn = document.getElementById('back-to-templates');
    this.templateName = document.getElementById('selected-template-name');
    this.templateDesc = document.getElementById('selected-template-desc');
    this.form = document.getElementById('quick-add-form');
    this.nameInput = document.getElementById('quick-add-name');
    this.inputsContainer = document.getElementById('quick-add-inputs');
    this.showAdvanced = document.getElementById('show-advanced');
    this.advancedOptions = document.getElementById('advanced-options');
    this.cancelBtn = document.getElementById('quick-add-cancel');
    this.saveBtn = document.getElementById('quick-add-save');
    
    // Initialize event listeners
    this.initEventListeners();
  }
  
  // Initialize event listeners
  initEventListeners() {
    this.form.addEventListener('submit', this.handleSubmit.bind(this));
    this.backBtn.addEventListener('click', this.showTemplateSelection.bind(this));
    this.showAdvanced.addEventListener('change', this.toggleAdvancedOptions.bind(this));
    this.cancelBtn.addEventListener('click', () => this.closeModal());
  }
  
  // Open the Quick Add modal
  openModal() {
    this.showTemplateSelection();
    this.populateTemplateList();
    modalManager.showModal(this.modal);
  }
  
  // Close the Quick Add modal
  closeModal() {
    modalManager.closeActiveModal();
  }
  
  // Show template selection view
  showTemplateSelection() {
    this.templateSelection.style.display = 'block';
    this.templateConfig.style.display = 'none';
  }
  
  // Toggle advanced options
  toggleAdvancedOptions() {
    this.advancedOptions.style.display = this.showAdvanced.checked ? 'block' : 'none';
  }
  
  // Populate the template list
  populateTemplateList() {
    this.templateList.innerHTML = '';
    
    // Get all templates from the quickAddTemplates object
    Object.entries(quickAddTemplates).forEach(([id, template]) => {
      const card = document.createElement('div');
      card.className = 'template-card';
      card.dataset.templateId = id;
      
      card.innerHTML = `
        <span class="category">${template.category}</span>
        <h3>${template.name}</h3>
        <p>${template.description}</p>
      `;
      
      card.addEventListener('click', () => this.selectTemplate(id));
      this.templateList.appendChild(card);
    });
  }
  
  // Select a template
  selectTemplate(templateId) {
    this.currentTemplate = templateId;
    const template = quickAddTemplates[templateId];
    
    // Update template info
    this.templateName.textContent = template.name;
    this.templateDesc.textContent = template.description;
    
    // Generate a default name based on the template ID
    this.nameInput.value = templateId;
    
    // Clear previous inputs
    this.inputsContainer.innerHTML = '';
    this.advancedOptions.innerHTML = '';
    
    // Generate form fields for required inputs
    template.userInputs.forEach(input => {
      if (!input.advancedOnly) {
        this.addTemplateInput(input, this.inputsContainer);
      } else {
        this.addTemplateInput(input, this.advancedOptions);
      }
    });
    
    // Show the template configuration view
    this.templateSelection.style.display = 'none';
    this.templateConfig.style.display = 'block';
  }
  
  // Add a template input field
  addTemplateInput(input, container) {
    const div = document.createElement('div');
    div.className = 'form-group';
    
    let inputHtml = '';
    
    if (input.type === 'select') {
      // Create a select dropdown
      inputHtml = `
        <label for="input-${input.name}">${input.displayName}</label>
        <select id="input-${input.name}" name="${input.name}" ${input.required ? 'required' : ''}>
          ${input.options.map(opt => `<option value="${opt}" ${opt === input.default ? 'selected' : ''}>${opt}</option>`).join('')}
        </select>
      `;
    } else {
      // Create a text input
      inputHtml = `
        <label for="input-${input.name}">${input.displayName}</label>
        <input type="${input.secret ? 'password' : 'text'}" 
               id="input-${input.name}" 
               name="${input.name}" 
               placeholder="${input.placeholder || ''}" 
               value="${input.default || ''}" 
               ${input.required ? 'required' : ''}>
      `;
    }
    
    if (input.description) {
      inputHtml += `<small>${input.description}</small>`;
    }
    
    div.innerHTML = inputHtml;
    container.appendChild(div);
  }
  
  // Handle form submission
  async handleSubmit(e) {
    e.preventDefault();
    
    const template = quickAddTemplates[this.currentTemplate];
    const name = this.nameInput.value.trim();
    
    if (!name) {
      return alert('Server name is required');
    }
    
    // Get all input values
    const inputValues = {};
    template.userInputs.forEach(input => {
      const element = document.getElementById(`input-${input.name}`);
      if (element) {
        inputValues[input.name] = element.value;
      } else if (input.default) {
        inputValues[input.name] = input.default;
      }
    });
    
    // Check if any required fields are missing
    const missingRequired = template.userInputs
      .filter(input => input.required && !inputValues[input.name])
      .map(input => input.displayName);
    
    if (missingRequired.length > 0) {
      return alert(`Missing required fields: ${missingRequired.join(', ')}`);
    }
    
    // Create the server configuration
    const cfg = JSON.parse(JSON.stringify(template.config));
    
    // Replace template variables in args
    if (cfg.args) {
      cfg.args = cfg.args.map(arg => {
        if (typeof arg === 'string' && arg.includes('{')) {
          // Replace all {variable} with actual values
          return arg.replace(/{([^}]+)}/g, (match, varName) => {
            return inputValues[varName] || match;
          });
        }
        return arg;
      });
    }
    
    // Replace template variables in env
    if (cfg.env) {
      Object.keys(cfg.env).forEach(key => {
        const value = cfg.env[key];
        if (typeof value === 'string' && value.includes('{')) {
          cfg.env[key] = value.replace(/{([^}]+)}/g, (match, varName) => {
            return inputValues[varName] || match;
          });
        }
      });
    }
    
    // Check if server should be active or inactive
    const initialState = inputValues.initialState || 'active';
    
    // Add server to configuration
    configManager.addServer(name, cfg, initialState);
    
    // Save configuration
    await configManager.saveConfig();
    
    // Show restart warning
    notifications.showRestartWarning();
    
    // Close modal
    modalManager.closeActiveModal();
  }
}

// Create and export a singleton instance
const quickAdd = new QuickAdd();
export default quickAdd;
