/**
 * Quick Add Form Fields Module
 * Handles form field generation
 */

import * as directory from './directory.js';
import * as actor from './actor.js';

/**
 * Add a template input field
 * @param {Object} input - The input configuration
 * @param {HTMLElement} container - The container to add the input to
 */
export function addTemplateInput(input, container) {
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
  
  let inputHtml = '';
  
  if (input.type === 'select') {
    // Create a select dropdown
    inputHtml = `
      <label for="input-${input.name}">${input.displayName}</label>
      <select id="input-${input.name}" name="${input.name}" ${input.required ? 'required' : ''}>
        ${input.options.map(opt => `<option value="${opt}" ${opt === input.default ? 'selected' : ''}>${opt}</option>`).join('')}
      </select>
    `;
  } else if (input.type === 'checkbox') {
    // Create a checkbox input
    inputHtml = `
      <div class="checkbox-group">
        <input type="checkbox" 
               id="input-${input.name}" 
               name="${input.name}" 
               ${input.default === 'true' || input.default === true ? 'checked' : ''}>
        <label for="input-${input.name}">${input.displayName}</label>
      </div>
    `;
  } else if (input.type === 'file') {
    // Create a file input for paths
    inputHtml = `
      <label for="input-${input.name}">${input.displayName}</label>
      <input type="file" 
             id="input-${input.name}" 
             name="${input.name}" 
             ${input.required ? 'required' : ''}>
    `;
  } else if (input.type === 'number') {
    // Create a number input
    inputHtml = `
      <label for="input-${input.name}">${input.displayName}</label>
      <input type="number" 
             id="input-${input.name}" 
             name="${input.name}" 
             placeholder="${input.placeholder || ''}" 
             value="${input.default || ''}" 
             ${input.required ? 'required' : ''}>
    `;
  } else if (input.type === 'url') {
    // Create a URL input
    inputHtml = `
      <label for="input-${input.name}">${input.displayName}</label>
      <input type="url" 
             id="input-${input.name}" 
             name="${input.name}" 
             placeholder="${input.placeholder || 'https://example.com'}" 
             value="${input.default || ''}" 
             ${input.required ? 'required' : ''}>
    `;
  } else if (input.type === 'password') {
    // Create a password input
    inputHtml = `
      <label for="input-${input.name}">${input.displayName}</label>
      <input type="password" 
             id="input-${input.name}" 
             name="${input.name}" 
             placeholder="${input.placeholder || ''}" 
             value="${input.default || ''}" 
             ${input.required ? 'required' : ''}>
    `;
  } else {
    // Create a text input (default)
    inputHtml = `
      <label for="input-${input.name}">${input.displayName}</label>
      <input type="text" 
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
