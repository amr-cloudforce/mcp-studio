/**
 * MCP Studio Main
 * Entry point for the application
 */

// Import modules
import configManager from './config/config-manager.js';
import modalManager from './ui/modal-manager.js';
import serverList from './ui/server-list.js';

import serverListEnhancements from './features/server-list-enhancements.js';
import serverForm from './ui/server-form/index.js';
import jsonEditor from './ui/json-editor.js';
import pasteModal from './ui/paste-modal.js';
import aboutModal from './ui/about-modal.js';
import notifications from './ui/notifications.js';
import quickAdd from './quick-add.js';
import logViewer from './features/log-viewer.js';
import quickAddTemplates from './quick-add-templates.js';
import addServerModal from './ui/add-server-modal.js';
import marketplace from './features/marketplace/index.js';
import composioMarketplace from './features/composio-marketplace/index.js';
import apifyMarketplace from './features/apify-marketplace/index.js';
import smitheryMarketplace from './features/smithery-marketplace/index.js';
import elementDebugger from './utils/element-debugger.js';
import modalLoader from './utils/modal-loader.js';
import clientsTab from './ui/clients-tab.js';

// Make global objects available
window.quickAddTemplates = quickAddTemplates;
window.modalManager = modalManager;

// DOM elements
const addServerBtn = document.getElementById('add-server-btn');
const quickAddBtn = document.getElementById('quick-add-btn');

const sidebarToggle = document.getElementById('sidebar-toggle');
const sidebar = document.getElementById('sidebar');
const localMarketplaceBtn = document.getElementById('local-marketplace-btn');
const composioMarketplaceBtn = document.getElementById('composio-marketplace-btn');
const apifyMarketplaceBtn = document.getElementById('apify-marketplace-btn');
const smitheryMarketplaceBtn = document.getElementById('smithery-marketplace-btn');
const exportBtn = document.getElementById('export-json-btn');
const revealBtn = document.getElementById('reveal-btn');
const aboutBtn = document.getElementById('about-btn');
const logsBtn = document.getElementById('logs-btn');
const clientsBtn = document.getElementById('clients-btn');

// Initialize application
async function initializeApp() {
  try {
    // Load modal HTML files first
    await modalLoader.loadModals();
    
    // Initialize UI components
    modalManager;
    serverForm.initialize();
    serverList.initialize();

    
    // Initialize enhanced server list after basic components
    serverListEnhancements.initialize();
    jsonEditor.initialize();
    pasteModal.initialize();
    aboutModal.initialize();
    notifications.initialize();
    logViewer.initialize();
    marketplace.initialize();
    composioMarketplace.initialize();
    apifyMarketplace.initialize();
    smitheryMarketplace.initialize();
    
    // Initialize Quick Add after modals are loaded
    quickAdd.initialize();
    
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
        if (prerequisitesWarning) prerequisitesWarning.style.display = 'block';
        if (restartWarning) restartWarning.style.display = 'block';
        
        // Hide clients container
        clientsContainer.style.display = 'none';
      }
    };

    // Register event handlers
    serverList.on('edit', ({ name, section }) => {
      serverForm.openModal(name);
    });
    
    serverListEnhancements.on('edit', ({ name, section }) => {
      serverForm.openModal(name);
    });
    
    // Set up event listeners
    addServerBtn.addEventListener('click', () => addServerModal.openModal());
    quickAddBtn.addEventListener('click', () => quickAdd.openModal());

    
    // Sidebar toggle
    if (sidebarToggle && sidebar) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('collapsed');
      });
    }
    localMarketplaceBtn.addEventListener('click', () => marketplace.openModal());
    composioMarketplaceBtn.addEventListener('click', () => composioMarketplace.openModal());
    apifyMarketplaceBtn.addEventListener('click', () => apifyMarketplace.openModal());
    smitheryMarketplaceBtn.addEventListener('click', () => smitheryMarketplace.openModal());
    exportBtn.addEventListener('click', () => jsonEditor.openModal());
    revealBtn.addEventListener('click', () => require('electron').ipcRenderer.invoke('reveal-config'));
    aboutBtn.addEventListener('click', () => aboutModal.openModal());
    logsBtn.addEventListener('click', () => logViewer.openModal());
    clientsBtn.addEventListener('click', () => showView('clients'));
    
    // Load configuration
    await configManager.loadConfig();
    
    // Refresh server list
    serverList.refreshList();
    
    // Hide basic table and show enhanced view by default
    const basicTable = document.getElementById('basic-table');
    if (basicTable) {
      basicTable.style.display = 'none';
    }
    
    // Refresh enhanced list after all initialization is complete
    setTimeout(() => {
      serverListEnhancements.refreshEnhancedList();
    }, 100);
    
    // Show add server dialog if no servers are configured
    if (!configManager.hasServers()) {
      setTimeout(() => addServerModal.openModal(), 500);
    }
    
    console.log('MCP Studio initialized successfully');
  } catch (error) {
    console.error('Failed to initialize MCP Studio:', error);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
