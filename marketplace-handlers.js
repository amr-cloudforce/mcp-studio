/*
 * Marketplace Data Handlers Module
 * Handles IPC communication for marketplace data storage
 */

const fs = require('fs');
const path = require('path');
const { ipcMain } = require('electron');

// Storage for marketplace data
let composioData = {};
let apifyData = {};
let smitheryData = {};

// Data file paths
let composioDataPath;
let apifyDataPath;
let smitheryDataPath;

// Initialize data paths
function initializeDataPaths(app) {
  composioDataPath = path.join(app.getPath('userData'), 'composio.json');
  apifyDataPath = path.join(app.getPath('userData'), 'apify.json');
  smitheryDataPath = path.join(app.getPath('userData'), 'smithery.json');
}

// Load data functions
function loadComposioData() {
  try {
    const data = fs.readFileSync(composioDataPath, 'utf8');
    composioData = JSON.parse(data);
  } catch {
    composioData = {};
  }
}

function saveComposioData() {
  fs.writeFileSync(composioDataPath, JSON.stringify(composioData, null, 2), 'utf8');
}

function loadApifyData() {
  try {
    const data = fs.readFileSync(apifyDataPath, 'utf8');
    apifyData = JSON.parse(data);
  } catch {
    apifyData = {};
  }
}

function saveApifyData() {
  fs.writeFileSync(apifyDataPath, JSON.stringify(apifyData, null, 2), 'utf8');
}

function loadSmitheryData() {
  try {
    const data = fs.readFileSync(smitheryDataPath, 'utf8');
    smitheryData = JSON.parse(data);
  } catch {
    smitheryData = {};
  }
}

function saveSmitheryData() {
  fs.writeFileSync(smitheryDataPath, JSON.stringify(smitheryData, null, 2), 'utf8');
}

// Setup marketplace-related IPC handlers
function setupMarketplaceHandlers(app) {
  // Initialize data paths and load data
  initializeDataPaths(app);
  loadComposioData();
  loadApifyData();
  loadSmitheryData();

  // Composio storage handlers
  ipcMain.handle('composio-get-api-key', () => {
    return composioData.apiKey || '';
  });

  ipcMain.handle('composio-set-api-key', (_, key) => {
    composioData.apiKey = key;
    saveComposioData();
  });

  ipcMain.handle('composio-get-apps-cache', () => {
    return composioData.appsCache || null;
  });

  ipcMain.handle('composio-set-apps-cache', (_, cache) => {
    composioData.appsCache = cache;
    saveComposioData();
  });

  // Apify storage handlers
  ipcMain.handle('apify-get-api-key', () => {
    return apifyData.apiKey || '';
  });

  ipcMain.handle('apify-set-api-key', (_, key) => {
    apifyData.apiKey = key;
    saveApifyData();
  });

  ipcMain.handle('apify-get-actors-cache', () => {
    return apifyData.actorsCache || null;
  });

  ipcMain.handle('apify-set-actors-cache', (_, cache) => {
    apifyData.actorsCache = cache;
    saveApifyData();
  });

  // Smithery storage handlers
  ipcMain.handle('smithery-get-credentials', () => {
    return smitheryData.credentials || null;
  });

  ipcMain.handle('smithery-set-credentials', (_, credentials) => {
    smitheryData.credentials = credentials;
    saveSmitheryData();
  });

  ipcMain.handle('smithery-get-servers-cache', () => {
    return smitheryData.serversCache || null;
  });

  ipcMain.handle('smithery-set-servers-cache', (_, cache) => {
    smitheryData.serversCache = cache;
    saveSmitheryData();
  });
}

module.exports = { setupMarketplaceHandlers };
