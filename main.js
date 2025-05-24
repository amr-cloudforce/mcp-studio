/*
 * CODING CONSTITUTION - MANDATORY RULES:
 * 
 * 1. Never change anything that has not been discussed with the user or is unrelated to the current task.
 * 2. Never add placeholders or dummy or demo data without an explicit request from the user.
 * 3. Never make a code file larger than 300 lines of code; if it exceeds this, split it as appropriate. 
 *    THE only exceptions ARE JSON DATA FILES, PACKAGE.JSON OR OTHER FILES THAT ARE NOT MEANT TO BE SPLIT.
 * 4. Never make assumptions on behalf of the user. If you don't know how to do something or keep going 
 *    round in circles, you stop and think about the cause instead of doing trial and error and wasting 
 *    the user's time and money.
 * 5. When there is a bug, your most important task is to identify the possible reasons and use debugging 
 *    techniques (don't ever ask the user to read code and debug for you) to reduce the search radius, 
 *    e.g. add a log that would confirm an assumption before starting to code.
 * 6. When you fix something and the error is not fixed because you made a wrong assumption, you undo 
 *    this yourself without an explicit request from the user.
 * * 3. Never make a code file larger than 300 lines of code; if it exceeds this, split it as appropriate. 
 *    THE only exceptions ARE JSON DATA FILES, PACKAGE.JSON OR OTHER FILES THAT ARE NOT MEANT TO BE SPLIT.* 3. Never make a code file larger than 300 lines of code; if it exceeds this, split it as appropriate. 
 *    THE only exceptions ARE JSON DATA FILES, PACKAGE.JSON OR OTHER FILES THAT ARE NOT MEANT TO BE SPLIT.* 3. Never make a code file larger than 300 lines of code; if it exceeds this, split it as appropriate. 
 *    THE only exceptions ARE JSON DATA FILES, PACKAGE.JSON OR OTHER FILES THAT ARE NOT MEANT TO BE SPLIT.* 3. Never make a code file larger than 300 lines of code; if it exceeds this, split it as appropriate. 
 *    THE only exceptions ARE JSON DATA FILES, PACKAGE.JSON OR OTHER FILES THAT ARE NOT MEANT TO BE SPLIT.* 3. Never make a code file larger than 300 lines of code; if it exceeds this, split it as appropriate. 
 *    THE only exceptions ARE JSON DATA FILES, PACKAGE.JSON OR OTHER FILES THAT ARE NOT MEANT TO BE SPLIT.* 3. Never make a code file larger than 300 lines of code; if it exceeds this, split it as appropriate. 
 *    THE only exceptions ARE JSON DATA FILES, PACKAGE.JSON OR OTHER FILES THAT ARE NOT MEANT TO BE SPLIT.* 3. Never make a code file larger than 300 lines of code; if it exceeds this, split it as appropriate. 
 *    THE only exceptions ARE JSON DATA FILES, PACKAGE.JSON OR OTHER FILES THAT ARE NOT MEANT TO BE SPLIT.
 * 
 * WARNING: NOT ADHERING TO THESE LAWS IS CONSIDERED BREAKING THE LAW AND COULD LEAD TO SEVERE DAMAGE.
 */

const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const fsSync = require('fs');
const { exec } = require('child_process');
const os = require('os');
const readline = require('readline');
const https = require('https');
const http = require('http');

// Pull in the full login-shell PATH for GUI apps
require('fix-path')();

function getConfigPath() {
  if (process.platform === 'darwin') {
    return path.join(app.getPath('home'), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else {
    // Windows and Linux
    return path.join(app.getPath('appData'), 'Claude', 'claude_desktop_config.json');
  }
}

async function ensureConfigFile() {
  const configPath = getConfigPath();
  const dir = path.dirname(configPath);
  await fs.mkdir(dir, { recursive: true });
  try {
    await fs.access(configPath);
  } catch {
    // create with a minimal default
    const defaultConfig = { mcpServers: {} };
    await fs.writeFile(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
  }
  return configPath;
}

// Check if Docker is installed
async function checkDocker() {
  return new Promise((resolve) => {
    exec('docker --version', (error) => {
      resolve(!error);
    });
  });
}

// Check if Node.js is installed
async function checkNodejs() {
  return new Promise((resolve) => {
    exec('node --version', (error) => {
      resolve(!error);
    });
  });
}

// Get Docker installation URL based on OS
function getDockerInstallUrl() {
  const platform = os.platform();
  if (platform === 'darwin') { // macOS
    return 'https://docs.docker.com/desktop/install/mac/';
  } else if (platform === 'win32') { // Windows
    return 'https://docs.docker.com/desktop/install/windows/';
  } else { // Linux or other
    return 'https://docs.docker.com/engine/install/';
  }
}

// Get Node.js installation URL
function getNodejsInstallUrl() {
  return 'https://nodejs.org/en/download/';
}

async function createWindow() {
  // Check prerequisites
  const dockerInstalled = await checkDocker();
  const nodejsInstalled = await checkNodejs();
  
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: false,
      nodeIntegration: true
    }
  });

  await ensureConfigFile();
  win.loadFile('index.html');
  
  // Pass prerequisite status to renderer
  win.webContents.on('did-finish-load', () => {
    win.webContents.send('prerequisites-status', {
      docker: dockerInstalled,
      nodejs: nodejsInstalled,
      dockerUrl: getDockerInstallUrl(),
      nodejsUrl: getNodejsInstallUrl(),
      appVersion: app.getVersion()
    });
  });
}

