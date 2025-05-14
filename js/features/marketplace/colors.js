/**
 * Marketplace Colors
 * Contains colors for marketplace categories
 */

// Map of category names to colors - using a more varied and interesting palette
export const CATEGORY_COLORS = {
  'Dev Tools': '#4361ee',         // Vibrant blue
  'AI Coding Agents': '#7209b7',  // Rich purple
  'Browser Automation': '#3a86ff', // Bright blue
  'Data Processing': '#38b000',   // Fresh green
  'API Integrations': '#d90429',  // Vibrant red
  'Search Tools': '#ff9f1c',      // Warm orange
  'File Management': '#00b4d8',   // Cyan blue
  'Docker': '#0077b6',            // Deep blue
  'Python': '#2b9348',            // Forest green
  'Node.js': '#087e8b',           // Teal
  'Uncategorized': '#6c757d'      // Neutral gray
};

// Additional colors for new categories
const ADDITIONAL_COLORS = [
  '#f72585', // Hot pink
  '#7678ed', // Periwinkle
  '#ff7b00', // Bright orange
  '#6a994e', // Olive green
  '#bc4749', // Rusty red
  '#5e60ce', // Indigo
  '#fb8500', // Tangerine
  '#2ec4b6', // Turquoise
  '#e76f51', // Terra cotta
  '#9d4edd'  // Amethyst
];

// Default color for categories not in the map
export const DEFAULT_COLOR = 'var(--primary)';

/**
 * Get color for a category
 * @param {string} category - Category name
 * @returns {string} - CSS color
 */
export function getCategoryColor(category) {
  if (CATEGORY_COLORS[category]) {
    return CATEGORY_COLORS[category];
  }
  
  // For categories not in the map, use a hash function to pick a consistent color
  if (category) {
    const hash = Array.from(category).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return ADDITIONAL_COLORS[hash % ADDITIONAL_COLORS.length];
  }
  
  return DEFAULT_COLOR;
}
