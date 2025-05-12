/**
 * MCP Studio Main
 * Entry point for the application
 */

// Import modules
import configManager from './config/config-manager.js';
import modalManager from './ui/modal-manager.js';
import serverList from './ui/server-list.js';
import serverForm from './ui/server-form.js';
import jsonEditor from './ui/json-editor.js';
import pasteModal from './ui/paste-modal.js';
import aboutModal from './ui/about-modal.js';
import notifications from './ui/notifications.js';
import quickAdd from './quick-add.js';
import logViewer from './features/log-viewer.js';

// DOM elements
const addBtn = document.getElementById('add-server-btn');
const quickAddBtn = document.getElementById('quick-add-btn');
const exportBtn = document.getElementById('export-json-btn');
const revealBtn = document.getElementById('reveal-btn');
const pasteBtn = document.getElementById('paste-btn');
const aboutBtn = document.getElementById('about-btn');

// Create logs button
const buttonContainer = document.querySelector('.container');
const logsBtn = document.createElement('button');
logsBtn.id = 'logs-btn';
logsBtn.className = 'btn btn-export';
logsBtn.textContent = 'View Logs';
logsBtn.style.marginLeft = 'auto';
buttonContainer.insertBefore(logsBtn, document.querySelector('table'));

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
    
    // Register event handlers
    serverList.on('edit', ({ name, section }) => {
      serverForm.openModal(name);
    });
    
    // Set up event listeners
    addBtn.addEventListener('click', () => serverForm.openModal());
    quickAddBtn.addEventListener('click', () => quickAdd.openModal());
    exportBtn.addEventListener('click', () => jsonEditor.openModal());
    revealBtn.addEventListener('click', () => window.api.revealConfig());
    pasteBtn.addEventListener('click', () => pasteModal.openModal());
    aboutBtn.addEventListener('click', () => aboutModal.openModal());
    logsBtn.addEventListener('click', () => logViewer.openModal());
    
    // Load configuration
    await configManager.loadConfig();
    
    // Refresh server list
    serverList.refreshList();
    
    // Show paste dialog if no servers are configured
    if (!configManager.hasServers()) {
      setTimeout(() => pasteModal.openModal(), 500);
    }
    
    console.log('MCP Studio initialized successfully');
  } catch (error) {
    console.error('Failed to initialize MCP Studio:', error);
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initializeApp);
