/**
 * Composio Manager
 * Handles integration with Composio API for app connections
 */

import configManager from '../config/config-manager.js';
import notifications from '../ui/notifications.js';
import modalManager from '../ui/modal-manager.js';
import serverList from '../ui/server-list.js';

// Constants
const STORAGE_KEY_API_KEY = 'composio_api_key';
const STORAGE_KEY_APPS_CACHE = 'composio_apps_cache';
const STORAGE_KEY_CACHE_TIMESTAMP = 'composio_cache_timestamp';
const STORAGE_KEY_AUTO_REFRESH = 'composio_auto_refresh';
const STORAGE_KEY_STORE_STATUS = 'composio_store_status';
const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// DOM Elements
let apiKeyInput;
let autoRefreshCheckbox;
let storeStatusCheckbox;
let connectionStatusDiv;
let statusMessageElement;
let appsListContainer;
let settingsBtn;
let refreshBtn;

// State
let isInitialized = false;
let composioService = null;
let currentAppData = null;

/**
 * Initialize the Composio manager
 */
export function initialize() {
  if (isInitialized) return;
  
  // Get DOM elements
  apiKeyInput = document.getElementById('composio-api-key');
  autoRefreshCheckbox = document.getElementById('composio-auto-refresh');
  storeStatusCheckbox = document.getElementById('composio-store-status');
  connectionStatusDiv = document.getElementById('composio-connection-status');
  statusMessageElement = document.getElementById('composio-status-message');
  appsListContainer = document.getElementById('composio-apps-list');
  settingsBtn = document.getElementById('composio-settings-btn');
  refreshBtn = document.getElementById('composio-refresh-btn');
  
  // Set up event listeners
  settingsBtn.addEventListener('click', openSettingsModal);
  refreshBtn.addEventListener('click', refreshApps);
  
  document.getElementById('composio-settings-save').addEventListener('click', saveSettings);
  document.getElementById('composio-settings-cancel').addEventListener('click', closeSettingsModal);
  document.getElementById('composio-settings-close').addEventListener('click', closeSettingsModal);
  
  document.getElementById('composio-app-close').addEventListener('click', closeAppModal);
  document.getElementById('composio-connect-btn').addEventListener('click', startConnectionFlow);
  document.getElementById('composio-open-browser').addEventListener('click', openAuthorizationPage);
  document.getElementById('composio-check-status').addEventListener('click', checkConnectionStatus);
  document.getElementById('composio-reconnect').addEventListener('click', reconnectApp);
  document.getElementById('composio-view-server').addEventListener('click', viewMcpServer);
  
  // Load settings from localStorage
  loadSettings();
  
  // Initialize Composio service with saved API key
  const apiKey = localStorage.getItem(STORAGE_KEY_API_KEY);
  if (apiKey) {
    initializeWithApiKey(apiKey);
  }
  
  // Check if we should auto-refresh
  const autoRefresh = localStorage.getItem(STORAGE_KEY_AUTO_REFRESH) !== 'false';
  const cacheTimestamp = localStorage.getItem(STORAGE_KEY_CACHE_TIMESTAMP);
  
  if (autoRefresh && cacheTimestamp) {
    const lastUpdate = parseInt(cacheTimestamp, 10);
    const now = Date.now();
    
    if (now - lastUpdate > CACHE_EXPIRY) {
      refreshApps();
    } else {
      loadAppsFromCache();
    }
  } else {
    loadAppsFromCache();
  }
  
  isInitialized = true;
  return this;
}

/**
 * Initialize with a saved API key
 * @param {string} apiKey - The API key to initialize with
 */
async function initializeWithApiKey(apiKey) {
  try {
    console.log('Initializing with saved API key');
    await require('electron').ipcRenderer.invoke('composio-initialize-sdk', apiKey);
    composioService = { initialized: true };
    
    // Load apps if we have a cache
    const cachedApps = localStorage.getItem(STORAGE_KEY_APPS_CACHE);
    if (!cachedApps) {
      // No cached apps, fetch them
      refreshApps();
    }
  } catch (error) {
    console.error('Failed to initialize with saved API key:', error);
    // Don't clear the API key here, it might be valid but the service is down
  }
}

