/**
 * Composio Marketplace Data Module
 * Handles loading and parsing Composio apps data
 */

/**
 * Load Composio apps data from the API and cache it
 * @returns {Promise<Array>} - Array of Composio apps
 */
export async function loadComposioApps() {
  // Check cache first
  const cachedData = localStorage.getItem('composioAppsCache');
  const cacheTimestamp = localStorage.getItem('composioAppsCacheTimestamp');
  
  // If cache exists and is less than 24 hours old
  if (cachedData && cacheTimestamp) {
    const now = Date.now();
    const cacheAge = now - parseInt(cacheTimestamp);
    if (cacheAge < 24 * 60 * 60 * 1000) { // 24 hours
      return JSON.parse(cachedData);
    }
  }
  
  // Fetch fresh data
  try {
    console.log('[DEBUG] Attempting to require composio-service.js');
    // Use the same approach as in quick-add-connection.js
    const composioService = require('./composio-service.js');
    console.log('[DEBUG] composioService loaded:', !!composioService);
    
    // Get API key from localStorage
    const apiKey = localStorage.getItem('composioApiKey');
    console.log('[DEBUG] API key found in localStorage:', !!apiKey);
    
    // If no API key is set, return demo apps
    if (!apiKey) {
      console.warn('No Composio API key found. Using demo data.');
      const demoApps = getDemoApps();
      console.log('[DEBUG] Demo apps:', demoApps);
      return demoApps;
    }
    
    // Initialize SDK
    try {
      composioService.initializeSDK(apiKey);
    } catch (error) {
      console.warn('Failed to initialize Composio SDK:', error);
      
      // If the API key is invalid, clear it and show an error
      if (error.message.includes('apiKey')) {
        localStorage.removeItem('composioApiKey');
        alert('Invalid Composio API key. Please enter a valid key.');
        
        // Import the modal module to show the API key form
        const modalModule = await import('./modal.js');
        modalModule.showApiKeyForm();
      }
      
      return getDemoApps();
    }
    
    // Fetch apps
    try {
      console.log('[DEBUG] Calling composioService.listApps()');
      const apps = await composioService.listApps();
      console.log('[DEBUG] Raw apps data from API:', apps);
      
      // If apps is empty or undefined, use demo apps
      if (!apps || apps.length === 0) {
        console.warn('No Composio apps found. Using demo data.');
        const demoApps = getDemoApps();
        console.log('[DEBUG] Using demo apps instead:', demoApps);
        return demoApps;
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
      localStorage.setItem('composioAppsCache', JSON.stringify(formattedApps));
      localStorage.setItem('composioAppsCacheTimestamp', Date.now().toString());
      
      return formattedApps;
    } catch (error) {
      console.error('Failed to fetch Composio apps:', error);
      return getDemoApps();
    }
  } catch (error) {
    console.error('Failed to load Composio apps:', error);
    return getDemoApps();
  }
}

/**
 * Filter Composio apps based on prerequisites
 * @param {Array} items - Composio apps
 * @param {Object} prerequisites - Prerequisites status (docker, nodejs)
 * @returns {Array} - Filtered Composio apps with availability flag
 */
export function filterByPrerequisites(items, prerequisites) {
  return items.map(item => {
    let available = true;
    let reason = '';
    
    // Composio apps require Node.js
    if (!prerequisites.nodejs) {
      available = false;
      reason = 'Node.js is required but not installed';
    }
    
    return {
      ...item,
      available,
      unavailableReason: reason
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

/**
 * Get demo Composio apps for testing
 * @returns {Array} - Demo Composio apps
 */
function getDemoApps() {
  return [
    {
      repo_name: 'Twitter',
      summary_200_words: 'Connect to Twitter API to search tweets, post updates, and more.',
      category: 'Social Media',
      server_type: 'composio',
      stars: 42,
      available: true,
      app_id: 'twitter',
      app_key: 'twitter'
    },
    {
      repo_name: 'Gmail',
      summary_200_words: 'Access Gmail to read, send, and manage emails.',
      category: 'Productivity',
      server_type: 'composio',
      stars: 38,
      available: true,
      app_id: 'gmail',
      app_key: 'gmail'
    },
    {
      repo_name: 'Google Drive',
      summary_200_words: 'Access files and folders in Google Drive.',
      category: 'Productivity',
      server_type: 'composio',
      stars: 35,
      available: true,
      app_id: 'google-drive',
      app_key: 'google-drive'
    },
    {
      repo_name: 'Slack',
      summary_200_words: 'Send messages, create channels, and manage your Slack workspace.',
      category: 'Communication',
      server_type: 'composio',
      stars: 40,
      available: true,
      app_id: 'slack',
      app_key: 'slack'
    },
    {
      repo_name: 'GitHub',
      summary_200_words: 'Access GitHub repositories, issues, pull requests, and more.',
      category: 'Development',
      server_type: 'composio',
      stars: 45,
      available: true,
      app_id: 'github',
      app_key: 'github'
    },
    {
      repo_name: 'Jira',
      summary_200_words: 'Create and manage Jira issues, projects, and workflows.',
      category: 'Development',
      server_type: 'composio',
      stars: 37,
      available: true,
      app_id: 'jira',
      app_key: 'jira'
    },
    {
      repo_name: 'Salesforce',
      summary_200_words: 'Access Salesforce data, create records, and run reports.',
      category: 'Business',
      server_type: 'composio',
      stars: 39,
      available: true,
      app_id: 'salesforce',
      app_key: 'salesforce'
    },
    {
      repo_name: 'Stripe',
      summary_200_words: 'Process payments, manage customers, and access Stripe data.',
      category: 'Business',
      server_type: 'composio',
      stars: 41,
      available: true,
      app_id: 'stripe',
      app_key: 'stripe'
    }
  ];
}
