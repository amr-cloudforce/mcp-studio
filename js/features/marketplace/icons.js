/**
 * Marketplace Icons
 * Contains Font Awesome icons for marketplace categories
 */

// Map of category names to Font Awesome icons
export const CATEGORY_ICONS = {
  'Dev Tools': '<i class="fas fa-code fa-2x"></i>',
  'AI Coding Agents': '<i class="fas fa-robot fa-2x"></i>',
  'Browser Automation': '<i class="fas fa-globe fa-2x"></i>',
  'Data Processing': '<i class="fas fa-database fa-2x"></i>',
  'API Integrations': '<i class="fas fa-plug fa-2x"></i>',
  'Search Tools': '<i class="fas fa-search fa-2x"></i>',
  'File Management': '<i class="fas fa-folder-open fa-2x"></i>',
  'Docker': '<i class="fab fa-docker fa-2x"></i>',
  'Python': '<i class="fab fa-python fa-2x"></i>',
  'Node.js': '<i class="fab fa-node-js fa-2x"></i>',
  'Uncategorized': '<i class="fas fa-question-circle fa-2x"></i>'
};

// Default icon for categories not in the map
export const DEFAULT_ICON = '<i class="fas fa-cube fa-2x"></i>';

/**
 * Get icon for a category
 * @param {string} category - Category name
 * @returns {string} - HTML icon as a string
 */
export function getCategoryIcon(category) {
  return CATEGORY_ICONS[category] || DEFAULT_ICON;
}