/**
 * Load the Composio service module
 */
async function loadComposioService() {
  try {
    // We don't need to load the service anymore, we'll use IPC handlers
    console.log('Composio service ready');
    composioService = {
      initialized: false
    };
  } catch (error) {
    console.error('Failed to load Composio service:', error);
    notifications.show('Failed to load Composio service', 'error');
  }
}

/**
 * Load settings from localStorage
 */
function loadSettings() {
  const apiKey = localStorage.getItem(STORAGE_KEY_API_KEY) || '';
  const autoRefresh = localStorage.getItem(STORAGE_KEY_AUTO_REFRESH) !== 'false';
  const storeStatus = localStorage.getItem(STORAGE_KEY_STORE_STATUS) !== 'false';
  
  apiKeyInput.value = apiKey;
  autoRefreshCheckbox.checked = autoRefresh;
  storeStatusCheckbox.checked = storeStatus;
}

/**
 * Save settings to localStorage
 */
function saveSettings() {
  const apiKey = apiKeyInput.value.trim();
  const autoRefresh = autoRefreshCheckbox.checked;
  const storeStatus = storeStatusCheckbox.checked;
  
  // Check if API key has changed
  const oldApiKey = localStorage.getItem(STORAGE_KEY_API_KEY) || '';
  const apiKeyChanged = apiKey !== oldApiKey;
  
  // Save settings
  localStorage.setItem(STORAGE_KEY_API_KEY, apiKey);
  localStorage.setItem(STORAGE_KEY_AUTO_REFRESH, autoRefresh);
  localStorage.setItem(STORAGE_KEY_STORE_STATUS, storeStatus);
  
  // If API key changed, verify it and refresh apps
  if (apiKeyChanged && apiKey) {
    verifyApiKey(apiKey);
  }
  
  closeSettingsModal();
}

/**
 * Verify the API key
 * @param {string} apiKey - The API key to verify
 */
async function verifyApiKey(apiKey) {
  try {
    // Initialize SDK with the new API key
    await require('electron').ipcRenderer.invoke('composio-initialize-sdk', apiKey);
    
    // Verify the API key
    await require('electron').ipcRenderer.invoke('composio-verify-api-key');
    
    // If successful, refresh apps
    notifications.show('API key verified successfully', 'success');
    refreshApps();
  } catch (error) {
    console.error('Failed to verify API key:', error);
    notifications.show('Invalid API key', 'error');
    
    // Clear the API key
    localStorage.setItem(STORAGE_KEY_API_KEY, '');
    apiKeyInput.value = '';
  }
}

/**
 * Open the settings modal
 */
function openSettingsModal() {
  // Load settings
  loadSettings();
  
  // Show the modal
  const modal = document.getElementById('composio-settings-modal');
  modalManager.showModal(modal);
}

/**
 * Close the settings modal
 */
function closeSettingsModal() {
  modalManager.closeActiveModal();
}

/**
 * Refresh the apps list
 */
async function refreshApps() {
  const apiKey = localStorage.getItem(STORAGE_KEY_API_KEY);
  
  if (!apiKey) {
    showPlaceholder('Configure API key in settings');
    return;
  }
  
  try {
    // Initialize SDK with the API key
    await require('electron').ipcRenderer.invoke('composio-initialize-sdk', apiKey);
    
    // Get apps
    const apps = await require('electron').ipcRenderer.invoke('composio-list-apps');
    
    // Cache apps
    cacheApps(apps);
    
    // Display apps
    displayApps(apps);
  } catch (error) {
    console.error('Failed to refresh apps:', error);
    notifications.show('Failed to refresh apps', 'error');
    showPlaceholder('Error loading apps');
  }
}

