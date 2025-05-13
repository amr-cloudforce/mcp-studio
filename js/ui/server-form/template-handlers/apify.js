/**
 * Apify Template Handler
 * Handles form generation and submission for the Apify template
 */

/**
 * Generate form for Apify template
 * @param {object} config - Server configuration
 * @returns {string} - Form HTML
 */
export function generateForm(config) {
  // Extract API key from env
  const apiKey = config.env && config.env.APIFY_TOKEN ? config.env.APIFY_TOKEN : '';
  
  // Create form HTML
  return `
    <div class="form-group">
      <label for="apify-api-key">Apify API Token</label>
      <input type="password" id="apify-api-key" value="${apiKey}">
      <small>Your Apify API token from apify.com</small>
    </div>
    <div class="form-group">
      <label>Actors <a href="https://apify.com/store" target="_blank" class="external-link" title="Browse Apify actors">Browse Actors</a></label>
      <div id="apify-actors-container" class="directory-list-container">
        <!-- Actor rows will be added here -->
      </div>
      <button type="button" id="apify-add-actor-btn" class="btn btn-add" style="display: block; margin-top: 10px; margin-bottom: 10px;">+ Add Actor</button>
      <small>Add one or more Apify actors to use. Each actor will be available as a tool.</small>
    </div>
    <div class="form-group">
      <label><input type="checkbox" id="quick-disabled" ${config.disabled ? 'checked' : ''}> Disabled</label>
    </div>
  `;
}

/**
 * Initialize actor rows for the form
 * @param {string[]} actors - Array of actor IDs
 */
export function initActorRows(actors) {
  const container = document.getElementById('apify-actors-container');
  
  // Add actor rows
  actors.forEach(actor => {
    addActorRow(container, actor);
  });
  
  // If no actors, add an empty row with default actor
  if (actors.length === 0) {
    addActorRow(container, 'filip_cicvarek/meetup-scraper');
  }
  
  // Set up add actor button
  document.getElementById('apify-add-actor-btn').addEventListener('click', () => {
    addActorRow(container, '');
  });
}

/**
 * Add an actor row to the container
 * @param {HTMLElement} container - Container element
 * @param {string} actor - Actor ID
 */
export function addActorRow(container, actor) {
  const row = document.createElement('div');
  row.className = 'actor-row';
  row.innerHTML = `
    <div class="row">
      <div class="actor-input-wrapper" style="flex: 1; position: relative;">
        <input type="text" class="actor-input" value="${actor}" placeholder="username/actor-name">
        <span class="actor-prefix" style="position: absolute; left: 8px; top: 50%; transform: translateY(-50%); color: #888; font-size: 0.9em; display: ${actor ? 'none' : 'block'};">apify.com/</span>
      </div>
      <button type="button" class="btn btn-reveal actor-info-btn" title="View actor details">ℹ️</button>
      <button type="button" class="btn btn-del remove-btn">&times;</button>
    </div>
  `;
  container.appendChild(row);
  
  // Set up event listeners
  const removeBtn = row.querySelector('.remove-btn');
  const infoBtn = row.querySelector('.actor-info-btn');
  const input = row.querySelector('.actor-input');
  const prefix = row.querySelector('.actor-prefix');
  
  // Remove button
  removeBtn.addEventListener('click', () => {
    row.remove();
  });
  
  // Info button
  infoBtn.addEventListener('click', () => {
    const actorId = input.value.trim();
    if (actorId) {
      window.api.openUrl(`https://apify.com/${actorId}`);
    } else {
      alert('Please enter an actor ID first');
    }
  });
  
  // Input field focus/blur
  input.addEventListener('focus', () => {
    prefix.style.display = 'none';
  });
  
  input.addEventListener('blur', () => {
    if (!input.value.trim()) {
      prefix.style.display = 'block';
    }
  });
  
  // Input field change
  input.addEventListener('input', () => {
    if (input.value.trim()) {
      prefix.style.display = 'none';
    } else {
      prefix.style.display = 'block';
    }
  });
}

/**
 * Handle Apify form submission
 * @param {object} config - Server configuration object to be modified
 * @returns {object} - Updated server configuration
 */
export function handleSubmit(config) {
  // Set command and args
  config.command = 'npx';
  
  // Get API key
  const apiKey = document.getElementById('apify-api-key').value.trim();
  
  // Get actors
  const actorInputs = document.querySelectorAll('#apify-actors-container .actor-input');
  const actors = Array.from(actorInputs)
    .map(input => input.value.trim())
    .filter(actor => actor !== '');
  
  // Check if at least one actor is provided
  if (actors.length === 0) {
    alert('Please add at least one Apify actor');
    return null;
  }
  
  // Join actors with commas
  const actorsString = actors.join(',');
  
  // Set args
  config.args = ['-y', '@modelcontextprotocol/server-apify-web-adapter', '--actors', actorsString];
  
  // Set environment variables
  config.env = {
    APIFY_TOKEN: apiKey
  };
  
  // Set disabled flag
  const disabled = document.getElementById('quick-disabled').checked;
  if (disabled) config.disabled = true;
  
  // Store template ID in metadata
  if (!config.metadata) {
    config.metadata = {
      quickAddTemplate: 'apify-web-adapter',
      templateName: 'Apify Web Adapter'
    };
  }
  
  return config;
}
