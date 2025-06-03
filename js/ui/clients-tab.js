/**
 * Clients Tab UI
 * Handles the user interface for client synchronization management
 */
import ClientSync from '../config/client-sync.js';
import ClientDetector from '../config/client-detector.js';
import BackupManager from '../config/backup-manager.js';
import configManager from '../config/config-manager.js';

class ClientsTab {
  constructor() {
    this.container = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the clients tab
   * @param {HTMLElement} container - Container element for the tab
   */
  initialize(container) {
    this.container = container;
    this.isInitialized = true;
    this.render();
    this.attachEventListeners();
  }

  /**
   * Render the clients tab interface
   */
  render() {

    const clientConfigs = ClientSync.getAllClientConfigs();
    const detectedClients = ClientDetector.detectClients();
    const globalAutoSync = ClientSync.isAutoSyncEnabled();


    this.container.innerHTML = `
      <div  class="clients-tab">
        <h3>Client Synchronization</h3>
        
        <div class="global-settings">
          <label class="checkbox-label">
            <input type="checkbox" id="global-auto-sync" ${globalAutoSync ? 'checked' : ''}>
            Auto-sync to all enabled clients
          </label>
        </div>

        <div class="clients-list">
          ${Object.keys(detectedClients).map(clientId => 
            this.renderClientCard(clientId, clientConfigs[clientId], detectedClients[clientId])
          ).join('')}
        </div>

        <div class="clients-actions">
          <button id="refresh-detection-btn" class="btn btn-secondary">
            <i class="fas fa-refresh"></i> Refresh Detection
          </button>
          <button id="sync-all-btn" class="btn btn-primary">
            <i class="fas fa-sync"></i> Sync All Now
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Render a client card
   * @param {string} clientId - Client identifier
   * @param {Object} clientConfig - Client configuration
   * @param {Object} detectedClient - Detected client information
   * @returns {string} HTML for the client card
   */
  renderClientCard(clientId, clientConfig, detectedClient) {
    const isEnabled = clientConfig?.enabled || false;
    const isAutoSync = clientConfig?.autoSync || false;
    const detectedPath = clientConfig?.detectedPath || detectedClient?.detectedPath;
    const customPath = clientConfig?.customPath || '';
    const lastSync = clientConfig?.lastSync;
    const backupCount = BackupManager.getBackupCount(clientId);

    const statusIcon = detectedPath ? '🟢' : '🔴';
    const statusText = detectedPath ? `Detected: ${detectedPath}` : 'Not found at default locations';
    const lastSyncText = lastSync ? `Last sync: ${this.formatLastSync(lastSync)}` : 'Never synced';

    return `
      <div class="client-card" data-client-id="${clientId}">
        <div class="client-header">
          <h4>${detectedClient.name}</h4>
          <div class="client-toggles">
            <label class="checkbox-label">
              <input type="checkbox" class="client-enabled" ${isEnabled ? 'checked' : ''}>
              Enabled
            </label>
            <label class="checkbox-label">
              <input type="checkbox" class="client-auto-sync" ${isAutoSync ? 'checked' : ''} ${!isEnabled ? 'disabled' : ''}>
              Auto-sync
            </label>
          </div>
        </div>

        <div class="client-status">
          <div class="status-line">
            ${statusIcon} ${statusText}
          </div>
          <div class="sync-info">
            ${lastSyncText} | Backups: ${backupCount} available
          </div>
        </div>

        <div class="client-path">
          <label for="custom-path-${clientId}">Custom path:</label>
          <div class="path-input-group">
            <input type="text" id="custom-path-${clientId}" class="custom-path" 
                   value="${customPath}" placeholder="Leave empty to use detected path">
            <button class="btn btn-small browse-path" data-client-id="${clientId}">
              <i class="fas fa-folder-open"></i> Browse
            </button>
          </div>
        </div>

        <div class="client-actions">
          <button class="btn btn-small test-path" data-client-id="${clientId}">
            <i class="fas fa-check"></i> Test Path
          </button>
          <button class="btn btn-small sync-now" data-client-id="${clientId}" ${!isEnabled ? 'disabled' : ''}>
            <i class="fas fa-sync"></i> Sync Now
          </button>
          <button class="btn btn-small view-backups" data-client-id="${clientId}">
            <i class="fas fa-history"></i> View Backups
          </button>
          <button class="btn btn-small restore-backup" data-client-id="${clientId}" ${backupCount === 0 ? 'disabled' : ''}>
            <i class="fas fa-undo"></i> Restore Latest
          </button>
        </div>
      </div>
    `;
  }

  /**
   * Check if any client has auto-sync enabled
   * @returns {boolean} True if any client has auto-sync enabled
   */
  hasAutoSyncEnabled() {
    return ClientSync.isAutoSyncEnabled();
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    if (!this.container) return;

    // Global auto-sync toggle
    const globalAutoSyncCheckbox = this.container.querySelector('#global-auto-sync');
    if (globalAutoSyncCheckbox) {
      globalAutoSyncCheckbox.addEventListener('change', (e) => {
        this.handleGlobalAutoSyncToggle(e.target.checked);
      });
    }

    // Client enabled checkboxes
    this.container.querySelectorAll('.client-enabled').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const clientId = e.target.closest('.client-card').dataset.clientId;
        this.handleClientEnabledChange(clientId, e.target.checked);
      });
    });

    // Client auto-sync checkboxes
    this.container.querySelectorAll('.client-auto-sync').forEach(checkbox => {
      checkbox.addEventListener('change', (e) => {
        const clientId = e.target.closest('.client-card').dataset.clientId;
        this.handleClientAutoSyncChange(clientId, e.target.checked);
      });
    });

    // Custom path inputs
    this.container.querySelectorAll('.custom-path').forEach(input => {
      input.addEventListener('change', (e) => {
        const clientId = e.target.id.replace('custom-path-', '');
        this.handleCustomPathChange(clientId, e.target.value);
      });
    });

    // Browse path buttons
    this.container.querySelectorAll('.browse-path').forEach(button => {
      button.addEventListener('click', (e) => {
        const clientId = e.target.closest('button').dataset.clientId;
        this.handleBrowsePathClick(clientId);
      });
    });

    // Test path buttons
    this.container.querySelectorAll('.test-path').forEach(button => {
      button.addEventListener('click', (e) => {
        const clientId = e.target.closest('button').dataset.clientId;
        this.handleTestPathClick(clientId);
      });
    });

    // Sync now buttons
    this.container.querySelectorAll('.sync-now').forEach(button => {
      button.addEventListener('click', (e) => {
        const clientId = e.target.closest('button').dataset.clientId;
        this.handleSyncNowClick(clientId);
      });
    });

    // View backups buttons
    this.container.querySelectorAll('.view-backups').forEach(button => {
      button.addEventListener('click', (e) => {
        const clientId = e.target.closest('button').dataset.clientId;
        this.handleViewBackupsClick(clientId);
      });
    });

    // Restore backup buttons
    this.container.querySelectorAll('.restore-backup').forEach(button => {
      button.addEventListener('click', (e) => {
        const clientId = e.target.closest('button').dataset.clientId;
        this.handleRestoreBackupClick(clientId);
      });
    });

    // Refresh detection button
    const refreshBtn = this.container.querySelector('#refresh-detection-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.handleRefreshDetectionClick();
      });
    }

    // Sync all now button
    const syncAllBtn = this.container.querySelector('#sync-all-btn');
    if (syncAllBtn) {
      syncAllBtn.addEventListener('click', () => {
        this.handleSyncAllClick();
      });
    }
  }

  /**
   * Handle global auto-sync toggle
   * @param {boolean} enabled - Whether global auto-sync is enabled
   */
  handleGlobalAutoSyncToggle(enabled) {
    const clientConfigs = ClientSync.getAllClientConfigs();
    
    for (const clientId of Object.keys(clientConfigs)) {
      if (clientConfigs[clientId].enabled) {
        ClientSync.setClientAutoSync(clientId, enabled);
      }
    }
    
    this.render();
    this.attachEventListeners();
  }

  /**
   * Handle client enabled change
   * @param {string} clientId - Client identifier
   * @param {boolean} enabled - Whether the client is enabled
   */
  handleClientEnabledChange(clientId, enabled) {
    ClientSync.setClientEnabled(clientId, enabled);
    
    // If disabling, also disable auto-sync
    if (!enabled) {
      ClientSync.setClientAutoSync(clientId, false);
    }
    
    this.render();
    this.attachEventListeners();
  }

  /**
   * Handle client auto-sync change
   * @param {string} clientId - Client identifier
   * @param {boolean} autoSync - Whether auto-sync is enabled
   */
  handleClientAutoSyncChange(clientId, autoSync) {
    ClientSync.setClientAutoSync(clientId, autoSync);
    this.render();
    this.attachEventListeners();
  }

  /**
   * Handle custom path change
   * @param {string} clientId - Client identifier
   * @param {string} customPath - Custom path value
   */
  handleCustomPathChange(clientId, customPath) {
    ClientSync.setClientCustomPath(clientId, customPath.trim() || null);
  }

  /**
   * Handle browse path button click
   * @param {string} clientId - Client identifier
   */
  async handleBrowsePathClick(clientId) {
    try {
      // For now, show a simple prompt for the path
      // TODO: Implement proper file dialog via IPC
      const selectedPath = prompt('Enter the path to the client configuration file:');
      if (selectedPath && selectedPath.trim()) {
        ClientSync.setClientCustomPath(clientId, selectedPath.trim());
        this.render();
        this.attachEventListeners();
      }
    } catch (error) {
      this.showNotification(`Failed to set custom path: ${error.message}`, 'error');
    }
  }

  /**
   * Handle test path button click
   * @param {string} clientId - Client identifier
   */
  handleTestPathClick(clientId) {
    const path = ClientSync.getClientPath(clientId);
    if (!path) {
      this.showNotification('No path configured for this client', 'warning');
      return;
    }

    const result = ClientSync.testClientPath(clientId, path);
    this.showNotification(result.message, result.success ? 'success' : 'error');
  }

  /**
   * Handle sync now button click
   * @param {string} clientId - Client identifier
   */
  async handleSyncNowClick(clientId) {
    try {
      // Get current MCP servers from config manager
      const config = configManager.getConfig();
      const activeServers = config.mcpServers || {};
      
      const success = ClientSync.syncToClient(clientId, activeServers);
      
      if (success) {
        this.showNotification(`Successfully synced to ${ClientDetector.getClientConfig(clientId)?.name}`, 'success');
        this.render();
        this.attachEventListeners();
      } else {
        this.showNotification(`Failed to sync to ${ClientDetector.getClientConfig(clientId)?.name}`, 'error');
      }
    } catch (error) {
      this.showNotification(`Sync failed: ${error.message}`, 'error');
    }
  }

  /**
   * Handle view backups button click
   * @param {string} clientId - Client identifier
   */
  handleViewBackupsClick(clientId) {
    // This would integrate with the existing modal system
    // For now, we'll use a simple alert
    const backups = BackupManager.listBackups(clientId);
    if (backups.length === 0) {
      this.showNotification('No backups available for this client', 'warning');
    } else {
      this.showBackupManagementModal(clientId);
    }
  }

  /**
   * Handle restore latest backup button click
   * @param {string} clientId - Client identifier
   */
  handleRestoreBackupClick(clientId) {
    const backups = BackupManager.listBackups(clientId);
    if (backups.length === 0) {
      this.showNotification('No backups available for this client', 'warning');
      return;
    }

    const latestBackup = backups[0];
    const clientPath = ClientSync.getClientPath(clientId);
    
    if (!clientPath) {
      this.showNotification('No path configured for this client', 'error');
      return;
    }

    const success = BackupManager.restoreBackup(clientId, latestBackup.name, clientPath);
    
    if (success) {
      this.showNotification(`Successfully restored backup: ${latestBackup.name}`, 'success');
    } else {
      this.showNotification('Failed to restore backup', 'error');
    }
  }

  /**
   * Handle refresh detection button click
   */
  handleRefreshDetectionClick() {
    ClientSync.refreshDetection();
    this.render();
    this.attachEventListeners();
    this.showNotification('Client detection refreshed', 'success');
  }

  /**
   * Handle sync all button click
   */
  async handleSyncAllClick() {
    try {
      // Get current MCP servers from config manager
      const config = configManager.getConfig();
      const activeServers = config.mcpServers || {};
      
      const results = ClientSync.syncAll(activeServers);
      const successCount = Object.values(results).filter(result => result === true).length;
      const totalEnabled = Object.values(results).filter(result => result !== null).length;
      
      if (successCount === totalEnabled && totalEnabled > 0) {
        this.showNotification(`Successfully synced to all ${successCount} enabled clients`, 'success');
      } else if (successCount > 0) {
        this.showNotification(`Synced to ${successCount} of ${totalEnabled} enabled clients`, 'warning');
      } else {
        this.showNotification('No clients were synced', 'warning');
      }
      
      this.render();
      this.attachEventListeners();
    } catch (error) {
      this.showNotification(`Sync all failed: ${error.message}`, 'error');
    }
  }

  /**
   * Show backup management modal
   * @param {string} clientId - Client identifier
   */
  showBackupManagementModal(clientId) {
    // This would integrate with the existing modal system
    // For now, we'll use a simple alert
    const backups = BackupManager.listBackups(clientId);
    const backupList = backups.map(backup => 
      `${backup.name} (${backup.formattedSize}, ${backup.created.toLocaleString()})`
    ).join('\n');
    
    alert(`Backups for ${ClientDetector.getClientConfig(clientId)?.name}:\n\n${backupList}`);
  }

  /**
   * Show notification message
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning)
   */
  showNotification(message, type = 'info') {
    // This would integrate with the existing notification system
    // For now, use a simple alert for errors
    if (type === 'error') {
      alert(`Error: ${message}`);
    } else {
      console.log(`[${type.toUpperCase()}] ${message}`);
    }
  }

  /**
   * Format last sync timestamp
   * @param {string} timestamp - ISO timestamp
   * @returns {string} Formatted time
   */
  formatLastSync(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins === 1 ? '' : 's'} ago`;
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours} hour${diffHours === 1 ? '' : 's'} ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  }

  /**
   * Refresh the tab content
   */
  refresh() {
    if (this.isInitialized) {
      this.render();
      this.attachEventListeners();
    }
  }
}

// Export singleton instance
const clientsTab = new ClientsTab();
export default clientsTab;
