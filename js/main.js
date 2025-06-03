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
import { initializeViewSwitching } from './view-manager.js';
import { setupEventListeners } from './event-handlers.js';

// Make global objects available
window.quickAddTemplates = quickAddTemplates;
window.modalManager = modalManager;

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
    
    // Initialize view switching
    initializeViewSwitching();

    // Register event handlers
    serverList.on('edit', ({ name, section }) => {
      serverForm.openModal(name);
    });
    
    serverListEnhancements.on('edit', ({ name, section }) => {
      serverForm.openModal(name);
    });
    
    // Set up event listeners
    setupEventListeners();
    
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
