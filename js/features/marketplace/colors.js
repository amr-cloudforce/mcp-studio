/**
 * Marketplace Colors
 * Contains color gradients for marketplace categories
 */

// Map of category names to color gradients
export const CATEGORY_COLORS = {
  'Dev Tools': 'linear-gradient(135deg, #4A56E2, #8187DC)',
  'AI Coding Agents': 'linear-gradient(135deg, #6A3DE8, #9E7EE0)',
  'Browser Automation': 'linear-gradient(135deg, #3498DB, #85C1E9)',
  'Data Processing': 'linear-gradient(135deg, #2ECC71, #82E0AA)',
  'API Integrations': 'linear-gradient(135deg, #E74C3C, #F1948A)',
  'Search Tools': 'linear-gradient(135deg, #F39C12, #F8C471)',
  'File Management': 'linear-gradient(135deg, #1ABC9C, #76D7C4)',
  'Docker': 'linear-gradient(135deg, #2980B9, #7FB3D5)',
  'Python': 'linear-gradient(135deg, #27AE60, #7DCEA0)',
  'Node.js': 'linear-gradient(135deg, #16A085, #73C6B6)',
  'Uncategorized': 'linear-gradient(135deg, #95A5A6, #CCD1D1)'
};

// Default color for categories not in the map
export const DEFAULT_COLOR = 'linear-gradient(135deg, var(--primary-light), #f9faff)';

/**
 * Get color for a category
 * @param {string} category - Category name
 * @returns {string} - CSS color gradient
 */
export function getCategoryColor(category) {
  return CATEGORY_COLORS[category] || DEFAULT_COLOR;
}