// Get marketplace data path
function getMarketplaceDataPath() {
  return path.join(__dirname, 'marketplace.json');
}

// Storage for Composio data
let composioData = {};
const composioDataPath = path.join(app.getPath('userData'), 'composio.json');

// Load composio data on startup
function loadComposioData() {
  try {
    const data = fsSync.readFileSync(composioDataPath, 'utf8');
    composioData = JSON.parse(data);
  } catch {
    composioData = {};
  }
}

// Save composio data
function saveComposioData() {
  fsSync.writeFileSync(composioDataPath, JSON.stringify(composioData, null, 2), 'utf8');
}

// Storage for Apify data
let apifyData = {};
const apifyDataPath = path.join(app.getPath('userData'), 'apify.json');

// Load apify data on startup
function loadApifyData() {
  try {
    const data = fsSync.readFileSync(apifyDataPath, 'utf8');
    apifyData = JSON.parse(data);
  } catch {
    apifyData = {};
  }
}

// Save apify data
function saveApifyData() {
  fsSync.writeFileSync(apifyDataPath, JSON.stringify(apifyData, null, 2), 'utf8');
}

// Load data on startup
loadComposioData();
loadApifyData();

// IPC handlers for Composio storage
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

// IPC handlers for Apify storage
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

// IPC handlers
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

ipcMain.handle('read-marketplace-data', async () => {
  try {
    const file = getMarketplaceDataPath();
    return fs.readFile(file, 'utf-8');
  } catch (error) {
    console.error('Failed to read marketplace data:', error);
    throw new Error('Failed to read marketplace data');
  }
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

ipcMain.handle('open-url', async (_, url) => {
  shell.openExternal(url);
});

ipcMain.handle('check-prerequisites', async () => {
  return {
    docker: await checkDocker(),
    nodejs: await checkNodejs(),
    dockerUrl: getDockerInstallUrl(),
    nodejsUrl: getNodejsInstallUrl()
  };
});

// Restart Claude
ipcMain.handle('restart-claude', async () => {
  return new Promise((resolve, reject) => {
    // Path to Claude executable
    const claudePath = process.platform === 'darwin' 
      ? '/Applications/Claude.app/Contents/MacOS/Claude'
      : (process.platform === 'win32' 
          ? path.join(process.env.LOCALAPPDATA, 'Claude', 'Claude.exe')
          : '/usr/bin/claude'); // Linux (placeholder)
    
    // Check if Claude exists
    fs.access(claudePath).then(() => {
      // Kill existing Claude process
      const killCmd = process.platform === 'darwin' 
        ? "pkill -f 'Claude'" 
        : (process.platform === 'win32' 
            ? 'taskkill /F /IM Claude.exe' 
            : "pkill -f 'Claude'");
      
      exec(killCmd, (error) => {
        // Start Claude again
        exec(claudePath, (error, stdout, stderr) => {
          if (error) {
            console.error('Error restarting Claude:', error);
            reject(error);
          } else {
            console.log('Claude restarted successfully');
            resolve(true);
          }
        });
      });
    }).catch(err => {
      console.error('Claude executable not found:', claudePath);
      reject(new Error('Claude executable not found'));
    });
  });
});

// Get logs directory path
function getLogsPath() {
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
    // Example log format: 2025-05-12T16:17:33.029Z [tavily-mcp] [info] Initializing server...
    const regex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z) \[([^\]]+)\] \[([^\]]+)\] (.+)$/;
    const match = line.match(regex);
    
    if (!match) {
      return null;
    }
    
    const [, timestamp, server, level, message] = match;
    
    // Check if the message contains JSON
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

// IPC handler for selecting a directory
ipcMain.handle('select-directory', async (event) => {
  const window = BrowserWindow.fromWebContents(event.sender);
  const result = await dialog.showOpenDialog(window, {
    properties: ['openDirectory', 'createDirectory'],
    title: 'Select Directory'
  });
  
  return result.canceled ? null : result.filePaths[0];
});

// IPC handler for getting logs
ipcMain.handle('get-logs', async () => {
  try {
    const logsDir = getLogsPath();
    
    // Check if logs directory exists
    try {
      await fs.access(logsDir);
    } catch (error) {
      console.error('Logs directory not found:', logsDir);
      return {};
    }
    
    // Get all log files
    const files = await fs.readdir(logsDir);
    const logFiles = files.filter(file => file.endsWith('.log'));
    
    // Read and parse each log file
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

// IPC handler for fetching a URL
ipcMain.handle('fetch-url', async (_, url) => {
  return new Promise((resolve, reject) => {
    try {
      // Determine if we should use http or https
      const client = url.startsWith('https:') ? https : http;
      
      const request = client.get(url, (response) => {
        // Handle redirects
        if (response.statusCode === 301 || response.statusCode === 302) {
          // Make a new request to the redirect location
          const redirectUrl = new URL(response.headers.location, url).toString();
          return ipcMain.handle('fetch-url', null, redirectUrl)
            .then(resolve)
            .catch(reject);
        }
        
        // Check for successful response
        if (response.statusCode < 200 || response.statusCode >= 300) {
          return reject(new Error(`Failed to fetch URL: ${response.statusCode}`));
        }
        
        // Collect response data
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
      
      // Set a timeout
      request.setTimeout(10000, () => {
        request.abort();
        reject(new Error('Request timed out'));
      });
    } catch (error) {
      reject(error);
    }
  });
});

// App lifecycle
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
