/**
 * Composio App Selector Module
 * Handles fetching and selecting Composio apps
 */

let base;
let appSelectorContainer;
let apiKeyInput;
let appNameInput;
let fetchButton;
let appSelect;
let loadingIndicator;
let errorDisplay;
let cachedApps = [];

/**
 * Initialize the app selector module
 * @param {Object} baseModule - The base module instance
 */
export function init(baseModule) {
  base = baseModule;
  
  // The DOM elements will be initialized later when the form is generated
  // We don't need to do anything here
}

/**
 * Set up event listeners
 */
function setupEventListeners() {
  // Fetch button click handler
  fetchButton.addEventListener('click', fetchApps);
}

/**
 * Fetch apps from Composio
 */
async function fetchApps() {
  const apiKey = apiKeyInput.value.trim();
  
  if (!apiKey) {
    showError('API Key is required');
    return;
  }
  
  // Show loading indicator
  loadingIndicator.style.display = 'block';
  errorDisplay.style.display = 'none';
  
  try {
    // Use the composio-service.js module
    const composioService = require('../../../composio-service.js');
    
    // Initialize SDK with the API key
    composioService.initializeSDK(apiKey);
    
    // Verify API key
    await composioService.verifyApiKey();
    
    // Fetch available apps
    const apps = await composioService.listApps();
    cachedApps = apps;
    
    // Populate the select dropdown
    appSelect.innerHTML = '';
    
    if (apps.length === 0) {
      showError('No apps found for this API key');
      return;
    }
    
    apps.forEach(app => {
      const option = document.createElement('option');
      option.value = app.uniqueKey || app.name;
      option.textContent = app.displayName || app.name;
      appSelect.appendChild(option);
    });
    
    // Update the hidden input with the selected app
    updateAppNameInput();
    
    // Show the app select
    appSelect.style.display = 'block';
  } catch (error) {
    console.error('Error fetching Composio apps:', error);
    showError(`Error: ${error.message || 'Failed to fetch apps'}`);
  } finally {
    // Hide loading indicator
    loadingIndicator.style.display = 'none';
  }
}

/**
 * Show an error message
 * @param {string} message - The error message
 */
function showError(message) {
  errorDisplay.textContent = message;
  errorDisplay.style.display = 'block';
}

/**
 * Update the hidden app name input with the selected app
 */
function updateAppNameInput() {
  if (appSelect.value) {
    appNameInput.value = appSelect.value;
  }
}

/**
 * Generate the app selector HTML
 * @returns {string} - The HTML for the app selector
 */
export function generateHtml() {
  return `
    <div id="app-selector-container" class="app-selector-container">
      <div style="margin-top: 10px; margin-bottom: 15px;">
        <button type="button" id="fetch-apps-btn" class="btn btn-primary" style="width: 100%; padding: 10px; font-size: 16px; font-weight: bold; background-color: #4A56E2; color: white; border: none; border-radius: 4px; cursor: pointer;">
          FETCH AVAILABLE APPS
        </button>
        <div id="app-loading" style="display: none; margin-top: 10px; text-align: center; font-weight: bold; color: #4A56E2;">
          <span>Loading apps...</span>
        </div>
        <div id="app-error" style="display: none; margin-top: 10px; color: red; text-align: center; font-weight: bold;"></div>
      </div>
      <select id="app-select" style="width: 100%; display: none; margin-top: 10px; padding: 10px; border: 2px solid #4A56E2; border-radius: 4px; font-size: 14px;"></select>
    </div>
  `;
}

/**
 * Initialize the app selector after the HTML has been added to the DOM
 */
export function initializeSelector() {
  // Get the elements
  fetchButton = document.getElementById('fetch-apps-btn');
  appSelect = document.getElementById('app-select');
  loadingIndicator = document.getElementById('app-loading');
  errorDisplay = document.getElementById('app-error');
  appSelectorContainer = document.getElementById('app-selector-container');
  apiKeyInput = document.getElementById('input-COMPOSIO_API_KEY');
  appNameInput = document.getElementById('input-appName');
  
  if (!fetchButton || !appSelect || !loadingIndicator || !errorDisplay) {
    console.error('App selector elements not found');
    return;
  }
  
  if (!apiKeyInput || !appNameInput) {
    console.error('API key or app name input not found');
    return;
  }
  
  // Set up event listeners
  fetchButton.addEventListener('click', fetchApps);
  
  // Set up change handler for the app select
  appSelect.addEventListener('change', updateAppNameInput);
}
