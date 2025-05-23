/**
 * WARNING: CREATING DEMO/DUMMY DATA WITHOUT EXPLICIT USER CONSENT IS FRAUD AND AGAINST THE LAW.
 * ANY IMPLEMENTATION OF DEMO DATA GENERATION WITHOUT USER PERMISSION IS STRICTLY PROHIBITED.
 * VIOLATORS MAY BE SUBJECT TO LEGAL ACTION.
 */

/**
 * Apify Marketplace Data Module
 * Handles loading and parsing Apify actors data
 */

const { ipcRenderer } = require('electron');

/**
 * Load Apify actors data from the API and cache it
 * @returns {Promise<Array>} - Array of Apify actors
 */
export async function loadApifyActors() {
  // Check cache first
  const cachedData = await ipcRenderer.invoke('apify-get-actors-cache');
  
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
    console.log('[DEBUG] Fetching Apify actors from API');
    
    // Get API key from storage
    const apiKey = await ipcRenderer.invoke('apify-get-api-key');
    console.log('[DEBUG] API key found in storage:', !!apiKey);
    
    // If no API key is set, return empty array
    if (!apiKey) {
      console.warn('No Apify API key found. Please set an API key to access Apify actors.');
      return [];
    }
    
    // Fetch actors from Apify Store API
    try {
      console.log('[DEBUG] Calling Apify Store API');
      const response = await fetch('https://api.apify.com/v2/store?limit=200', {
        headers: {
          'Authorization': `Bearer ${apiKey}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          // Invalid API key
          await ipcRenderer.invoke('apify-set-api-key', '');
          alert('Invalid Apify API key. Please enter a valid key.');
          
          // Import the modal module to show the API key form
          const modalModule = await import('./modal.js');
          modalModule.showApiKeyForm();
          return [];
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log('[DEBUG] Raw actors data from Apify API:', data);
      
      // If no actors found, return empty array
      if (!data.data || !data.data.items || data.data.items.length === 0) {
        console.warn('No Apify actors found. Please check your API key and try again.');
        return [];
      }
      
      // Transform actors to match marketplace item format
      console.log('[DEBUG] Transforming actors data. First actor:', data.data.items[0]);
      const formattedActors = data.data.items.map(actor => {
        // Create proper actor identifier: username/name
        const actorIdentifier = `${actor.username || 'unknown'}/${actor.name || actor.id}`;
        
        const formattedActor = {
          repo_name: actor.name || actor.id,
          summary_200_words: actor.description || 'No description available',
          category: 'Apify Actors',
          server_type: 'apify',
          stars: actor.stats?.totalRuns || 0,
          available: true,
          actor_id: actorIdentifier, // Use username/name format for server config
          actor_name: actor.name || 'Unknown',
          actor_username: actor.username || '',
          actor_title: actor.title || actor.name || 'Unknown',
          actor_description: actor.description || 'No description available',
          actor_stats: actor.stats || {},
          actor_categories: actor.categories || [],
          actor_pricing: actor.currentPricingInfo || null,
          // Keep original ID for reference
          original_id: actor.id
        };
        console.log('[DEBUG] Transformed actor:', formattedActor);
        return formattedActor;
      });
      console.log('[DEBUG] All formatted actors:', formattedActors);
      
      // Cache the data
      await ipcRenderer.invoke('apify-set-actors-cache', {
        data: formattedActors,
        timestamp: Date.now()
      });
      
      return formattedActors;
    } catch (error) {
      console.error('Failed to fetch Apify actors:', error);
      return [];
    }
  } catch (error) {
    console.error('Failed to load Apify actors:', error);
    return [];
  }
}

/**
 * Get currently selected actors from server configuration
 * @returns {Promise<Array>} - Array of selected actor identifiers
 */
export async function getSelectedActors() {
  try {
    const config = await ipcRenderer.invoke('get-config');
    const apifyServer = config.mcpServers['actors-mcp-server'];
    
    if (!apifyServer || !apifyServer.args) {
      return [];
    }
    
    // Find the --actors argument
    const actorsIndex = apifyServer.args.indexOf('--actors');
    if (actorsIndex === -1 || actorsIndex + 1 >= apifyServer.args.length) {
      return [];
    }
    
    const actorsString = apifyServer.args[actorsIndex + 1];
    return actorsString ? actorsString.split(',').map(id => id.trim()) : [];
  } catch (error) {
    console.error('Failed to get selected actors:', error);
    return [];
  }
}

/**
 * Check if an actor is currently selected
 * @param {string} actorId - Actor identifier to check
 * @returns {Promise<boolean>} - True if actor is selected
 */
export async function isActorSelected(actorId) {
  const selectedActors = await getSelectedActors();
  return selectedActors.includes(actorId);
}
