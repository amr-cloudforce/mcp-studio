/**
 * Quick Add Form Module
 * Handles form generation, validation, and submission
 */

import { addTemplateInput } from './form-fields.js';
import { handleSubmit } from './form-submission.js';

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
 * Export the handleSubmit function
 */
export { handleSubmit };
