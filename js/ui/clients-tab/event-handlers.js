/**
 * Clients Tab Event Handlers
 * Handles all event listeners and user interactions
 */
import ClientSync from '../../config/client-sync.js';
import ClientDetector from '../../config/client-detector.js';
import BackupManager from '../../config/backup-manager.js';
import configManager from '../../config/config-manager.js';

/**
 * Attach event listeners to the clients tab
 * @param {HTMLElement} container - Container element
 * @param {Object} clientsTab - Reference to the clients tab instance
 */
export function attachEventListeners(container, clientsTab) {
  // Global auto-sync toggle
  const globalAutoSyncCheckbox = container.querySelector('#global-auto-sync');
  if (globalAutoSyncCheckbox) {
    globalAutoSyncCheckbox.addEventListener('change', (e) => {
      handleGlobalAutoSyncToggle(e.target.checked, clientsTab);
    });
  }

  // Client enabled checkboxes
  container.querySelectorAll('.client-enabled').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const clientId = e.target.closest('.client-card').dataset.clientId;
      handleClientEnabledChange(clientId, e.target.checked, clientsTab);
    });
  });

  // Client auto-sync checkboxes
  container.querySelectorAll('.client-auto-sync').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
      const clientId = e.target.closest('.client-card').dataset.clientId;
      handleClientAutoSyncChange(clientId, e.target.checked, clientsTab);
    });
  });

  // Custom path inputs
  container.querySelectorAll('.custom-path').forEach(input => {
    input.addEventListener('change', (e) => {
      const clientId = e.target.id.replace('custom-path-', '');
      handleCustomPathChange(clientId, e.target.value);
    });
  });

  // Browse path buttons
  container.querySelectorAll('.browse-path').forEach(button => {
    button.addEventListener('click', (e) => {
      const clientId = e.target.closest('button').dataset.clientId;
      handleBrowsePathClick(clientId, clientsTab);
    });
  });

  // Test path buttons
  container.querySelectorAll('.test-path').forEach(button => {
    button.addEventListener('click', (e) => {
      const clientId = e.target.closest('button').dataset.clientId;
      handleTestPathClick(clientId, clientsTab);
    });
  });

  // Sync now buttons
  container.querySelectorAll('.sync-now').forEach(button => {
    button.addEventListener('click', (e) => {
      const clientId = e.target.closest('button').dataset.clientId;
      handleSyncNowClick(clientId, clientsTab);
    });
  });

  // View backups buttons
  container.querySelectorAll('.view-backups').forEach(button => {
    button.addEventListener('click', (e) => {
      const clientId = e.target.closest('button').dataset.clientId;
      handleViewBackupsClick(clientId, clientsTab);
    });
  });

  // Restore backup buttons
  container.querySelectorAll('.restore-backup').forEach(button => {
    button.addEventListener('click', (e) => {
      const clientId = e.target.closest('button').dataset.clientId;
      handleRestoreBackupClick(clientId, clientsTab);
    });
  });

  // Restart command inputs
  container.querySelectorAll('.restart-command').forEach(input => {
    input.addEventListener('change', (e) => {
      const clientId = e.target.id.replace('restart-command-', '');
      handleRestartCommandChange(clientId, e.target.value);
    });
  });

  // Restart client buttons
  container.querySelectorAll('.restart-client').forEach(button => {
    button.addEventListener('click', (e) => {
      const clientId = e.target.closest('button').dataset.clientId;
      handleRestartClientClick(clientId, clientsTab);
    });
  });

  // Refresh detection button
  const refreshBtn = container.querySelector('#refresh-detection-btn');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', () => {
      handleRefreshDetectionClick(clientsTab);
    });
  }

  // Sync all now button
  const syncAllBtn = container.querySelector('#sync-all-btn');
  if (syncAllBtn) {
    syncAllBtn.addEventListener('click', () => {
      handleSyncAllClick(clientsTab);
    });
  }
}

/**
 * Handle global auto-sync toggle
 * @param {boolean} enabled - Whether global auto-sync is enabled
 * @param {Object} clientsTab - Reference to the clients tab instance
 */
function handleGlobalAutoSyncToggle(enabled, clientsTab) {
  const clientConfigs = ClientSync.getAllClientConfigs();
  
  for (const clientId of Object.keys(clientConfigs)) {
    if (clientConfigs[clientId].enabled) {
      ClientSync.setClientAutoSync(clientId, enabled);
    }
  }
  
  clientsTab.render();
  clientsTab.attachEventListeners();
}

