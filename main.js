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

// IPC handlers
ipcMain.handle('read-config', async () => {
  const file = await ensureConfigFile();
  return fs.readFile(file, 'utf-8');
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