/**
 * Cache apps in localStorage
 * @param {Array} apps - The apps to cache
 */
function cacheApps(apps) {
  localStorage.setItem(STORAGE_KEY_APPS_CACHE, JSON.stringify(apps));
  localStorage.setItem(STORAGE_KEY_CACHE_TIMESTAMP, Date.now().toString());
}

/**
 * Load apps from cache
 */
function loadAppsFromCache() {
  const cachedApps = localStorage.getItem(STORAGE_KEY_APPS_CACHE);
  
  if (cachedApps) {
    try {
      const apps = JSON.parse(cachedApps);
      displayApps(apps);
    } catch (error) {
      console.error('Failed to parse cached apps:', error);
      showPlaceholder('Error loading cached apps');
    }
  } else {
    const apiKey = localStorage.getItem(STORAGE_KEY_API_KEY);
    
    if (apiKey) {
      showPlaceholder('Click refresh to load apps');
    } else {
      showPlaceholder('Configure API key in settings');
    }
  }
}

/**
 * Display apps in the sidebar and grid
 * @param {Array} apps - The apps to display
 */
function displayApps(apps) {
  if (!apps || apps.length === 0) {
    showPlaceholder('No apps available');
    document.getElementById('composio-apps-container').style.display = 'none';
    return;
  }
  
  // Clear the sidebar container
  appsListContainer.innerHTML = '';
  
  // Create a list item for each app in the sidebar
  apps.forEach(app => {
    const listItem = document.createElement('li');
    
    const button = document.createElement('button');
    button.className = 'sidebar-btn';
    button.dataset.appId = app.uniqueKey || app.key;
    button.dataset.appName = app.name;
    
    const icon = document.createElement('span');
    icon.className = 'sidebar-icon';
    icon.textContent = app.icon || '🔌';
    
    const name = document.createElement('span');
    name.textContent = app.name;
    
    button.appendChild(icon);
    button.appendChild(name);
    
    // Add click event listener
    button.addEventListener('click', () => openAppModal(app));
    
    listItem.appendChild(button);
    appsListContainer.appendChild(listItem);
  });
  
  // Display apps in the grid
  const appsGrid = document.getElementById('composio-apps-grid');
  appsGrid.innerHTML = '';
  
  // Show the apps container
  document.getElementById('composio-apps-container').style.display = 'block';
  
  // Create a card for each app
  apps.forEach(app => {
    const card = document.createElement('div');
    card.className = 'composio-app-card';
    
    // Create card header with icon and name
    const header = document.createElement('div');
    header.className = 'composio-app-header';
    
    const iconContainer = document.createElement('div');
    iconContainer.className = 'composio-app-icon';
    iconContainer.textContent = app.icon || '🔌';
    
    const info = document.createElement('div');
    info.className = 'composio-app-info';
    
    const title = document.createElement('h3');
    title.textContent = app.name;
    
    const description = document.createElement('p');
    description.textContent = app.description || 'No description available';
    
    info.appendChild(title);
    info.appendChild(description);
    
    header.appendChild(iconContainer);
    header.appendChild(info);
    
    // Create card body
    const body = document.createElement('div');
    body.className = 'composio-app-body';
    
    // Status will be updated later
    const status = document.createElement('div');
    status.className = 'composio-app-status not-connected';
    status.textContent = 'Not connected';
    status.dataset.appId = app.uniqueKey || app.key;
    
    // Actions
    const actions = document.createElement('div');
    actions.className = 'composio-app-actions';
    
    const connectBtn = document.createElement('button');
    connectBtn.className = 'btn btn-success';
    connectBtn.textContent = 'Connect';
    connectBtn.addEventListener('click', () => {
      openAppModal(app);
      startConnectionFlow();
    });
    
    actions.appendChild(connectBtn);
    
    body.appendChild(status);
    body.appendChild(actions);
    
    card.appendChild(header);
    card.appendChild(body);
    
    // Add click event listener to the card
    card.addEventListener('click', (e) => {
      // Don't trigger if clicking on a button
      if (e.target.tagName !== 'BUTTON') {
        openAppModal(app);
      }
    });
    
    appsGrid.appendChild(card);
  });
  
  // Set up grid settings and refresh buttons
  const gridSettingsBtn = document.getElementById('composio-grid-settings-btn');
  const gridRefreshBtn = document.getElementById('composio-grid-refresh-btn');
  
  gridSettingsBtn.addEventListener('click', openSettingsModal);
  gridRefreshBtn.addEventListener('click', refreshApps);
  
  // Check connection status for each app
  checkAllAppConnections(apps);
}

