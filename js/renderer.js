// File: js/renderer.js
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

  // Event listeners
  document.getElementById('add-server-btn').onclick = () => serverForm.openModal();
  document.getElementById('quick-add-btn').onclick = () => quickAdd.openModal();
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
