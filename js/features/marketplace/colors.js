/**
 * Marketplace Colors
 * Contains colors for marketplace categories
 */

// Map of category names to colors
export const CATEGORY_COLORS = {
  'Dev Tools': '#4A56E2',
  'AI Coding Agents': '#6A3DE8',
  'Browser Automation': '#3498DB',
  'Data Processing': '#2ECC71',
  'API Integrations': '#E74C3C',
  'Search Tools': '#F39C12',
  'File Management': '#1ABC9C',
  'Docker': '#2980B9',
  'Python': '#27AE60',
  'Node.js': '#16A085',
  'Uncategorized': '#95A5A6'
};

// Default color for categories not in the map
export const DEFAULT_COLOR = 'var(--primary)';

/**
 * Get color for a category
 * @param {string} category - Category name
 * @returns {string} - CSS color
 */
export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || DEFAULT_COLOR;
}
