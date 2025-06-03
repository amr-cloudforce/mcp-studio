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
    
    // Fetch toolkits using V3 API
    try {
      console.log('[DEBUG] Calling composioService.listToolkits()');
      const toolkits = await composioService.listToolkits({ limit: 100 });
      console.log('[DEBUG] Raw toolkits data from V3 API:', toolkits);
      
      // If toolkits is empty or undefined, return empty array
      if (!toolkits || toolkits.length === 0) {
        console.warn('No Composio toolkits found. Please check your API key and try again.');
        return [];
      }
      
      // Filter toolkits to only include OAuth-supported apps
      console.log('[DEBUG] Filtering toolkits for OAuth support. Total toolkits:', toolkits.length);
      const oauthToolkits = toolkits.filter(toolkit => {
        const hasOAuth = toolkit.auth_schemes?.includes('OAUTH2') && 
                        toolkit.composio_managed_auth_schemes?.includes('OAUTH2');
        if (!hasOAuth) {
          console.log('[DEBUG] Filtering out non-OAuth toolkit:', toolkit.name, 'auth_schemes:', toolkit.auth_schemes);
        }
        return hasOAuth;
      });
      console.log('[DEBUG] OAuth-supported toolkits:', oauthToolkits.length, 'out of', toolkits.length);
      
      // Transform OAuth toolkits to match marketplace item format
      console.log('[DEBUG] Transforming OAuth toolkits data. First toolkit:', oauthToolkits[0]);
      const formattedApps = oauthToolkits.map(toolkit => {
        const formattedApp = {
          repo_name: toolkit.name || toolkit.slug,
          summary_200_words: toolkit.meta?.description || 'No description available',
          category: toolkit.meta?.categories?.[0]?.name || 'Composio Apps',
          server_type: 'composio',
          stars: 0, // V3 API doesn't provide popularity/stars
          available: true,
          app_id: toolkit.slug, // Store the toolkit slug for connection
          app_key: toolkit.slug, // Store the toolkit slug for connection
          toolkit_logo: toolkit.meta?.logo || null, // Store the toolkit logo URL
          toolkit_name: toolkit.name || 'Unknown',
          toolkit_slug: toolkit.slug,
          tools_count: toolkit.meta?.tools_count || 0,
          triggers_count: toolkit.meta?.triggers_count || 0
        };
        console.log('[DEBUG] Transformed toolkit:', formattedApp);
        return formattedApp;
      });
      console.log('[DEBUG] All formatted toolkits:', formattedApps);
      
      // Cache the data
      await ipcRenderer.invoke('composio-set-apps-cache', {
        data: formattedApps,
        timestamp: Date.now()
      });
      
      return formattedApps;
    } catch (error) {
      console.error('Failed to fetch Composio toolkits:', error);
      return [];
    }
  } catch (error) {
    console.error('Failed to load Composio toolkits:', error);
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
