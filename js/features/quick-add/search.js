/**
 * Quick Add Search Module
 * Handles search input, filtering, and highlighting
 */

import * as ui from './ui.js';

let base;
let searchContainer;
let searchInput;

/**
 * Initialize the search module
 * @param {Object} baseModule - The base module instance
 */
export function init(baseModule) {
  base = baseModule;
  
  // Create search container if it doesn't exist
  createSearchContainer();
  
  // Initialize event listeners
  initEventListeners();
}

/**
 * Create the search container and input
 */
function createSearchContainer() {
  // Check if search container already exists
  if (document.getElementById('quick-add-search-container')) {
    searchContainer = document.getElementById('quick-add-search-container');
    searchInput = document.getElementById('quick-add-search-input');
    return;
  }
  
  // Create search container
  searchContainer = document.createElement('div');
  searchContainer.id = 'quick-add-search-container';
  searchContainer.className = 'search-container';
  
  // Create search input
  searchContainer.innerHTML = `
    <div class="search-input-wrapper">
      <input type="text" id="quick-add-search-input" placeholder="Search templates...">
      <button type="button" id="quick-add-search-clear" class="search-clear-btn">&times;</button>
    </div>
  `;
  
  // Insert search container before template list
  const templateList = document.getElementById('template-list');
  templateList.parentNode.insertBefore(searchContainer, templateList);
  
  // Get search input
  searchInput = document.getElementById('quick-add-search-input');
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
  // Search input event
  searchInput.addEventListener('input', handleSearchInput);
  
  // Clear button event
  document.getElementById('quick-add-search-clear').addEventListener('click', clearSearch);
  
  // Listen for custom clear search event
  document.addEventListener('quickadd:search:clear', clearSearch);
  
  // Add keyboard shortcut (Escape to clear search)
  searchInput.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      clearSearch();
    }
  });
}

/**
 * Handle search input
 */
function handleSearchInput() {
  const query = searchInput.value.trim();
  
  // Show/hide clear button
  const clearBtn = document.getElementById('quick-add-search-clear');
  clearBtn.style.display = query ? 'block' : 'none';
  
  // Update template list
  ui.populateTemplateList(base, base.getTemplates(), query);
}

/**
 * Clear search
 */
export function clearSearch() {
  searchInput.value = '';
  const clearBtn = document.getElementById('quick-add-search-clear');
  clearBtn.style.display = 'none';
  
  // Update template list
  ui.populateTemplateList(base, base.getTemplates(), '');
}

/**
 * Reset search
 */
export function resetSearch() {
  clearSearch();
}

/**
 * Focus search input
 */
export function focusSearchInput() {
  if (searchInput) {
    setTimeout(() => {
      searchInput.focus();
    }, 100);
  }
}