/**
 * Handle client enabled change
 * @param {string} clientId - Client identifier
 * @param {boolean} enabled - Whether the client is enabled
 * @param {Object} clientsTab - Reference to the clients tab instance
 */
function handleClientEnabledChange(clientId, enabled, clientsTab) {
  ClientSync.setClientEnabled(clientId, enabled);
  
  // If disabling, also disable auto-sync
  if (!enabled) {
    ClientSync.setClientAutoSync(clientId, false);
  }
  
  clientsTab.render();
  clientsTab.attachEventListeners();
}

/**
 * Handle client auto-sync change
 * @param {string} clientId - Client identifier
 * @param {boolean} autoSync - Whether auto-sync is enabled
 * @param {Object} clientsTab - Reference to the clients tab instance
 */
function handleClientAutoSyncChange(clientId, autoSync, clientsTab) {
  ClientSync.setClientAutoSync(clientId, autoSync);
  clientsTab.render();
  clientsTab.attachEventListeners();
}

/**
 * Handle custom path change
 * @param {string} clientId - Client identifier
 * @param {string} customPath - Custom path value
 */
function handleCustomPathChange(clientId, customPath) {
  ClientSync.setClientCustomPath(clientId, customPath.trim() || null);
}

/**
 * Handle browse path button click
 * @param {string} clientId - Client identifier
 * @param {Object} clientsTab - Reference to the clients tab instance
 */
async function handleBrowsePathClick(clientId, clientsTab) {
  try {
    // For now, show a simple prompt for the path
    // TODO: Implement proper file dialog via IPC
    const selectedPath = prompt('Enter the path to the client configuration file:');
    if (selectedPath && selectedPath.trim()) {
      ClientSync.setClientCustomPath(clientId, selectedPath.trim());
      clientsTab.render();
      clientsTab.attachEventListeners();
    }
  } catch (error) {
    clientsTab.showNotification(`Failed to set custom path: ${error.message}`, 'error');
  }
}

/**
 * Handle test path button click
 * @param {string} clientId - Client identifier
 * @param {Object} clientsTab - Reference to the clients tab instance
 */
function handleTestPathClick(clientId, clientsTab) {
  const path = ClientSync.getClientPath(clientId);
  if (!path) {
    clientsTab.showNotification('No path configured for this client', 'warning');
    return;
  }

  const result = ClientSync.testClientPath(clientId, path);
  clientsTab.showNotification(result.message, result.success ? 'success' : 'error');
}

/**
 * Handle sync now button click
 * @param {string} clientId - Client identifier
 * @param {Object} clientsTab - Reference to the clients tab instance
 */
async function handleSyncNowClick(clientId, clientsTab) {
  try {
    // Get current MCP servers from config manager
    const config = configManager.getConfig();
    const activeServers = config.mcpServers || {};
    
    const success = ClientSync.syncToClient(clientId, activeServers);
    
    if (success) {
      clientsTab.showNotification(`Successfully synced to ${ClientDetector.getClientConfig(clientId)?.name}`, 'success');
      clientsTab.render();
      clientsTab.attachEventListeners();
    } else {
      clientsTab.showNotification(`Failed to sync to ${ClientDetector.getClientConfig(clientId)?.name}`, 'error');
    }
  } catch (error) {
    clientsTab.showNotification(`Sync failed: ${error.message}`, 'error');
  }
}

/**
 * Handle view backups button click
 * @param {string} clientId - Client identifier
 * @param {Object} clientsTab - Reference to the clients tab instance
 */
function handleViewBackupsClick(clientId, clientsTab) {
  const backups = BackupManager.listBackups(clientId);
  if (backups.length === 0) {
    clientsTab.showNotification('No backups available for this client', 'warning');
  } else {
    clientsTab.showBackupManagementModal(clientId);
  }
}

/**
 * Handle restore latest backup button click
 * @param {string} clientId - Client identifier
 * @param {Object} clientsTab - Reference to the clients tab instance
 */
