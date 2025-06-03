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
 * 
 * WARNING: NOT ADHERING TO THESE LAWS IS CONSIDERED BREAKING THE LAW AND COULD LEAD TO SEVERE DAMAGE.
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs').promises;

// Import modules
const { setupIpcHandlers } = require('./ipc-handlers');
const { checkDocker, checkNodejs, getDockerInstallUrl, getNodejsInstallUrl, setupSystemHandlers } = require('./system-utils');

// Pull in the full login-shell PATH for GUI apps
require('fix-path')();

function getConfigPath() {
  if (process.platform === 'darwin') {
    return path.join(app.getPath('home'), 'Library', 'Application Support', 'MCP Studio', 'mcp_studio_config.json');
  } else {
    // Windows and Linux
    return path.join(app.getPath('appData'), 'MCP Studio', 'mcp_studio_config.json');
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

// Initialize application
async function initializeApp() {
  // Setup IPC handlers
  setupIpcHandlers(app, ensureConfigFile);
  setupSystemHandlers(app);
  
  // Create main window
  await createWindow();
}

// App lifecycle
app.whenReady().then(initializeApp);
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
