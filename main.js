const { app, BrowserWindow, ipcMain, shell, dialog } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');
const os = require('os');

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
      contextIsolation: true,
      nodeIntegration: false
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

// IPC handlers
ipcMain.handle('read-config', async () => {
  const file = await ensureConfigFile();
  return fs.readFile(file, 'utf-8');
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

// App lifecycle
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
