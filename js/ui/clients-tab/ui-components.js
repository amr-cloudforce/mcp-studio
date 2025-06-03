/**
 * Clients Tab UI Components
 * Handles rendering of client synchronization interface
 */
import ClientSync from '../../config/client-sync.js';
import ClientDetector from '../../config/client-detector.js';
import BackupManager from '../../config/backup-manager.js';

/**
 * Render the clients tab interface
 * @param {HTMLElement} container - Container element for the tab
 */
export function renderClientsTab(container) {
  const clientConfigs = ClientSync.getAllClientConfigs();
  const detectedClients = ClientDetector.detectClients();
  const globalAutoSync = ClientSync.isAutoSyncEnabled();

  container.innerHTML = `
    <div class="clients-tab">
      <h3>Client Synchronization</h3>
      
      <div class="global-settings">
        <label class="checkbox-label">
          <input type="checkbox" id="global-auto-sync" ${globalAutoSync ? 'checked' : ''}>
          Auto-sync to all enabled clients
        </label>
      </div>

      <div class="clients-list">
        ${Object.keys(detectedClients).map(clientId => 
          renderClientCard(clientId, clientConfigs[clientId], detectedClients[clientId])
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
export function renderClientCard(clientId, clientConfig, detectedClient) {
  const isEnabled = clientConfig?.enabled || false;
  const isAutoSync = clientConfig?.autoSync || false;
  const detectedPath = clientConfig?.detectedPath || detectedClient?.detectedPath;
  const customPath = clientConfig?.customPath || '';
  const restartCommand = clientConfig?.restartCommand || getDefaultRestartCommand(clientId);
  const lastSync = clientConfig?.lastSync;
  const backupCount = BackupManager.getBackupCount(clientId);

  const statusIcon = detectedPath ? '🟢' : '🔴';
  const statusText = detectedPath ? `Detected: ${detectedPath}` : 'Not found at default locations';
  const lastSyncText = lastSync ? `Last sync: ${formatLastSync(lastSync)}` : 'Never synced';

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

      <div class="client-restart">
        <label for="restart-command-${clientId}">Restart command:</label>
        <div class="restart-input-group">
          <input type="text" id="restart-command-${clientId}" class="restart-command" 
                 value="${restartCommand}" placeholder="Enter restart command for this client">
          <button class="btn btn-small restart-client" data-client-id="${clientId}">
            <i class="fas fa-power-off"></i> Restart
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
 * Get default restart command for a client
 * @param {string} clientId - Client identifier
 * @returns {string} Default restart command
 */
function getDefaultRestartCommand(clientId) {
  const defaultCommands = {
    'claude': 'pkill -f \'Claude\' && sleep 2 && /Applications/Claude.app/Contents/MacOS/Claude',
    'cursor': 'osascript -e "tell application \"Cursor\" to quit" && sleep 2 && open -a "Cursor"',
    'zed': 'osascript -e "tell application \"Zed\" to quit" && sleep 2 && open -a "Zed"',
    'continue': 'osascript -e "tell application \"Continue\" to quit" && sleep 2 && open -a "Continue"',
    'windsurf': 'osascript -e "tell application \"Windsurf\" to quit" && sleep 2 && open -a "Windsurf"'
  };
  
  return defaultCommands[clientId] || `# Enter restart command for ${clientId}`;
}

/**
 * Format last sync timestamp
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time
 */
function formatLastSync(timestamp) {
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
