/**
 * Bundles Data Management
 * Handles loading and managing bundle data
 */

let bundlesData = null;

/**
 * Load bundles from JSON file
 */
export async function loadBundles() {
  try {
    const response = await fetch('bundles.json');
    if (!response.ok) {
      throw new Error(`Failed to load bundles: ${response.status}`);
    }
    
    bundlesData = await response.json();
    console.log('Bundles loaded:', bundlesData.bundles.length);
    return bundlesData;
  } catch (error) {
    console.error('Failed to load bundles:', error);
    // Fallback to empty bundles
    bundlesData = { bundles: [] };
    return bundlesData;
  }
}

/**
 * Get all bundles
 * @returns {Array} Array of bundle objects
 */
export function getAllBundles() {
  if (!bundlesData) {
    console.warn('Bundles not loaded yet');
    return [];
  }
  return bundlesData.bundles || [];
}

/**
 * Get bundle by ID
 * @param {string} bundleId - Bundle ID
 * @returns {Object|null} Bundle object or null if not found
 */
export function getBundleById(bundleId) {
  const bundles = getAllBundles();
  return bundles.find(bundle => bundle.id === bundleId) || null;
}

/**
 * Search bundles by query
 * @param {string} query - Search query
 * @returns {Array} Filtered bundles
 */
export function searchBundles(query) {
  if (!query || !query.trim()) {
    return getAllBundles();
  }
  
  const searchTerm = query.toLowerCase().trim();
  const bundles = getAllBundles();
  
  return bundles.filter(bundle => {
    const name = bundle.name.toLowerCase();
    const description = bundle.description.toLowerCase();
    const category = bundle.category.toLowerCase();
    const toolNames = bundle.tools.map(tool => tool.displayName.toLowerCase()).join(' ');
    
    return name.includes(searchTerm) ||
           description.includes(searchTerm) ||
           category.includes(searchTerm) ||
           toolNames.includes(searchTerm);
  });
}

/**
 * Get bundles by category
 * @param {string} category - Category name
 * @returns {Array} Bundles in the specified category
 */
export function getBundlesByCategory(category) {
  const bundles = getAllBundles();
  return bundles.filter(bundle => bundle.category === category);
}

/**
 * Get all categories
 * @returns {Array} Array of unique category names
 */
export function getAllCategories() {
  const bundles = getAllBundles();
  const categories = bundles.map(bundle => bundle.category);
  return [...new Set(categories)].sort();
}
