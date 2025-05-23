/**
 * WARNING: CREATING DEMO/DUMMY DATA WITHOUT EXPLICIT USER CONSENT IS FRAUD AND AGAINST THE LAW.
 * ANY IMPLEMENTATION OF DEMO DATA GENERATION WITHOUT USER PERMISSION IS STRICTLY PROHIBITED.
 * VIOLATORS MAY BE SUBJECT TO LEGAL ACTION.
 */

/**
 * Composio Marketplace Data Module
 * Handles loading and parsing Composio apps data
 */

const { ipcRenderer } = require('electron');

/**
 * Load Composio apps data from the API and cache it
 * @returns {Promise<Array>} - Array of Composio apps
 */
export async function loadComposioApps() {
  // Check cache first
  const cachedData = await ipcRenderer.invoke('composio-get-apps-cache');
  
  // If cache exists and is less than 24 hours old
  if (cachedData && cachedData.timestamp) {
    const now = Date.now();
    const cacheAge = now - cachedData.timestamp;
    if (cacheAge < 24 * 60 * 60 * 1000) { // 24 hours
      return cachedData.data;
    }
  }
  
  // Fetch fresh data
  try {
    console.log('[DEBUG] Attempting to require composio-service.js');
    // Use the same approach as in quick-add-connection.js
    const composioService = require('./composio-service.js');
    console.log('[DEBUG] composioService loaded:', !!composioService);
    
    // Get API key from storage
    const apiKey = await ipcRenderer.invoke('composio-get-api-key');
    console.log('[DEBUG] API key found in storage:', !!apiKey);
    
    // If no API key is set, return empty array
    if (!apiKey) {
      console.warn('No Composio API key found. Please set an API key to access Composio apps.');
      return [];
    }
    
    // Initialize SDK
    try {
      composioService.initializeSDK(apiKey);
    } catch (error) {
      console.warn('Failed to initialize Composio SDK:', error);
      
      // If the API key is invalid, clear it and show an error
      if (error.message.includes('apiKey')) {
        await ipcRenderer.invoke('composio-set-api-key', '');
        alert('Invalid Composio API key. Please enter a valid key.');
        
        // Import the modal module to show the API key form
        const modalModule = await import('./modal.js');
        modalModule.showApiKeyForm();
      }
      
      return [];
    }
    
    // Fetch apps
    try {
      console.log('[DEBUG] Calling composioService.listApps()');
      const apps = await composioService.listApps();
      console.log('[DEBUG] Raw apps data from API:', apps);
      
      // If apps is empty or undefined, return empty array
      if (!apps || apps.length === 0) {
        console.warn('No Composio apps found. Please check your API key and try again.');
        return [];
      }
      
      // Transform apps to match marketplace item format
      console.log('[DEBUG] Transforming apps data. First app:', apps[0]);
      const formattedApps = apps.map(app => {
        const formattedApp = {
          repo_name: app.name || app.key,
          summary_200_words: app.description || 'No description available',
          category: app.category || 'Composio Apps',
          server_type: 'composio',
          stars: app.popularity || 0,
          available: true,
          app_id: app.id, // Store the app ID for connection
          app_key: app.key // Store the app key for connection
        };
        console.log('[DEBUG] Transformed app:', formattedApp);
        return formattedApp;
      });
      console.log('[DEBUG] All formatted apps:', formattedApps);
      
      // Cache the data
      await ipcRenderer.invoke('composio-set-apps-cache', {
        data: formattedApps,
        timestamp: Date.now()
      });
      
      return formattedApps;
    } catch (error) {
      console.error('Failed to fetch Composio apps:', error);
      return [];
    }
  } catch (error) {
    console.error('Failed to load Composio apps:', error);
    return [];
  }
}

/**
 * Filter Composio apps based on prerequisites
 * @param {Array} items - Composio apps
 * @param {Object} prerequisites - Prerequisites status (docker, nodejs)
 * @returns {Array} - Filtered Composio apps with availability flag
 */
export function filterByPrerequisites(items, prerequisites) {
  // Force all items to be available regardless of prerequisites
  return items.map(item => {
    return {
      ...item,
      available: true,
      unavailableReason: ''
    };
  });
}

/**
 * Group Composio apps by category
 * @param {Array} items - Composio apps
 * @returns {Object} - Items grouped by category
 */
export function groupByCategory(items) {
  const grouped = {};
  
  items.forEach(item => {
    const category = item.category || 'Uncategorized';
    
    if (!grouped[category]) {
      grouped[category] = [];
    }
    
    grouped[category].push(item);
  });
  
  return grouped;
}
