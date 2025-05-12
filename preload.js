const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  readConfig: () => ipcRenderer.invoke('read-config'),
  writeConfig: cfg => ipcRenderer.invoke('write-config', cfg),
  revealConfig: () => ipcRenderer.invoke('reveal-config'),
  openUrl: url => ipcRenderer.invoke('open-url', url),
  checkPrerequisites: () => ipcRenderer.invoke('check-prerequisites'),
  restartClaude: () => ipcRenderer.invoke('restart-claude')
});

// Listen for prerequisites status
ipcRenderer.on('prerequisites-status', (_, data) => {
  window.postMessage({ type: 'prerequisites-status', data }, '*');
});
