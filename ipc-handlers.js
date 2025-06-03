/*
 * IPC Handlers Module
 * Handles all IPC communication between main and renderer processes
 */

const { ipcMain, shell, dialog, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { exec } = require('child_process');
const os = require('os');
const readline = require('readline');
const https = require('https');
const http = require('http');
const { setupMarketplaceHandlers } = require('./marketplace-handlers');



// Get marketplace data path
function getMarketplaceDataPath() {
  return path.join(__dirname, 'marketplace.json');
}

// Get logs directory path
function getLogsPath(app) {
  if (process.platform === 'darwin') {
    return path.join(app.getPath('home'), 'Library', 'Logs', 'Claude');
  } else if (process.platform === 'win32') {
    return path.join(app.getPath('appData'), 'Claude', 'logs');
  } else {
    // Linux
    return path.join(app.getPath('home'), '.config', 'Claude', 'logs');
  }
}

// Parse a log line into a structured object
function parseLogLine(line) {
  try {
    const regex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z) \[([^\]]+)\] \[([^\]]+)\] (.+)$/;
    const match = line.match(regex);
    
    if (!match) {
      return null;
    }
    
    const [, timestamp, server, level, message] = match;
    
    let details = null;
    const jsonMatch = message.match(/(\{.+\})$/);
    
    if (jsonMatch) {
      try {
        details = JSON.parse(jsonMatch[1]);
      } catch (e) {
        // Not valid JSON, ignore
      }
    }
    
    return {
      timestamp,
      server,
      level,
      message: details ? message.replace(jsonMatch[1], '') : message,
      details
    };
  } catch (error) {
    console.error('Failed to parse log line:', error);
    return null;
  }
}

// Read log file and parse lines
async function readLogFile(filePath) {
  return new Promise((resolve, reject) => {
    const logs = [];
    
    try {
      const fileStream = fsSync.createReadStream(filePath);
      const rl = readline.createInterface({
        input: fileStream,
        crlfDelay: Infinity
      });
      
      rl.on('line', (line) => {
        const parsedLine = parseLogLine(line);
        if (parsedLine) {
          logs.push(parsedLine);
        }
      });
      
      rl.on('close', () => {
        resolve(logs);
      });
      
      rl.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
}

// Setup all IPC handlers
function setupIpcHandlers(app, ensureConfigFile) {
  // Setup marketplace handlers
  setupMarketplaceHandlers(app);

  // Config handlers
  ipcMain.handle('read-config', async () => {
    const file = await ensureConfigFile();
    return fs.readFile(file, 'utf-8');
  });

  ipcMain.handle('get-config', async () => {
    const file = await ensureConfigFile();
    const content = await fs.readFile(file, 'utf-8');
    return JSON.parse(content);
  });

  ipcMain.handle('save-config', async (_, config) => {
    const file = await ensureConfigFile();
    await fs.writeFile(file, JSON.stringify(config, null, 2), 'utf-8');
    return file;
  });

  ipcMain.handle('write-config', async (_e, content) => {
    const file = await ensureConfigFile();
    await fs.writeFile(file, content, 'utf-8');
    return file;
  });

  ipcMain.handle('reveal-config', async () => {
    const file = await ensureConfigFile();
    shell.showItemInFolder(file);
  });

  // Marketplace data handler
  ipcMain.handle('read-marketplace-data', async () => {
    try {
      const file = getMarketplaceDataPath();
      return fs.readFile(file, 'utf-8');
    } catch (error) {
      console.error('Failed to read marketplace data:', error);
      throw new Error('Failed to read marketplace data');
    }
  });

  // Utility handlers
  ipcMain.handle('open-url', async (_, url) => {
    shell.openExternal(url);
  });

  ipcMain.handle('select-directory', async (event) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory', 'createDirectory'],
      title: 'Select Directory'
    });
    
    return result.canceled ? null : result.filePaths[0];
  });

  // Logs handler
  ipcMain.handle('get-logs', async () => {
    try {
      const logsDir = getLogsPath(app);
      
      try {
        await fs.access(logsDir);
      } catch (error) {
        console.error('Logs directory not found:', logsDir);
        return {};
      }
      
      const files = await fs.readdir(logsDir);
      const logFiles = files.filter(file => file.endsWith('.log'));
      
      const logs = {};
      
      for (const file of logFiles) {
        const filePath = path.join(logsDir, file);
        const serverName = file.replace(/^mcp-server-/, '').replace(/\.log$/, '');
        
        try {
          logs[serverName] = await readLogFile(filePath);
        } catch (error) {
          console.error(`Failed to read log file ${file}:`, error);
          logs[serverName] = [];
        }
      }
      
      return logs;
    } catch (error) {
      console.error('Failed to get logs:', error);
      return {};
    }
  });

  // URL fetch handler
  ipcMain.handle('fetch-url', async (_, url) => {
    return new Promise((resolve, reject) => {
      try {
        const client = url.startsWith('https:') ? https : http;
        
        const request = client.get(url, (response) => {
          if (response.statusCode === 301 || response.statusCode === 302) {
            const redirectUrl = new URL(response.headers.location, url).toString();
            return ipcMain.handle('fetch-url', null, redirectUrl)
              .then(resolve)
              .catch(reject);
          }
          
          if (response.statusCode < 200 || response.statusCode >= 300) {
            return reject(new Error(`Failed to fetch URL: ${response.statusCode}`));
          }
          
          let data = '';
          response.on('data', (chunk) => {
            data += chunk;
          });
          
          response.on('end', () => {
            resolve(data);
          });
        });
        
        request.on('error', (error) => {
          reject(error);
        });
        
        request.setTimeout(10000, () => {
          request.abort();
          reject(new Error('Request timed out'));
        });
      } catch (error) {
        reject(error);
      }
    });
  });
}

module.exports = { setupIpcHandlers };
