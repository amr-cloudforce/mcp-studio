const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  readConfig: () => ipcRenderer.invoke('read-config'),
  writeConfig: cfg => ipcRenderer.invoke('write-config', cfg),
  revealConfig: () => ipcRenderer.invoke('reveal-config')
});
