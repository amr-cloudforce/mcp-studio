/**
 * Server Form - Apify Template Handler
 * Handles form generation and submission for the Apify template.
 */

export function generateApifyForm(quickInputs, config) {
  const apiKey = config.env && config.env.APIFY_TOKEN ? config.env.APIFY_TOKEN : '';
  const actorId = config.args && config.args.length > 3 ? config.args[3] : 'filip_cicvarek/meetup-scraper';
  
  const formHtml = `
    <div class="form-group">
      <label for="apify-api-key">Apify API Token</label>
      <input type="password" id="apify-api-key" value="${apiKey}">
      <small>Your Apify API token from apify.com</small>
    </div>
    <div class="form-group">
      <label for="apify-actor-id">Actor ID</label>
      <input type="text" id="apify-actor-id" value="${actorId}">
      <small>Apify actor to use (default: filip_cicvarek/meetup-scraper)</small>
    </div>
    <div class="form-group">
      <div id="apify-actor-container" class="actor-list-container">
        <!-- Actor rows will be added here -->
      </div>
      <button type="button" id="apify-add-actor-btn" class="btn btn-add">+ Add Actor</button>
    </div>
    <div class="form-group">
      <label><input type="checkbox" id="quick-disabled" ${config.disabled ? 'checked' : ''}> Disabled</label>
    </div>
  `;
  
  quickInputs.innerHTML = formHtml;
}

// Alias for generateApifyForm to maintain compatibility with index.js
export function generateForm(config) {
  const dummyElement = document.createElement('div');
  generateApifyForm(dummyElement, config);
  return dummyElement.innerHTML;
}

// Function to add an actor row
export function addActorRow(container, value) {
  const row = document.createElement('div');
  row.className = 'actor-row';
  row.innerHTML = `
    <div class="row">
      <input type="text" class="actor-input" placeholder="Enter actor ID" value="${value}">
      <button type="button" class="btn btn-del remove-btn">&times;</button>
    </div>
  `;
  container.appendChild(row);
  
  const removeBtn = row.querySelector('.remove-btn');
  removeBtn.addEventListener('click', () => {
    row.remove();
  });
}

// Function to initialize actor rows for index.js compatibility
export function initActorRows(actors) {
  const container = document.getElementById('apify-actor-container');
  if (!container) return;
  
  // Clear existing rows
  container.innerHTML = '';
  
  // Add actor rows
  actors.forEach(actor => {
    addActorRow(container, actor);
  });
  
  // If no actors, add an empty row
  if (actors.length === 0) {
    addActorRow(container, '');
  }
  
  // Set up add actor button
  const addBtn = document.getElementById('apify-add-actor-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      addActorRow(container, '');
    });
  }
}

export function handleApifySubmit(config) {
  config.command = 'npx';
  
  const apiKey = document.getElementById('apify-api-key').value.trim();
  const actorId = document.getElementById('apify-actor-id').value.trim() || 'filip_cicvarek/meetup-scraper';
  
  config.args = ['-y', '@modelcontextprotocol/server-apify-web-adapter', '--', actorId];
  
  config.env = {
    APIFY_TOKEN: apiKey
  };
  
  const disabled = document.getElementById('quick-disabled').checked;
  if (disabled) config.disabled = true;
  
  if (!config.metadata) {
    config.metadata = {
      quickAddTemplate: 'apify-web-adapter',
      templateName: 'Apify Web Adapter'
    };
  }
  
  return config;
}

// Alias for handleApifySubmit to maintain compatibility with index.js
export function handleSubmit(config) {
  return handleApifySubmit(config);
}
