/*
 * System Utilities Module
 * Handles system-related operations like prerequisite checks and Claude restart
 */

const { exec } = require('child_process');
const { ipcMain } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const os = require('os');

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
  if (platform === 'darwin') {
    return 'https://docs.docker.com/desktop/install/mac/';
  } else if (platform === 'win32') {
    return 'https://docs.docker.com/desktop/install/windows/';
  } else {
    return 'https://docs.docker.com/engine/install/';
  }
}

// Get Node.js installation URL
function getNodejsInstallUrl() {
  return 'https://nodejs.org/en/download/';
}

// Setup system-related IPC handlers
function setupSystemHandlers(app) {
  // Prerequisites check handler
  ipcMain.handle('check-prerequisites', async () => {
    return {
      docker: await checkDocker(),
      nodejs: await checkNodejs(),
      dockerUrl: getDockerInstallUrl(),
      nodejsUrl: getNodejsInstallUrl()
    };
  });

  // Restart Claude handler (existing method)
  ipcMain.handle('restart-claude', async () => {
    return new Promise((resolve, reject) => {
      const claudePath = process.platform === 'darwin' 
        ? '/Applications/Claude.app/Contents/MacOS/Claude'
        : (process.platform === 'win32' 
            ? path.join(process.env.LOCALAPPDATA, 'Claude', 'Claude.exe')
            : '/usr/bin/claude');
      
      fs.access(claudePath).then(() => {
        const killCmd = process.platform === 'darwin' 
          ? "pkill -f 'Claude'" 
          : (process.platform === 'win32' 
              ? 'taskkill /F /IM Claude.exe' 
              : "pkill -f 'Claude'");
        
        exec(killCmd, (error) => {
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

  // Execute custom restart command handler (new method)
  ipcMain.handle('execute-restart-command', async (_, { clientId, command }) => {
    return new Promise((resolve, reject) => {
      console.log(`Executing restart command for ${clientId}:`, command);
      
      exec(command, { shell: true }, (error, stdout, stderr) => {
        if (error) {
          console.error(`Restart command failed for ${clientId}:`, error);
          console.error('stderr:', stderr);
          reject(error);
        } else {
          console.log(`Restart command succeeded for ${clientId}`);
          if (stdout) console.log('stdout:', stdout);
          resolve(true);
        }
      });
    });
  });
}

module.exports = {
  checkDocker,
  checkNodejs,
  getDockerInstallUrl,
  getNodejsInstallUrl,
  setupSystemHandlers
};
