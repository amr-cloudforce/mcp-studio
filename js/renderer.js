/*
 * CODING CONSTITUTION - MANDATORY RULES:
 * 
 * 1. Never change anything that has not been discussed with the user or is unrelated to the current task.
 * 2. Never add placeholders or dummy or demo data without an explicit request from the user.
 * 3. Never make a code file larger than 300 lines of code; if it exceeds this, split it as appropriate. 
 *    THE only exceptions ARE JSON DATA FILES, PACKAGE.JSON OR OTHER FILES THAT ARE NOT MEANT TO BE SPLIT.
 * 4. Never make assumptions on behalf of the user. If you don't know how to do something or keep going 
 *    round in circles, you stop and think about the cause instead of doing trial and error and wasting 
 *    the user's time and money.
 * 5. When there is a bug, your most important task is to identify the possible reasons and use debugging 
 *    techniques (don't ever ask the user to read code and debug for you) to reduce the search radius, 
 *    e.g. add a log that would confirm an assumption before starting to code.
 * 6. When you fix something and the error is not fixed because you made a wrong assumption, you undo 
 *    this yourself without an explicit request from the user.
 * 
 * WARNING: NOT ADHERING TO THESE LAWS IS CONSIDERED BREAKING THE LAW AND COULD LEAD TO SEVERE DAMAGE.
 */

/**
 * @file renderer.js
 * @description Main renderer process for the MCP Studio application.
 * 
 * This file serves as the entry point for the renderer process and coordinates
 * the initialization and interaction between various UI modules.
 * 
 * ## Responsibilities:
 * - Initialize core modules (notifications, modal manager, server form, etc.)
 * - Set up event listeners for UI interactions
 * - Load and manage configuration
 * - Coordinate between different UI components
 * 
 * ## Modularization Strategy:
 * If this file grows too large, consider these strategies:
 * 
 * 1. Identify groups of related functionality and extract them into separate modules
 *    (e.g., server management, modal handling, configuration management)
 * 
 * 2. Create singleton modules that follow the project pattern:
 *    - Export a singleton instance, not a class
 *    - Provide an initialize() method
 *    - Use event-based communication between modules
 * 
 * 3. Keep the main renderer.js file as a coordinator that initializes and connects
 *    modules, rather than implementing detailed functionality
 * 
 * 4. Avoid over-engineering by ensuring each module has a clear, focused purpose
 *    and follows the established patterns in the project
 */

// With nodeIntegration: true and contextIsolation: false,
// we can directly require Node.js modules
const { ipcRenderer, shell } = require('electron');
const fs = require('fs').promises;
const composioService = require('../composio-service.js');

// Import modules
import configManager from './config/config-manager.js';
import modalManager from './ui/modal-manager.js';
import notifications from './ui/notifications.js';
import QuickAdd from './quick-add.js';
import serverForm from './ui/server-form/index.js';
import serverList from './ui/server-list.js';
import modalHandlers from './ui/modal-handlers.js';
import apifyMarketplace from './features/apify-marketplace/index.js';
import clientsTab from './ui/clients-tab.js';
console.log('[DEBUG] clientsTab imported:', clientsTab);
console.log('[DEBUG] clientsTab.initialized:', clientsTab.initialized);

window.addEventListener('DOMContentLoaded', async () => {
  // ACE JSON editor setup
  const editor = ace.edit("json-editor");
  editor.setTheme("ace/theme/monokai");
  editor.session.setMode("ace/mode/json");
  editor.setShowPrintMargin(false);

  // Initialize modules
  notifications.initialize();
  modalManager.initialize(); // Ensure modalManager is initialized to handle global escape/close buttons
  serverForm.initialize();
  modalHandlers.initialize();
  serverList.initialize();
  apifyMarketplace.initialize();

  // Register event handlers
  serverList.on('edit', ({ name }) => {
    serverForm.openModal(name);
  });

  // Initial load of configuration
  await configManager.loadConfig();
  serverList.refreshList();

  // If no servers are configured, show the paste dialog automatically
  if (!configManager.hasServers()) {
    setTimeout(() => modalManager.showModal(document.getElementById('paste-modal')), 500);
  }

  // Quick Add functionality
  const quickAdd = new QuickAdd(configManager.getConfig(), async (name, cfg, initialState) => {
    configManager.addServer(name, cfg, initialState);
    await configManager.saveConfig();
    notifications.showRestartWarning();
    quickAdd.closeModal();
  });

  // View switching function
  function showView(viewName) {
    console.log('[DEBUG] showView called with:', viewName);
    // Hide all views
    const serverTable = document.getElementById('basic-table');
    const clientsContainer = document.getElementById('clients-container');
    const mainTitle = document.querySelector('.main-content h2');
    
    console.log('[DEBUG] Elements found - serverTable:', !!serverTable, 'clientsContainer:', !!clientsContainer, 'mainTitle:', !!mainTitle);
    
    serverTable.style.display = 'none';
    clientsContainer.style.display = 'none';
    
    // Show selected view
    if (viewName === 'clients') {
      console.log('[DEBUG] Switching to clients view');
      mainTitle.textContent = 'Client Synchronization';
      clientsContainer.style.display = 'block';
      
      // Initialize clients tab if not already done
      console.log('[DEBUG] clientsTab.initialized:', clientsTab.initialized);
      if (!clientsTab.initialized) {
        console.log('[DEBUG] Initializing clients tab');
        clientsTab.init(clientsContainer);
      } else {
        console.log('[DEBUG] Refreshing clients tab');
        clientsTab.refresh();
      }
    } else {
      // Default to servers view
      console.log('[DEBUG] Switching to servers view');
      mainTitle.textContent = 'MCP Servers';
      serverTable.style.display = 'block';
    }
  }

  // Event listeners
  document.getElementById('add-server-btn').onclick = () => {
    showView('servers');
    serverForm.openModal();
  };
  document.getElementById('quick-add-btn').onclick = () => {
    showView('servers');
    quickAdd.openModal();
  };
  document.getElementById('clients-btn').onclick = () => {
    console.log('[DEBUG] Clients button clicked!');
    showView('clients');
  };
  document.getElementById('export-json-btn').onclick = () => modalHandlers.openJsonModal();
  document.getElementById('reveal-btn').onclick = () => ipcRenderer.invoke('reveal-config');
  document.getElementById('paste-btn').onclick = () => modalManager.showModal(document.getElementById('paste-modal'));
  document.getElementById('about-btn').onclick = () => modalHandlers.openAboutModal();

  // Listen for paste:server:loaded custom event from ModalHandlers
  document.addEventListener('paste:server:loaded', (e) => {
    const { name, cfg } = e.detail;
    serverForm.fillForm(name, cfg, false); // Fill the server form with pasted data
    modalManager.showModal(document.getElementById('server-modal')); // Open the server modal
  });
});
