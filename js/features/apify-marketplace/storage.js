/**
 * Apify Marketplace Storage Module
 * Handles API key storage and cache management
 */

const { ipcRenderer } = require('electron');

/**
 * Get the stored Apify API key
 * @returns {Promise<string>} - The API key or empty string
 */
export async function getApiKey() {
  try {
    return await ipcRenderer.invoke('apify-get-api-key');
  } catch (error) {
    console.error('Failed to get Apify API key:', error);
    return '';
  }
}

/**
 * Set the Apify API key
 * @param {string} apiKey - The API key to store
 * @returns {Promise<boolean>} - True if successful
 */
export async function setApiKey(apiKey) {
  try {
    await ipcRenderer.invoke('apify-set-api-key', apiKey);
    return true;
  } catch (error) {
    console.error('Failed to set Apify API key:', error);
    return false;
  }
}

/**
 * Get cached actors data
 * @returns {Promise<Object|null>} - Cached data with timestamp or null
 */
export async function getActorsCache() {
  try {
    return await ipcRenderer.invoke('apify-get-actors-cache');
  } catch (error) {
    console.error('Failed to get actors cache:', error);
    return null;
  }
}

/**
 * Set cached actors data
 * @param {Object} cacheData - Data to cache with timestamp
 * @returns {Promise<boolean>} - True if successful
 */
export async function setActorsCache(cacheData) {
  try {
    await ipcRenderer.invoke('apify-set-actors-cache', cacheData);
    return true;
  } catch (error) {
    console.error('Failed to set actors cache:', error);
    return false;
  }
}

/**
 * Clear cached actors data
 * @returns {Promise<boolean>} - True if successful
 */
export async function clearActorsCache() {
  try {
    await ipcRenderer.invoke('apify-set-actors-cache', null);
    return true;
  } catch (error) {
    console.error('Failed to clear actors cache:', error);
    return false;
  }
}
