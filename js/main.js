/**
 * MCP Studio Main
 * Entry point for the application
 */

// Import modules
import configManager from './config/config-manager.js';
import modalManager from './ui/modal-manager.js';
import serverList from './ui/server-list.js';
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
import composioManager from './features/composio-manager.js';

// Make global objects available
window.quickAddTemplates = quickAddTemplates;
window.modalManager = modalManager;

// DOM elements
const addServerBtn = document.getElementById('add-server-btn');
const marketplaceBtn = document.getElementById('marketplace-btn');
const exportBtn = document.getElementById('export-json-btn');
const revealBtn = document.getElementById('reveal-btn');
const aboutBtn = document.getElementById('about-btn');
const logsBtn = document.getElementById('logs-btn');

// Initialize application
async function initializeApp() {
  try {
    // Initialize UI components
    modalManager;
    serverForm.initialize();
    serverList.initialize();
    jsonEditor.initialize();
    pasteModal.initialize();
    aboutModal.initialize();
    notifications.initialize();
    logViewer.initialize();
    marketplace.initialize();
    composioManager.initialize();
    
    // Register event handlers
    serverList.on('edit', ({ name, section }) => {
      serverForm.openModal(name);
    });
    
    // Set up event listeners
    addServerBtn.addEventListener('click', () => addServerModal.openModal());
    marketplaceBtn.addEventListener('click', () => marketplace.openModal());
    exportBtn.addEventListener('click', () => jsonEditor.openModal());
    revealBtn.addEventListener('click', () => require('electron').ipcRenderer.invoke('reveal-config'));
    aboutBtn.addEventListener('click', () => aboutModal.openModal());
    logsBtn.addEventListener('click', () => logViewer.openModal());
    
    // Load configuration
    await configManager.loadConfig();
    
    // Refresh server list
    serverList.refreshList();
    
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