/**
 * Check connection status for all apps
 * @param {Array} apps - The apps to check
 */
async function checkAllAppConnections(apps) {
  try {
    // Get connected accounts
    const accounts = await require('electron').ipcRenderer.invoke('composio-get-connected-accounts');
    
    // Update status for each app
    apps.forEach(app => {
      // Find a connection for this app
      const connection = accounts.find(account => 
        (account.app_name && app.name && account.app_name === app.name) || 
        (account.app_unique_key && app.uniqueKey && account.app_unique_key === app.uniqueKey) || 
        (account.app_key && app.key && account.app_key === app.key)
      );
      
      // Update status in the grid
      const statusElements = document.querySelectorAll(`.composio-app-status[data-app-id="${app.uniqueKey || app.key}"]`);
      
      statusElements.forEach(element => {
        if (connection) {
          element.textContent = 'Connected';
          element.classList.remove('not-connected');
          element.classList.add('connected');
          
          // Update the connect button to say "View"
          const actionsContainer = element.nextElementSibling;
          if (actionsContainer && actionsContainer.querySelector('button')) {
            const button = actionsContainer.querySelector('button');
            button.textContent = 'View';
            button.className = 'btn btn-primary';
            
            // Update click handler
            button.replaceWith(button.cloneNode(true));
            actionsContainer.querySelector('button').addEventListener('click', () => {
              openAppModal(app);
            });
          }
        } else {
          element.textContent = 'Not connected';
          element.classList.remove('connected');
          element.classList.add('not-connected');
        }
      });
    });
  } catch (error) {
    console.error('Failed to check app connections:', error);
  }
}

/**
 * Show a placeholder message in the apps list
 * @param {string} message - The message to display
 */
function showPlaceholder(message) {
  appsListContainer.innerHTML = `
    <div class="composio-apps-placeholder" style="padding: 10px; color: #999; font-style: italic; text-align: center;">
      ${message}
    </div>
  `;
}

/**
 * Open the app modal
 * @param {Object} app - The app data
 */
function openAppModal(app) {
  currentAppData = app;
  
  // Set app details
  document.getElementById('composio-app-title').textContent = app.name;
  document.getElementById('composio-app-name').textContent = app.name;
  document.getElementById('composio-app-description').textContent = app.description || 'No description available';
  
  // Set app icon
  const iconElement = document.getElementById('composio-app-icon');
  iconElement.textContent = app.icon || '🔌';
  
  // Check if the app is already connected
  checkAppConnection(app);
  
  // Show the modal
  const modal = document.getElementById('composio-app-modal');
  modalManager.showModal(modal);
}

/**
 * Close the app modal
 */
function closeAppModal() {
  modalManager.closeActiveModal();
  currentAppData = null;
}

/**
 * Check if the app is already connected
 * @param {Object} app - The app data
 */