function handleRestoreBackupClick(clientId, clientsTab) {
  const backups = BackupManager.listBackups(clientId);
  if (backups.length === 0) {
    clientsTab.showNotification('No backups available for this client', 'warning');
    return;
  }

  const latestBackup = backups[0];
  const clientPath = ClientSync.getClientPath(clientId);
  
  if (!clientPath) {
    clientsTab.showNotification('No path configured for this client', 'error');
    return;
  }

  const success = BackupManager.restoreBackup(clientId, latestBackup.name, clientPath);
  
  if (success) {
    clientsTab.showNotification(`Successfully restored backup: ${latestBackup.name}`, 'success');
  } else {
    clientsTab.showNotification('Failed to restore backup', 'error');
  }
}

/**
 * Handle refresh detection button click
 * @param {Object} clientsTab - Reference to the clients tab instance
 */
function handleRefreshDetectionClick(clientsTab) {
  ClientSync.refreshDetection();
  clientsTab.render();
  clientsTab.attachEventListeners();
  clientsTab.showNotification('Client detection refreshed', 'success');
}

/**
 * Handle restart command change
 * @param {string} clientId - Client identifier
 * @param {string} restartCommand - Restart command value
 */
function handleRestartCommandChange(clientId, restartCommand) {
  ClientSync.setClientRestartCommand(clientId, restartCommand.trim() || null);
}

/**
 * Handle restart client button click
 * @param {string} clientId - Client identifier
 * @param {Object} clientsTab - Reference to the clients tab instance
 */
async function handleRestartClientClick(clientId, clientsTab) {
  try {
    const restartCommand = ClientSync.getClientRestartCommand(clientId);
    const inputFieldValue = document.getElementById(`restart-command-${clientId}`)?.value;
    
    // Debug logging to identify the issue
    console.log('[DEBUG] Restart command validation:');
    console.log('  - Client ID:', clientId);
    console.log('  - Input field value:', inputFieldValue);
    console.log('  - Stored restart command:', restartCommand);
    console.log('  - Command starts with #:', restartCommand?.startsWith('#'));
    
    // Use input field value as fallback if stored command is invalid
    let finalCommand = restartCommand;
    if (!restartCommand || restartCommand.startsWith('#')) {
      if (inputFieldValue && inputFieldValue.trim() && !inputFieldValue.trim().startsWith('#')) {
        finalCommand = inputFieldValue.trim();
        // Save the valid command from input field
        ClientSync.setClientRestartCommand(clientId, finalCommand);
        console.log('[DEBUG] Using input field value as restart command:', finalCommand);
      } else {
        clientsTab.showNotification('Please enter a valid restart command first', 'warning');
        return;
      }
    }
    
    let success;
    
    // Use existing restart-claude method for Claude (but show the actual command to user)
    if (clientId === 'claude' && finalCommand === 'pkill -f \'Claude\' && sleep 2 && /Applications/Claude.app/Contents/MacOS/Claude') {
      success = await require('electron').ipcRenderer.invoke('restart-claude');
    } else {
      // Execute custom restart command via IPC
      success = await require('electron').ipcRenderer.invoke('execute-restart-command', {
        clientId,
        command: finalCommand
      });
    }
    
    if (success) {
      clientsTab.showNotification(`Successfully restarted ${ClientDetector.getClientConfig(clientId)?.name}`, 'success');
    } else {
      clientsTab.showNotification(`Failed to restart ${ClientDetector.getClientConfig(clientId)?.name}`, 'error');
    }
  } catch (error) {
    clientsTab.showNotification(`Restart failed: ${error.message}`, 'error');
  }
}

/**
 * Handle sync all button click
 * @param {Object} clientsTab - Reference to the clients tab instance
 */
async function handleSyncAllClick(clientsTab) {
  try {
    // Get current MCP servers from config manager
    const config = configManager.getConfig();
    const activeServers = config.mcpServers || {};
    
    const results = ClientSync.syncAll(activeServers);
    const successCount = Object.values(results).filter(result => result === true).length;
    const totalEnabled = Object.values(results).filter(result => result !== null).length;
    
    if (successCount === totalEnabled && totalEnabled > 0) {
      clientsTab.showNotification(`Successfully synced to all ${successCount} enabled clients`, 'success');
    } else if (successCount > 0) {
      clientsTab.showNotification(`Synced to ${successCount} of ${totalEnabled} enabled clients`, 'warning');
    } else {
      clientsTab.showNotification('No clients were synced', 'warning');
    }
    
    clientsTab.render();
    clientsTab.attachEventListeners();
  } catch (error) {
    clientsTab.showNotification(`Sync all failed: ${error.message}`, 'error');
  }
}
