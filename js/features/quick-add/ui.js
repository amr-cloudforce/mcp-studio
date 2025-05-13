/**
 * Quick Add UI Module
 * Handles template rendering and UI interactions
 */

let base;
let templateList;

/**
 * Initialize the UI module
 * @param {Object} baseModule - The base module instance
 */
export function init(baseModule) {
  base = baseModule;
  templateList = document.getElementById('template-list');
}

/**
 * Populate the template list
 * @param {Object} baseModule - The base module instance
 * @param {Object} templates - The templates object
 * @param {string} searchQuery - Optional search query to filter templates
 */
export function populateTemplateList(baseModule, templates, searchQuery = '') {
  templateList.innerHTML = '';
  
  // Filter templates based on search query if provided
  const filteredTemplates = filterTemplates(templates, searchQuery);
  
  // Check if we have any templates after filtering
  if (Object.keys(filteredTemplates).length === 0 && searchQuery) {
    showNoResultsMessage(searchQuery);
    return;
  }
  
  // Get all templates from the filtered templates object
  Object.entries(filteredTemplates).forEach(([id, template]) => {
    const card = createTemplateCard(id, template, searchQuery);
    templateList.appendChild(card);
  });
}

/**
 * Filter templates based on search query
 * @param {Object} templates - The templates object
 * @param {string} query - The search query
 * @returns {Object} - Filtered templates
 */
function filterTemplates(templates, query) {
  if (!query) return templates;
  
  const normalizedQuery = query.toLowerCase();
  const filtered = {};
  
  Object.entries(templates).forEach(([id, template]) => {
    // Search in name, description, and category
    if (
      template.name.toLowerCase().includes(normalizedQuery) ||
      template.description.toLowerCase().includes(normalizedQuery) ||
      template.category.toLowerCase().includes(normalizedQuery)
    ) {
      filtered[id] = template;
    }
  });
  
  return filtered;
}

/**
 * Show a message when no templates match the search query
 * @param {string} query - The search query
 */
function showNoResultsMessage(query) {
  const noResults = document.createElement('div');
  noResults.className = 'no-results';
  noResults.innerHTML = `
    <p>No templates found matching "${query}"</p>
    <button id="clear-search" class="btn btn-reveal">Clear Search</button>
  `;
  templateList.appendChild(noResults);
  
  // Add event listener to clear search button
  document.getElementById('clear-search').addEventListener('click', () => {
    // Dispatch event to clear search
    document.dispatchEvent(new CustomEvent('quickadd:search:clear'));
  });
}

/**
 * Create a template card
 * @param {string} id - The template ID
 * @param {Object} template - The template object
 * @param {string} searchQuery - The search query for highlighting
 * @returns {HTMLElement} - The template card element
 */
function createTemplateCard(id, template, searchQuery = '') {
  const card = document.createElement('div');
  card.className = 'template-card';
  card.dataset.templateId = id;
  
  // Check if template has an icon
  const iconHtml = template.icon 
    ? `<div class="template-icon"><img src="${template.icon}" alt="${template.name} icon" /></div>` 
    : '';
  
  // Highlight matching text if search query is provided
  let name = template.name;
  let description = template.description;
  let category = template.category;
  
  if (searchQuery) {
    const regex = new RegExp(`(${escapeRegExp(searchQuery)})`, 'gi');
    name = name.replace(regex, '<mark>$1</mark>');
    description = description.replace(regex, '<mark>$1</mark>');
    category = category.replace(regex, '<mark>$1</mark>');
  }
  
  card.innerHTML = `
    <span class="category">${category}</span>
    ${iconHtml}
    <h3>${name}</h3>
    <p>${description}</p>
  `;
  
  card.addEventListener('click', () => {
    // Dispatch custom event for template selection
    document.dispatchEvent(new CustomEvent('quickadd:template:selected', {
      detail: { templateId: id }
    }));
  });
  
  return card;
}

/**
 * Escape special characters in a string for use in a regular expression
 * @param {string} string - The string to escape
 * @returns {string} - The escaped string
 */
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
