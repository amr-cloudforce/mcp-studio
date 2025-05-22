/**
 * Marketplace Data Module
 * Handles loading and parsing marketplace data
 */

/**
 * Load marketplace data from the default location or a configured URL
 * @returns {Promise<Array>} - Array of marketplace items
 */
export async function loadMarketplaceData() {
  try {
    // Try to load from the default location (marketplace.json)
    const data = await require('electron').ipcRenderer.invoke('read-marketplace-data');
    return JSON.parse(data);
  } catch (error) {

    
    console.error('Failed to load fucken marketplace data:', error);
    return [];
  }
}

/**
 * Filter marketplace items based on prerequisites
 * @param {Array} items - Marketplace items
 * @param {Object} prerequisites - Prerequisites status (docker, nodejs)
 * @returns {Array} - Filtered marketplace items with availability flag
 */
export function filterByPrerequisites(items, prerequisites) {
  return items.map(item => {
    let available = true;
    let reason = '';
    
    // Check if the required prerequisites are installed
    if (item.server_type === 'npx' && !prerequisites.nodejs) {
      available = false;
      reason = 'Node.js is required but not installed';
    } else if (item.server_type === 'docker' && !prerequisites.docker) {
      available = false;
      reason = 'Docker is required but not installed';
    }
    
    return {
      ...item,
      available,
      unavailableReason: reason
    };
  });
}

/**
 * Group marketplace items by category
 * @param {Array} items - Marketplace items
 * @returns {Object} - Items grouped by category
 */
export function groupByCategory(items) {
  const grouped = {};
  
  items.forEach(item => {
    const category = item.category || 'Uncategorized';
    
    if (!grouped[category]) {
      grouped[category] = [];
    }
    
    grouped[category].push(item);
  });
  
  return grouped;
}
