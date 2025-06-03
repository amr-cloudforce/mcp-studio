/**
 * Main Application Event Handlers
 * Handles all main application event listeners
 */
import aboutModal from './ui/about-modal.js';
import logViewer from './features/log-viewer.js';
import addServerModal from './ui/add-server-modal.js';
import quickAdd from './quick-add.js';
import marketplace from './features/marketplace/index.js';
import composioMarketplace from './features/composio-marketplace/index.js';
import apifyMarketplace from './features/apify-marketplace/index.js';
import smitheryMarketplace from './features/smithery-marketplace/index.js';
import jsonEditor from './ui/json-editor.js';
import notifications from './ui/notifications.js';

/**
 * Set up all event listeners for the main application
 */
export function setupEventListeners() {
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
  const showAllServersBtn = document.getElementById('show-all-servers-btn');
  const restartAllClientsBtn = document.getElementById('restart-all-clients-btn');

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
  showAllServersBtn.addEventListener('click', () => showAllServers());
  
  // Restart All Clients button
  if (restartAllClientsBtn) {
    restartAllClientsBtn.addEventListener('click', () => {
      notifications.handleRestartAllClients();
    });
  }
}