async function checkAppConnection(app) {
  try {
    // Get connected accounts
    const accounts = await require('electron').ipcRenderer.invoke('composio-get-connected-accounts');
    console.log('Connected accounts:', accounts);
    console.log('Checking connection for app:', app);
    
    // Find a connection for this app by exact match
    const connection = accounts.find(account => {
      // Log the comparison for debugging
      console.log('Comparing:', {
        'account.app_name': account.app_name, 
        'app.name': app.name,
        'account.app_unique_key': account.app_unique_key, 
        'app.uniqueKey': app.uniqueKey,
        'account.app_key': account.app_key, 
        'app.key': app.key
      });
      
      // Strict equality check
      return (account.app_name && app.name && account.app_name === app.name) || 
             (account.app_unique_key && app.uniqueKey && account.app_unique_key === app.uniqueKey) || 
             (account.app_key && app.key && account.app_key === app.key);
    });
    
    if (connection) {
      console.log('Found connection for app:', app.name, connection);
      showAppConnected(connection);
    } else {
      console.log('No connection found for app:', app.name);
      showAppNotConnected();
    }
  } catch (error) {
    console.error('Failed to check app connection:', error);
    showAppNotConnected();
  }
}

/**
 * Show the app as connected
 * @param {Object} connection - The connection data
 */
