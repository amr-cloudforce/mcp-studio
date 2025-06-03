/**
 * Preload Script
 * Exposes safe APIs to the renderer process
 */

const { ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
window.api = {
  // Config operations
  readConfig: () => ipcRenderer.invoke('read-config'),
  getConfig: () => ipcRenderer.invoke('get-config'),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  writeConfig: (content) => ipcRenderer.invoke('write-config', content),
  revealConfig: () => ipcRenderer.invoke('reveal-config'),
  
  // Marketplace operations
  readMarketplaceData: () => ipcRenderer.invoke('read-marketplace-data'),
  
  // Utility operations
  openUrl: (url) => ipcRenderer.invoke('open-url', url),
  selectDirectory: () => ipcRenderer.invoke('select-directory'),
  
  // Logs operations
  getLogs: () => ipcRenderer.invoke('get-logs'),
  
  // URL fetch operations
  fetchUrl: (url) => ipcRenderer.invoke('fetch-url', url)
};

console.log('Preload script loaded, window.api exposed:', Object.keys(window.api));
