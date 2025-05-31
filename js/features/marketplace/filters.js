/**
 * Marketplace Filters Module
 * Generic filtering functions for marketplace items
 */

/**
 * Check if an item is NPX-installable
 * @param {Object} item - Marketplace item
 * @returns {boolean} - True if item can be installed via NPX
 */
export function isNPXInstallable(item) {
  if (!item.mcpServers || !Array.isArray(item.mcpServers)) {
    return false;
  }
  
  // Check if any server in the item uses NPX
  return item.mcpServers.some(server => 
    server.tool === 'npx' || 
    (server.raw && server.raw.startsWith('npx'))
  );
}

/**
 * Filter items by NPX availability
 * @param {Array} items - Array of marketplace items
 * @param {boolean} showExperimental - Whether to include experimental (non-NPX) items
 * @returns {Array} - Filtered array of items
 */
export function filterByNPX(items, showExperimental = false) {
  if (showExperimental) {
    // Show all items
    return items;
  }
  
  // Show only NPX-installable items
  return items.filter(item => isNPXInstallable(item));
}

/**
 * Get filter statistics
 * @param {Array} items - Array of marketplace items
 * @returns {Object} - Statistics about NPX vs experimental items
 */
export function getFilterStats(items) {
  const npxItems = items.filter(item => isNPXInstallable(item));
  const experimentalItems = items.filter(item => !isNPXInstallable(item));
  
  return {
    total: items.length,
    npx: npxItems.length,
    experimental: experimentalItems.length
  };
}
