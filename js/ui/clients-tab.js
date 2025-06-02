/**
 * Clients Tab UI
 * Handles the user interface for client synchronization management
 */

console.log('[DEBUG] clients-tab.js loading...');
import clientSync from '../config/client-sync.js';
console.log('[DEBUG] clientSync loaded:', !!clientSync);
import BackupManager from '../config/backup-manager.js';
console.log('[DEBUG] BackupManager loaded:', !!BackupManager);
import ClientDetector from '../config/client-detector.js';
console.log('[DEBUG] ClientDetector loaded:', !!ClientDetector);

class ClientsTab {
  constructor() {
    this.container = null;
    this.initialized = false;
  }
  
  /**
   * Initialize the clients tab
   * @param {HTMLElement} container - Container element for the tab
   */
  init(container) {
    console.log('[DEBUG] ClientsTab.init called with container:', container);
    this.container = container;
    console.log('[DEBUG] About to call render()');
    this.render();
    console.log('[DEBUG] About to call attachEventListeners()');
    this.attachEventListeners();
    this.initialized = true;
    console.log('[DEBUG] ClientsTab initialization complete');
  }
  
  /**
   * Render the clients tab interface
   */
  render() {
    if (!this.container) return;
    
    const clientConfigs = clientSync.getAllClientConfigs();
    const detectedClients = ClientDetector.detectClients();
    
    this.container.innerHTML = `
      <div class="clients-tab">
        <div class="clients-header">
          <h2>Client Synchronization</h2>
          <div class="global-controls">
            <label class="checkbox-label">
              <input type="checkbox" id="global-auto-sync" ${this.hasAnyAutoSync() ? 'checked' : ''}>
              Auto-sync to all enabled clients
            </label>
          </div>
        </div>
        
        <div class="clients-list">
          ${Object.keys(detectedClients).map(clientId => this.renderClientCard(clientId, clientConfigs[clientId], detectedClients[clientId])).join('')}
        </div>
        
        <div class="clients-footer">
          <button id="refresh-detection" class="btn btn-secondary">Refresh Detection</button>
          <button id="sync-all-now" class="btn btn-primary">Sync All Now</button>
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
    const config = clientConfig || {};
    const isDetected = !!detectedClient.detectedPath;
    const currentPath = config.customPath || config.detectedPath;
    const backupCount = BackupManager.getBackupCount(clientId);
    const lastSync = config.lastSync ? new Date(config.lastSync).toLocaleString() : 'Never';
    
    return `
      <div class="client-card" data-client-id="${clientId}">
        <div class="client-header">
          <h3>${detectedClient.name}</h3>
          <div class="client-controls">
            <label class="checkbox-label">
              <input type="checkbox" class="client-enabled" ${config.enabled ? 'checked' : ''}>
              Enabled
            </label>
            <label class="checkbox-label">
              <input type="checkbox" class="client-auto-sync" ${config.autoSync ? 'checked' : ''} ${!config.enabled ? 'disabled' : ''}>
              Auto-sync
            </label>
          </div>
        </div>
        
        <div class="client-status">
          <div class="status-indicator ${isDetected ? 'detected' : 'not-detected'}">
            ${isDetected ? '🟢' : '🔴'} ${isDetected ? 'Detected' : 'Not found at default locations'}
          </div>
          ${isDetected ? `<div class="detected-path">${detectedClient.detectedPath}</div>` : ''}
        </div>
        
        ${!isDetected || config.customPath ? `
          <div class="custom-path-section">
            <label for="custom-path-${clientId}">Custom path:</label>
            <div class="path-input-group">
              <input type="text" id="custom-path-${clientId}" class="custom-path-input" 
                     value="${config.customPath || ''}" placeholder="Enter custom path...">
              <button class="btn btn-small browse-path" data-client-id="${clientId}">Browse...</button>
              <button class="btn btn-small test-path" data-client-id="${clientId}">Test Path</button>
            </div>
          </div>
        ` : ''}
        
        <div class="client-info">
          <div class="info-row">
            <span>Last sync:</span>
            <span class="last-sync">${lastSync}</span>
          </div>
          <div class="info-row">
            <span>Backups:</span>
            <span class="backup-count">${backupCount} available</span>
          </div>
          <div class="info-row">
            <span>Current path:</span>
            <span class="current-path">${currentPath || 'Not configured'}</span>
          </div>
        </div>
        
        <div class="client-actions">
          <button class="btn btn-primary sync-now" data-client-id="${clientId}" ${!config.enabled || !currentPath ? 'disabled' : ''}>
            Sync Now
          </button>
          <button class="btn btn-secondary view-backups" data-client-id="${clientId}">
            View Backups
          </button>
          ${backupCount > 0 ? `
            <button class="btn btn-secondary restore-backup" data-client-id="${clientId}">
              Restore Latest
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }
  
  /**
   * Check if any client has auto-sync enabled
   * @returns {boolean} True if any client has auto-sync enabled
   */
  hasAnyAutoSync() {
    return clientSync.isAutoSyncEnabled();
  }
  
  /**
   * Attach event listeners
   */
  attachEventListeners() {
    if (!this.container) return;
    
    // Global auto-sync toggle
    const globalAutoSync = this.container.querySelector('#global-auto-sync');
    if (globalAutoSync) {
      globalAutoSync.addEventListener('change', (e) => {
        this.handleGlobalAutoSyncChange(e.target.checked);
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
    this.container.querySelectorAll('.custom-path-input').forEach(input => {
      input.addEventListener('blur', (e) => {
        const clientId = e.target.id.replace('custom-path-', '');
        this.handleCustomPathChange(clientId, e.target.value);
      });
    });
    
    // Browse path buttons
    this.container.querySelectorAll('.browse-path').forEach(button => {
      button.addEventListener('click', (e) => {
        const clientId = e.target.dataset.clientId;
        this.handleBrowsePath(clientId);
      });
    });
    
    // Test path buttons
    this.container.querySelectorAll('.test-path').forEach(button => {
      button.addEventListener('click', (e) => {
        const clientId = e.target.dataset.clientId;
        this.handleTestPath(clientId);
      });
    });
    
    // Sync now buttons
    this.container.querySelectorAll('.sync-now').forEach(button => {
      button.addEventListener('click', (e) => {
        const clientId = e.target.dataset.clientId;
        this.handleSyncNow(clientId);
      });
    });
    
    // View backups buttons
    this.container.querySelectorAll('.view-backups').forEach(button => {
      button.addEventListener('click', (e) => {
        const clientId = e.target.dataset.clientId;
        this.handleViewBackups(clientId);
      });
    });
    
    // Restore backup buttons
    this.container.querySelectorAll('.restore-backup').forEach(button => {
      button.addEventListener('click', (e) => {
        const clientId = e.target.dataset.clientId;
        this.handleRestoreLatestBackup(clientId);
      });
    });
    
    // Refresh detection button
    const refreshBtn = this.container.querySelector('#refresh-detection');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => {
        this.handleRefreshDetection();
      });
    }
    
    // Sync all now button
    const syncAllBtn = this.container.querySelector('#sync-all-now');
    if (syncAllBtn) {
      syncAllBtn.addEventListener('click', () => {
        this.handleSyncAll();
      });
    }
  }
  
  /**
   * Handle global auto-sync toggle
   * @param {boolean} enabled - Whether global auto-sync is enabled
   */
  handleGlobalAutoSyncChange(enabled) {
    const clientConfigs = clientSync.getAllClientConfigs();
    
    for (const clientId of Object.keys(clientConfigs)) {
      if (clientConfigs[clientId].enabled) {
        clientSync.setClientAutoSync(clientId, enabled);
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
    clientSync.setClientEnabled(clientId, enabled);
    
    // If disabling, also disable auto-sync
    if (!enabled) {
      clientSync.setClientAutoSync(clientId, false);
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
    clientSync.setClientAutoSync(clientId, autoSync);
  }
  
  /**
   * Handle custom path change
   * @param {string} clientId - Client identifier
   * @param {string} customPath - Custom path value
   */
  handleCustomPathChange(clientId, customPath) {
    const trimmedPath = customPath.trim();
    clientSync.setClientCustomPath(clientId, trimmedPath || null);
    
    this.render();
    this.attachEventListeners();
  }
  
  /**
   * Handle browse path button click
   * @param {string} clientId - Client identifier
   */
  async handleBrowsePath(clientId) {
    try {
      const result = await require('electron').ipcRenderer.invoke('show-open-dialog', {
        properties: ['openFile'],
        filters: [
          { name: 'Configuration Files', extensions: ['json', 'yaml', 'yml'] },
          { name: 'All Files', extensions: ['*'] }
        ]
      });
      
      if (!result.canceled && result.filePaths.length > 0) {
        const selectedPath = result.filePaths[0];
        clientSync.setClientCustomPath(clientId, selectedPath);
        
        this.render();
        this.attachEventListeners();
      }
    } catch (error) {
      console.error('Failed to browse for file:', error);
      this.showNotification('Failed to open file browser', 'error');
    }
  }
  
  /**
   * Handle test path button click
   * @param {string} clientId - Client identifier
   */
  handleTestPath(clientId) {
    const config = clientSync.getClientConfig(clientId);
    const testPath = config.customPath || config.detectedPath;
    
    if (!testPath) {
      this.showNotification('No path configured to test', 'error');
      return;
    }
    
    const result = clientSync.testClientPath(clientId, testPath);
    
    if (result.success) {
      this.showNotification(`Path test successful: ${result.message}`, 'success');
    } else {
      this.showNotification(`Path test failed: ${result.message}`, 'error');
    }
  }
  
  /**
   * Handle sync now button click
   * @param {string} clientId - Client identifier
   */
  async handleSyncNow(clientId) {
    try {
      // Get current MCP servers from config manager
      const configManager = (await import('../config/config-manager.js')).default;
      const config = configManager.getConfig();
      const servers = config.mcpServers || {};
      
      const success = clientSync.syncToClient(clientId, servers);
      
      if (success) {
        this.showNotification(`Successfully synced to ${clientId}`, 'success');
        this.render();
        this.attachEventListeners();
      } else {
        this.showNotification(`Failed to sync to ${clientId}`, 'error');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      this.showNotification(`Sync failed: ${error.message}`, 'error');
    }
  }
  
  /**
   * Handle view backups button click
   * @param {string} clientId - Client identifier
   */
  handleViewBackups(clientId) {
    this.showBackupModal(clientId);
  }
  
  /**
   * Handle restore latest backup button click
   * @param {string} clientId - Client identifier
   */
  handleRestoreLatestBackup(clientId) {
    const backups = BackupManager.listBackups(clientId);
    
    if (backups.length === 0) {
      this.showNotification('No backups available to restore', 'error');
      return;
    }
    
    const latestBackup = backups[0];
    const config = clientSync.getClientConfig(clientId);
    const targetPath = config.customPath || config.detectedPath;
    
    if (!targetPath) {
      this.showNotification('No target path configured for restore', 'error');
      return;
    }
    
    if (confirm(`Restore backup from ${latestBackup.formattedDate}?`)) {
      try {
        BackupManager.restoreBackup(clientId, latestBackup.name, targetPath);
        this.showNotification('Backup restored successfully', 'success');
      } catch (error) {
        console.error('Restore failed:', error);
        this.showNotification(`Restore failed: ${error.message}`, 'error');
      }
    }
  }
  
  /**
   * Handle refresh detection button click
   */
  handleRefreshDetection() {
    clientSync.refreshDetection();
    this.render();
    this.attachEventListeners();
    this.showNotification('Client detection refreshed', 'success');
  }
  
  /**
   * Handle sync all button click
   */
  async handleSyncAll() {
    try {
      // Get current MCP servers from config manager
      const configManager = (await import('../config/config-manager.js')).default;
      const config = configManager.getConfig();
      const servers = config.mcpServers || {};
      
      const results = clientSync.syncAll(servers);
      const successCount = Object.values(results).filter(Boolean).length;
      const totalCount = Object.keys(results).length;
      
      if (successCount === totalCount) {
        this.showNotification(`Successfully synced to all ${successCount} enabled clients`, 'success');
      } else {
        this.showNotification(`Synced to ${successCount} of ${totalCount} clients`, 'warning');
      }
      
      this.render();
      this.attachEventListeners();
    } catch (error) {
      console.error('Sync all failed:', error);
      this.showNotification(`Sync all failed: ${error.message}`, 'error');
    }
  }
  
  /**
   * Show backup management modal
   * @param {string} clientId - Client identifier
   */
  showBackupModal(clientId) {
    // This would integrate with the existing modal system
    // For now, we'll use a simple alert
    const backups = BackupManager.listBackups(clientId);
    
    if (backups.length === 0) {
      alert('No backups available for this client');
      return;
    }
    
    const backupList = backups.map(backup => 
      `${backup.formattedDate} (${backup.formattedSize})`
    ).join('\n');
    
    alert(`Available backups for ${clientId}:\n\n${backupList}`);
  }
  
  /**
   * Show notification message
   * @param {string} message - Notification message
   * @param {string} type - Notification type (success, error, warning)
   */
  showNotification(message, type = 'info') {
    // This would integrate with the existing notification system
    console.log(`[${type.toUpperCase()}] ${message}`);
    
    // For now, use a simple alert for errors
    if (type === 'error') {
      alert(message);
    }
  }
  
  /**
   * Refresh the tab content
   */
  refresh() {
    if (this.initialized) {
      this.render();
      this.attachEventListeners();
    }
  }
}

// Export singleton instance
const clientsTab = new ClientsTab();
export default clientsTab;
