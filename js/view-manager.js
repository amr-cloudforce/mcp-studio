/**
 * View Manager
 * Handles view switching between servers and clients
 */
import clientsTab from './ui/clients-tab.js';

/**
 * Initialize view switching functionality
 */
export function initializeViewSwitching() {
  // View switching function
  window.showView = function(viewName) {
    const mainContent = document.querySelector('.main-content');
    const mainTitle = mainContent.querySelector('h2');
    const contentHeader = mainContent.querySelector('.content-header');
    const basicTable = document.getElementById('basic-table');
    const clientsContainer = document.getElementById('clients-container');
    const enhancedTable = document.getElementById('enhanced-table');
    const serverListEnhanced = document.querySelector('.enhanced-server-list');
    const paginationContainer = document.querySelector('.pagination-container');
    const prerequisitesWarning = document.getElementById('prerequisites-warning');
    const restartWarning = document.getElementById('restart-warning');
    
    if (viewName === 'clients') {
      // Update title
      mainTitle.textContent = 'Client Synchronization';
      
      // Hide ALL server-related content
      if (contentHeader) contentHeader.style.display = 'none';
      if (basicTable) basicTable.style.display = 'none';
      if (enhancedTable) enhancedTable.style.display = 'none';
      if (serverListEnhanced) serverListEnhanced.style.display = 'none';
      if (paginationContainer) paginationContainer.style.display = 'none';
      if (prerequisitesWarning) prerequisitesWarning.style.display = 'none';
      if (restartWarning) restartWarning.style.display = 'none';
      
      // Show ONLY clients container
      clientsContainer.style.display = 'block';
      
      // Initialize clients tab if not already done
      if (!clientsTab.isInitialized) {
        clientsTab.initialize(clientsContainer);
      } else {
        clientsTab.refresh();
      }
    } else {
      // Default to servers view
      mainTitle.textContent = 'MCP Servers';
      
      // Show server-related content
      if (contentHeader) contentHeader.style.display = 'block';
      if (enhancedTable) enhancedTable.style.display = 'table';
      if (serverListEnhanced) serverListEnhanced.style.display = 'block';
      if (paginationContainer) paginationContainer.style.display = 'block';
      // Note: prerequisitesWarning and restartWarning visibility is managed by notifications.js
      
      // Hide clients container
      clientsContainer.style.display = 'none';
    }
  };

  // Show all servers function
  window.showAllServers = function() {
    // Switch to servers view
    showView('servers');
    
    // Set status filter to show all servers
    const statusFilter = document.getElementById('status-filter');
    if (statusFilter) {
      statusFilter.value = 'all';
      statusFilter.dispatchEvent(new Event('change'));
    }
  };
}
