/**
 * Server Form - Filesystem Template Handler
 * Handles form generation and submission for the Filesystem template.
 */

export function generateFilesystemForm(quickInputs, config) {
  const directories = config.args.slice(2) || [];
  
  let formHtml = `
    <div class="form-group">
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
  
  quickInputs.innerHTML = formHtml;
  
  const container = document.getElementById('quick-directory-container');
  directories.forEach(dir => {
    addQuickDirectoryRow(container, dir);
  });
  
  if (directories.length === 0) {
    addQuickDirectoryRow(container, '');
  }
  
  document.getElementById('quick-add-directory-btn').addEventListener('click', () => {
    addQuickDirectoryRow(container, '');
  });
}

// Alias for generateFilesystemForm to maintain compatibility with index.js
export function generateForm(config) {
  const dummyElement = document.createElement('div');
  generateFilesystemForm(dummyElement, config);
  return dummyElement.innerHTML;
}

export function addQuickDirectoryRow(container, value) {
  const row = document.createElement('div');
  row.className = 'directory-row';
  row.innerHTML = `
    <div class="row">
      <input type="text" class="directory-input" placeholder="Select a directory" value="${value}" readonly>
      <button type="button" class="btn btn-reveal browse-btn">Browse</button>
      <button type="button" class="btn btn-del remove-btn">&times;</button>
    </div>
  `;
  container.appendChild(row);
  
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

// Function to initialize directory rows for index.js compatibility
export function initDirectoryRows(directories) {
  const container = document.getElementById('quick-directory-container');
  if (!container) return;
  
  // Clear existing rows
  container.innerHTML = '';
  
  // Add directory rows
  directories.forEach(dir => {
    addQuickDirectoryRow(container, dir);
  });
  
  // If no directories, add an empty row
  if (directories.length === 0) {
    addQuickDirectoryRow(container, '');
  }
  
  // Set up add directory button
  const addBtn = document.getElementById('quick-add-directory-btn');
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      addQuickDirectoryRow(container, '');
    });
  }
}

export function handleFilesystemSubmit(config) {
  config.command = 'npx';
  
  const directoryInputs = document.querySelectorAll('#quick-directory-container .directory-input');
  const directories = Array.from(directoryInputs)
    .map(input => input.value.trim())
    .filter(dir => dir !== '');
  
  if (directories.length === 0) {
    alert('Please select at least one directory');
    return;
  }
  
  config.args = ['-y', '@modelcontextprotocol/server-filesystem', ...directories];
  
  const disabled = document.getElementById('quick-disabled').checked;
  if (disabled) config.disabled = true;
  
  if (!config.metadata) {
    config.metadata = {
      quickAddTemplate: 'filesystem-server',
      templateName: 'Filesystem Server'
    };
  }
  
  return config;
}

// Alias for handleFilesystemSubmit to maintain compatibility with index.js
export function handleSubmit(config) {
  return handleFilesystemSubmit(config);
}
