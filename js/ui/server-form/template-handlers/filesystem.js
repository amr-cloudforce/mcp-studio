/**
 * Filesystem Template Handler
 * Handles form generation and submission for the Filesystem template
 */

/**
 * Generate form for Filesystem template
 * @param {object} config - Server configuration
 * @returns {string} - Form HTML
 */
export function generateForm(config) {
  // Extract directories from args (skip the first two args which are -y and the package name)
  const directories = config.args.slice(2) || [];
  
  // Get documentation URL from templates
  const templates = window.quickAddTemplates || {};
  const docUrl = templates['filesystem-server']?.documentationUrl || 'https://github.com/modelcontextprotocol/servers/tree/main/src/filesystem';
  
  // Create form HTML
  return `
    <div class="form-group">
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <h3 style="margin: 0;">Filesystem Server</h3>
        <a href="${docUrl}" target="_blank" class="external-link">Documentation</a>
      </div>
      <label>Directories</label>
      <div id="quick-directory-container" class="directory-list-container">
        <!-- Directory rows will be added here -->
      </div>
      <button type="button" id="quick-add-directory-btn" class="btn btn-add">+ Add Directory</button>
    </div>
    <div class="form-group">
      <label><input type="checkbox" id="quick-disabled" ${config.disabled ? 'checked' : ''}> Disabled</label>
    </div>
  `;
}

/**
 * Initialize directory rows for the form
 * @param {string[]} directories - Array of directory paths
 */
export function initDirectoryRows(directories) {
  const container = document.getElementById('quick-directory-container');
  
  // Add directory rows
  directories.forEach(dir => {
    addDirectoryRow(container, dir);
  });
  
  // If no directories, add an empty row
  if (directories.length === 0) {
    addDirectoryRow(container, '');
  }
  
  // Set up add directory button
  document.getElementById('quick-add-directory-btn').addEventListener('click', () => {
    addDirectoryRow(container, '');
  });
}

/**
 * Add a directory row to the container
 * @param {HTMLElement} container - Container element
 * @param {string} directory - Directory path
 */
export function addDirectoryRow(container, directory) {
  const row = document.createElement('div');
  row.className = 'directory-row';
  row.innerHTML = `
    <div class="row">
      <input type="text" class="directory-input" value="${directory}" readonly>
      <button type="button" class="btn btn-reveal browse-btn">Browse</button>
      <button type="button" class="btn btn-del remove-btn">&times;</button>
    </div>
  `;
  container.appendChild(row);
  
  // Set up event listeners
  const browseBtn = row.querySelector('.browse-btn');
  const removeBtn = row.querySelector('.remove-btn');
  const input = row.querySelector('.directory-input');
  
  browseBtn.addEventListener('click', async () => {
    const directory = await window.api.selectDirectory();
    if (directory) {
      input.value = directory;
    }
  });
  
  removeBtn.addEventListener('click', () => {
    row.remove();
  });
}

/**
 * Handle Filesystem form submission
 * @param {object} config - Server configuration object to be modified
 * @returns {object} - Updated server configuration
 */
export function handleSubmit(config) {
  // Set command and args
  config.command = 'npx';
  
  // Get directories
  const directoryInputs = document.querySelectorAll('#quick-directory-container .directory-input');
  const directories = Array.from(directoryInputs)
    .map(input => input.value.trim())
    .filter(dir => dir !== '');
  
  // Check if at least one directory is selected
  if (directories.length === 0) {
    alert('Please select at least one directory');
    return null;
  }
  
  // Set args
  config.args = ['-y', '@modelcontextprotocol/server-filesystem', ...directories];
  
  // Set disabled flag
  const disabled = document.getElementById('quick-disabled').checked;
  if (disabled) config.disabled = true;
  
  // Store template ID in metadata
  if (!config.metadata) {
    config.metadata = {
      quickAddTemplate: 'filesystem-server',
      templateName: 'Filesystem Server'
    };
  }
  
  return config;
}