function showAppConnected(connection) {
  // Update status message
  const statusElement = document.getElementById('composio-app-status-message');
  statusElement.textContent = 'Connected';
  statusElement.style.color = 'green';
  
  // Hide connection flow and not connected view
  document.getElementById('composio-connection-flow').style.display = 'none';
  document.getElementById('composio-not-connected-view').style.display = 'none';
  
  // Show connected view
  const connectedView = document.getElementById('composio-connected-view');
  connectedView.style.display = 'block';
  
  // Set connected account info
  document.getElementById('composio-connected-account').textContent = 
    connection.display_name || connection.id || 'Connected account';
  
  // Check if an MCP server exists for this connection
  const serverName = `composio-${currentAppData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const serverInfo = configManager.getServer(serverName);
  
  // Populate tools list
  const toolsList = document.getElementById('composio-tools-list');
  toolsList.innerHTML = '';
  
  if (serverInfo) {
    // Server exists, show tools
    const tools = serverInfo.config.allowedTools || [];
    
    if (tools.length > 0) {
      tools.forEach(tool => {
        const toolItem = document.createElement('div');
        toolItem.className = 'tool-item';
        toolItem.innerHTML = `
          <strong>${tool}</strong>
        `;
        toolsList.appendChild(toolItem);
      });
    } else {
      toolsList.innerHTML = '<p>All tools available</p>';
    }
    
    // Enable view server button
    document.getElementById('composio-view-server').disabled = false;
  } else {
    // No server exists yet
    toolsList.innerHTML = '<p>No MCP server created yet. Click "View MCP Server" to create one.</p>';
    
    // Enable view server button to create a new server
    document.getElementById('composio-view-server').disabled = false;
  }
}

/**
 * Show the app as not connected
 */
function showAppNotConnected() {
  // Update status message
  const statusElement = document.getElementById('composio-app-status-message');
  statusElement.textContent = 'Not connected';
  statusElement.style.color = 'red';
  
  // Hide connection flow and connected view
  document.getElementById('composio-connection-flow').style.display = 'none';
  document.getElementById('composio-connected-view').style.display = 'none';
  
  // Show not connected view
  document.getElementById('composio-not-connected-view').style.display = 'block';
}

/**
 * Start the connection flow
 */
function startConnectionFlow() {
  // Hide not connected view
  document.getElementById('composio-not-connected-view').style.display = 'none';
  
  // Show connection flow
  document.getElementById('composio-connection-flow').style.display = 'block';
  document.getElementById('composio-connection-step-1').style.display = 'block';
  document.getElementById('composio-connection-step-2').style.display = 'none';
}

/**
 * Open the authorization page in the browser
 */
async function openAuthorizationPage() {
  if (!currentAppData) {
    notifications.show('Cannot start connection flow', 'error');
    return;
  }
  
  try {
    // Initiate connection
    const response = await require('electron').ipcRenderer.invoke('composio-initiate-connection', currentAppData.name);
    
    // Open the authorization URL
    if (response.authorizationUrl) {
      require('electron').shell.openExternal(response.authorizationUrl);
    } else {
      throw new Error('No authorization URL returned');
    }
  } catch (error) {
    console.error('Failed to initiate connection:', error);
    notifications.show('Failed to start connection process', 'error');
  }
}

/**
 * Check the connection status
 */
async function checkConnectionStatus() {
  if (!currentAppData) {
    notifications.show('Cannot check connection status', 'error');
    return;
  }
  
  try {
    // Show step 2 (progress)
    document.getElementById('composio-connection-step-1').style.display = 'none';
    document.getElementById('composio-connection-step-2').style.display = 'block';
    
    // Update progress
    updateProgress(10, 'Checking connection status...');
    
    // Get connected accounts
    const accounts = await require('electron').ipcRenderer.invoke('composio-get-connected-accounts');
    
    // Find a connection for this app
    const connection = accounts.find(account => 
      account.app_name === currentAppData.name || 
      account.app_unique_key === currentAppData.uniqueKey || 
      account.app_key === currentAppData.key
    );
    
    if (!connection) {
      throw new Error('Connection not found. Please try again.');
    }
    
    updateProgress(30, 'Connection found! Creating MCP server...');
    
    // Create MCP server
    const serverName = `composio-${currentAppData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
    
    // Get available actions for this app
    updateProgress(50, 'Fetching available tools...');
    const actions = await require('electron').ipcRenderer.invoke('composio-list-actions');
    const appActions = await require('electron').ipcRenderer.invoke(
      'composio-filter-actions-by-app', 
      actions, 
      currentAppData.uniqueKey || currentAppData.key
    );
    
    // Create MCP server
    updateProgress(70, 'Creating MCP server...');
    const mcpServer = await require('electron').ipcRenderer.invoke(
      'composio-create-mcp-server', 
      serverName, 
      connection, 
      appActions.map(action => action.name)
    );
    
    // Add server to config
    updateProgress(90, 'Saving configuration...');
    
    // Create server config
    const serverConfig = {
      name: mcpServer.name,
      command: 'composio-mcp',
      authConfigId: connection.auth_config.id,
      allowedTools: appActions.map(action => action.name)
    };
    
    // Add to config manager
    configManager.addServer(serverName, serverConfig);
    await configManager.saveConfig();
    
    // Refresh server list
    serverList.refreshList();
    
    updateProgress(100, 'Done!');
    
    // Show connected view
    setTimeout(() => {
      showAppConnected({
        ...connection,
        display_name: connection.display_name || 'Connected account'
      });
    }, 500);
  } catch (error) {
    console.error('Failed to check connection status:', error);
    notifications.show('Failed to complete connection: ' + error.message, 'error');
    
    // Go back to step 1
    document.getElementById('composio-connection-step-1').style.display = 'block';
    document.getElementById('composio-connection-step-2').style.display = 'none';
  }
}

/**
 * Update the progress bar
 * @param {number} percent - The progress percentage
 * @param {string} message - The progress message
 */
function updateProgress(percent, message) {
  const progressBar = document.getElementById('composio-progress-bar');
  const progressMessage = document.getElementById('composio-progress-message');
  
  progressBar.style.width = `${percent}%`;
  progressMessage.textContent = message;
}

/**
 * Reconnect the app
 */
function reconnectApp() {
  // Start the connection flow again
  startConnectionFlow();
}

/**
 * View the MCP server for this app
 */
function viewMcpServer() {
  // Close the app modal
  closeAppModal();
  
  // Find the server in the list
  const serverName = `composio-${currentAppData.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  const serverInfo = configManager.getServer(serverName);
  
  if (serverInfo) {
    // Server exists, open the edit modal
    require('../ui/server-form/index.js').openModal(serverName);
  } else {
    // No server exists yet, create one
    checkConnectionStatus();
  }
}

// Create and export a singleton instance
const composioManager = {
  initialize
};

export default composioManager;
