/**
 * Marketplace Icons
 * Contains Font Awesome icons for marketplace categories
 */

// Map of category names to Font Awesome icons
export const CATEGORY_ICONS = {
  'Dev Tools': '<i class="fas fa-code"></i>',
  'AI Coding Agents': '<i class="fas fa-robot"></i>',
  'Browser Automation': '<i class="fas fa-globe"></i>',
  'Data Processing': '<i class="fas fa-database"></i>',
  'API Integrations': '<i class="fas fa-plug"></i>',
  'Search Tools': '<i class="fas fa-search"></i>',
  'File Management': '<i class="fas fa-folder-open"></i>',
  'Docker': '<i class="fab fa-docker"></i>',
  'Python': '<i class="fab fa-python"></i>',
  'Node.js': '<i class="fab fa-node-js"></i>',
  'Uncategorized': '<i class="fas fa-question-circle"></i>'
};

// Default icon for categories not in the map
export const DEFAULT_ICON = '<i class="fas fa-cube"></i>';

/**
 * Get icon for a category
 * @param {string} category - Category name
 * @returns {string} - HTML icon as a string
 */
export function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || DEFAULT_ICON;
}
