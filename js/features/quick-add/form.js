/**
 * Quick Add Form Module
 * Handles form generation, validation, and submission
 */

import * as directory from './directory.js';
import * as actor from './actor.js';
import * as appSelector from './app-selector.js';

let base;
let inputsContainer;
let advancedOptions;
let showAdvanced;

/**
 * Initialize the form module
 * @param {Object} baseModule - The base module instance
 */
export function init(baseModule) {
  base = baseModule;
  inputsContainer = document.getElementById('quick-add-inputs');
  advancedOptions = document.getElementById('advanced-options');
  showAdvanced = document.getElementById('show-advanced');
  
  // Initialize event listeners
  showAdvanced.addEventListener('change', toggleAdvancedOptions);
}

/**
 * Toggle advanced options
 */
function toggleAdvancedOptions() {
  advancedOptions.style.display = showAdvanced.checked ? 'block' : 'none';
}

/**
 * Generate form fields for a template
 * @param {Object} baseModule - The base module instance
 * @param {Object} template - The template object
 */
export function generateFormFields(baseModule, template) {
  // Clear previous inputs
  inputsContainer.innerHTML = '';
  advancedOptions.innerHTML = '';
  
  // Add documentation link if available
  if (template.documentationUrl) {
    const docContainer = document.createElement('div');
    docContainer.className = 'form-group';
    docContainer.style.marginBottom = '20px';
    docContainer.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0;">${template.name}</h3>
        <button class="btn btn-link external-link" onclick="require('electron').ipcRenderer.invoke('open-url', '${template.documentationUrl}')">Documentation</button>
      </div>
    `;
    inputsContainer.appendChild(docContainer);
  }
  
  // Generate form fields for required inputs
  template.userInputs.forEach(input => {
    if (!input.advancedOnly) {
      addTemplateInput(input, inputsContainer);
    } else {
      addTemplateInput(input, advancedOptions);
    }
  });
}

/**
 * Add a template input field
 * @param {Object} input - The input configuration
 * @param {HTMLElement} container - The container to add the input to
 */
function addTemplateInput(input, container) {
  const div = document.createElement('div');
  div.className = 'form-group';
  
  if (input.type === 'directory-list') {
    // Create a directory list input
    div.innerHTML = `
      <label>${input.displayName}</label>
      <div id="directory-list-container" class="directory-list-container">
        <!-- Directory rows will be added here -->
      </div>
      <button type="button" id="add-directory-btn" class="btn btn-add">+ Add Directory</button>
    `;
    
    if (input.description) {
      div.innerHTML += `<small>${input.description}</small>`;
    }
    
    container.appendChild(div);
    
    // Initialize directory functionality
    directory.init();
    
    return;
  }
  
  if (input.type === 'actor-list') {
    // Create an actor list input
    div.innerHTML = `
      <label>${input.displayName} <button class="btn btn-link external-link" onclick="require('electron').ipcRenderer.invoke('open-url', 'https://apify.com/store')" title="Browse Apify actors">Browse Actors</button></label>
      <div id="actor-list-container" class="directory-list-container">
        <!-- Actor rows will be added here -->
      </div>
      <button type="button" id="add-actor-btn" class="btn btn-add">+ Add Actor</button>
    `;
    
    if (input.description) {
      div.innerHTML += `<small>${input.description}</small>`;
    }
    
    container.appendChild(div);
    
    // Initialize actor functionality
    actor.init();
    
    return;
  }
  
  if (input.type === 'app-selector') {
    // Create an app selector input
    div.innerHTML = `
      <label for="input-${input.name}">${input.displayName}</label>
      <input type="hidden" id="input-${input.name}" name="${input.name}" ${input.required ? 'required' : ''}>
      ${appSelector.generateHtml()}
    `;
    
    if (input.description) {
      div.innerHTML += `<small>${input.description}</small>`;
    }
    
    container.appendChild(div);
    
    // Initialize app selector after a short delay to ensure DOM is ready
    setTimeout(() => {
      appSelector.initializeSelector();
    }, 100);
    
    return;
  }
  
  
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

/**
 * Handle form submission
 * @param {Event} e - The submit event
 * @param {Object} baseModule - The base module instance
 */
export async function handleSubmit(e, baseModule) {
  e.preventDefault();
  
  const templates = baseModule.getTemplates();
  const template = templates[baseModule.currentTemplate];
  const name = baseModule.nameInput.value.trim();
  
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
    .filter(input => {
      // Special case for directory-list type
      if (input.type === 'directory-list') {
        // Get all directory inputs
        const directoryInputs = document.querySelectorAll('.directory-input');
        const directories = Array.from(directoryInputs)
          .map(input => input.value.trim())
          .filter(dir => dir !== '');
        
        // Check if at least one directory is selected
        return directories.length === 0;
      }
      
      // Special case for actor-list type
      if (input.type === 'actor-list') {
        // Get all actor inputs
        const actorInputs = document.querySelectorAll('.actor-input');
        const actors = Array.from(actorInputs)
          .map(input => input.value.trim())
          .filter(actor => actor !== '');
        
        // Check if at least one actor is selected
        return actors.length === 0;
      }
      
      return input.required && !inputValues[input.name];
    })
    .map(input => input.displayName);
  
  if (missingRequired.length > 0) {
    return alert(`Missing required fields: ${missingRequired.join(', ')}`);
  }
  
  // Create the server configuration
  const cfg = JSON.parse(JSON.stringify(template.config));
  
  // Add metadata to track that this server was created with Quick Add
  cfg.metadata = {
    quickAddTemplate: baseModule.currentTemplate,
    templateName: template.name
  };
  
  // Special case for filesystem-server: collect directories
  if (baseModule.currentTemplate === 'filesystem-server') {
    // Get all directory inputs
    const directoryInputs = document.querySelectorAll('.directory-input');
    const directories = Array.from(directoryInputs)
      .map(input => input.value.trim())
      .filter(dir => dir !== '');
    
    // Check if at least one directory is selected
    if (directories.length === 0) {
      return alert('Please select at least one directory');
    }
    
    // Add directories to args
    cfg.args = [...cfg.args, ...directories];
  } 
  // Special case for apify-web-adapter: collect actors
  else if (baseModule.currentTemplate === 'apify-web-adapter') {
    // Get all actor inputs
    const actorInputs = document.querySelectorAll('.actor-input');
    const actors = Array.from(actorInputs)
      .map(input => input.value.trim())
      .filter(actor => actor !== '');
    
    // Check if at least one actor is selected
    if (actors.length === 0) {
      return alert('Please add at least one Apify actor');
    }
    
    // Join actors with commas and replace the {actorIds} placeholder
    const actorsString = actors.join(',');
    inputValues.actorIds = actorsString;
    
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
  } else {
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
  baseModule.addServer(name, cfg, initialState);
}
