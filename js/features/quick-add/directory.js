/**
 * Quick Add Directory Module
 * Handles directory selection functionality
 */

/**
 * Initialize the directory module
 */
export function init() {
  // Add the first directory row
  addDirectoryRow();
  
  // Set up event listener for the add directory button
  document.getElementById('add-directory-btn').addEventListener('click', () => {
    addDirectoryRow();
  });
}

/**
 * Add a directory input row
 */
export function addDirectoryRow() {
  const container = document.getElementById('directory-list-container');
  const rowIndex = container.children.length;
  
  const row = document.createElement('div');
  row.className = 'directory-row';
  row.innerHTML = `
    <div class="row">
      <input type="text" 
             class="directory-input"
             id="directory-${rowIndex}" 
             placeholder="Select a directory" 
             readonly>
      <button type="button" class="btn btn-reveal browse-btn">Browse</button>
      <button type="button" class="btn btn-del remove-btn">&times;</button>
    </div>
  `;
  
  container.appendChild(row);
  
  // Set up event listeners for the browse and remove buttons
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
 * Get all selected directories
 * @returns {Array} - Array of selected directories
 */
export function getDirectories() {
  const directoryInputs = document.querySelectorAll('.directory-input');
  return Array.from(directoryInputs)
    .map(input => input.value.trim())
    .filter(dir => dir !== '');
}
