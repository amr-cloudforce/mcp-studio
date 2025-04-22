const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;

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

async function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    icon: path.join(__dirname, 'icon.png'),   // ← here
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  await ensureConfigFile();
  win.loadFile('index.html');
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

// App lifecycle
app.whenReady().then(createWindow);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
