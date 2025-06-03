/**
 * Bundle Marketplace Integration
 * Handles opening marketplace modals for tool configuration
 */

/**
 * Handle tool configuration
 * @param {Object} tool - Tool object
 */
export function handleToolConfiguration(tool) {
  console.log('Configuring tool:', tool);
  
  switch (tool.type) {
    case 'smithery':
      openSmitheryModal(tool);
      break;
    case 'composio':
      openComposioModal(tool);
      break;
    case 'apify':
      openApifyModal(tool);
      break;
    default:
      console.error('Unknown tool type:', tool.type);
      alert(`Unknown tool type: ${tool.type}`);
  }
}

/**
 * Open Smithery marketplace modal for tool
 * @param {Object} tool - Smithery tool
 */
function openSmitheryModal(tool) {
  // Import and use Smithery marketplace
  import('../smithery-marketplace/index.js').then(smitheryModule => {
    // Show Smithery marketplace and search for the tool
    smitheryModule.showSmitheryMarketplace();
    
    // TODO: Auto-search for the specific tool
    // This would require extending the Smithery marketplace to accept search parameters
  }).catch(error => {
    console.error('Failed to load Smithery marketplace:', error);
    alert('Failed to open Smithery marketplace');
  });
}

/**
 * Open Composio marketplace modal for tool
 * @param {Object} tool - Composio tool
 */
function openComposioModal(tool) {
  // Import and use Composio marketplace
  import('../composio-marketplace/index.js').then(composioModule => {
    // Show Composio marketplace and search for the app
    composioModule.showComposioMarketplace();
    
    // TODO: Auto-search for the specific app
    // This would require extending the Composio marketplace to accept search parameters
  }).catch(error => {
    console.error('Failed to load Composio marketplace:', error);
    alert('Failed to open Composio marketplace');
  });
}

/**
 * Open Apify marketplace modal for tool
 * @param {Object} tool - Apify tool
 */
function openApifyModal(tool) {
  // Import and use Apify marketplace
  import('../apify-marketplace/index.js').then(apifyModule => {
    // Show Apify marketplace and search for the actor
    apifyModule.showApifyMarketplace();
    
    // TODO: Auto-search for the specific actor
    // This would require extending the Apify marketplace to accept search parameters
  }).catch(error => {
    console.error('Failed to load Apify marketplace:', error);
    alert('Failed to open Apify marketplace');
  });
}

/**
 * Install tools sequentially
 * @param {Array} tools - Array of tools to install
 * @param {number} index - Current tool index
 */
export function installToolsSequentially(tools, index) {
  if (index >= tools.length) {
    // All tools processed
    console.log('All tools installation process completed');
    return;
  }
  
  const tool = tools[index];
  console.log(`Installing tool ${index + 1}/${tools.length}:`, tool.displayName);
  
  // Configure the current tool
  handleToolConfiguration(tool);
  
  // Note: In a real implementation, we would wait for the marketplace modal to close
  // and the tool to be configured before proceeding to the next tool.
  // For now, we'll just proceed immediately.
  setTimeout(() => {
    installToolsSequentially(tools, index + 1);
  }, 1000);
}
