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

// Loading progress helper
function updateLoadingProgress(progress, text, details = '') {
  const progressFill = document.getElementById('progress-fill');
  const loadingText = document.getElementById('loading-text');
  const loadingDetails = document.getElementById('loading-details');
  
  if (progressFill) progressFill.style.width = `${progress}%`;
  if (loadingText) loadingText.textContent = text;
  if (loadingDetails) loadingDetails.textContent = details;
}

// Hide loading overlay
function hideLoadingOverlay() {
  const overlay = document.getElementById('loading-overlay');
  if (overlay) {
    overlay.classList.add('fade-out');
    setTimeout(() => {
      overlay.style.display = 'none';
    }, 300);
  }
}

// Initialize application
async function initializeApp() {
  try {
    console.time('🚀 Total App Initialization');
    
    updateLoadingProgress(5, 'Loading modals...', 'Setting up user interface components');
    console.time('📁 Modal Loading');
    // Load modal HTML files first
    await modalLoader.loadModals();
    console.timeEnd('📁 Modal Loading');
    
    updateLoadingProgress(15, 'Initializing UI...', 'Setting up basic components');
    console.time('🎨 Basic UI Components');
    // Initialize UI components
    modalManager;
    serverForm.initialize();
    serverList.initialize();
    console.timeEnd('🎨 Basic UI Components');
    
    updateLoadingProgress(25, 'Setting up server list...', 'Configuring enhanced table view');
    console.time('⚡ Enhanced Server List');
    // Initialize enhanced server list after basic components
    serverListEnhancements.initialize();
    console.timeEnd('⚡ Enhanced Server List');
    
    updateLoadingProgress(35, 'Loading editors...', 'JSON editor and modal components');
    console.time('🔧 Other UI Components');
    jsonEditor.initialize();
    pasteModal.initialize();
    aboutModal.initialize();
    notifications.initialize();
    logViewer.initialize();
    console.timeEnd('🔧 Other UI Components');
    
    updateLoadingProgress(50, 'Initializing marketplaces...', 'Setting up server repositories');
    console.time('🛒 Marketplace Initialization');
    marketplace.initialize();
    composioMarketplace.initialize();
    apifyMarketplace.initialize();
    smitheryMarketplace.initialize();
    console.timeEnd('🛒 Marketplace Initialization');
    
    updateLoadingProgress(65, 'Loading templates...', 'Quick Add server templates');
    console.time('➕ Quick Add');
    // Initialize Quick Add after modals are loaded
    quickAdd.initialize();
    console.timeEnd('➕ Quick Add');
    
    updateLoadingProgress(75, 'Setting up events...', 'Configuring user interactions');
    console.time('🔄 View & Event Setup');
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
    console.timeEnd('🔄 View & Event Setup');
    
    updateLoadingProgress(85, 'Loading configuration...', 'Reading MCP server settings');
    console.time('📋 Config Loading');
    // Load configuration
    await configManager.loadConfig();
    console.timeEnd('📋 Config Loading');
    
    updateLoadingProgress(95, 'Rendering servers...', 'Building server list display');
    console.time('📊 Server List Refresh');
    // Refresh server list
    serverList.refreshList();
    
    // Hide basic table and show enhanced view by default
    const basicTable = document.getElementById('basic-table');
    if (basicTable) {
      basicTable.style.display = 'none';
    }
    console.timeEnd('📊 Server List Refresh');
    
    updateLoadingProgress(100, 'Finalizing...', 'Almost ready!');
    console.time('🎯 Enhanced List Render');
    // Refresh enhanced list after all initialization is complete
    setTimeout(() => {
      serverListEnhancements.refreshEnhancedList();
      console.timeEnd('🎯 Enhanced List Render');
      console.timeEnd('🚀 Total App Initialization');
      
      // Hide loading overlay
      hideLoadingOverlay();
      
      // Show add server dialog if no servers are configured
      if (!configManager.hasServers()) {
        setTimeout(() => addServerModal.openModal(), 500);
      }
    }, 100);
    
    console.log('MCP Studio initialized successfully');
  } catch (error) {
    console.error('Failed to initialize MCP Studio:', error);
    updateLoadingProgress(100, 'Error occurred', 'Check console for details');
    setTimeout(hideLoadingOverlay, 2000);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
