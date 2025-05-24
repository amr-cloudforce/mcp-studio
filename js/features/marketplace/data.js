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
    console.log('[MARKETPLACE DEBUG] Loading marketplace data...');
    // Try to load from the default location (marketplace.json)
    const data = await require('electron').ipcRenderer.invoke('read-marketplace-data');
    const parsedData = JSON.parse(data);
    console.log('[MARKETPLACE DEBUG] Loaded marketplace data:', parsedData);
    console.log('[MARKETPLACE DEBUG] Number of items:', parsedData.length);
    return parsedData;
  } catch (error) {
    console.error('[MARKETPLACE DEBUG] Failed to load marketplace data:', error);
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
  console.log('[MARKETPLACE DEBUG] filterByPrerequisites called - SHOWING ALL ITEMS (no filtering)');
  console.log('[MARKETPLACE DEBUG] Total items:', items.length);
  
  // NO FILTERING - mark ALL items as available
  return items.map((item, index) => {
    console.log(`[MARKETPLACE DEBUG] Item ${index} (${item.repo_name}) - FORCED AVAILABLE`);
    
    return {
      ...item,
      available: true,
      unavailableReason: ''
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
