/**
 * @file bulk-actions.js
 * @description Bulk action handlers for server list enhancements
 */

import configManager from '../../config/config-manager.js';
import notifications from '../../ui/notifications.js';

export class BulkActions {
  constructor(core, ui) {
    this.core = core;
    this.ui = ui;
  }

  /**
   * Bulk activate selected servers
   */
  async bulkActivate() {
    const selectedServers = this.core.getSelectedServers();
    if (selectedServers.length === 0) return;

    if (!confirm(`Activate ${selectedServers.length} servers?`)) return;

    selectedServers.forEach(serverName => {
      configManager.moveServer(serverName, 'active');
    });

    await configManager.saveConfig();
    notifications.showRestartWarning();
    this.ui.refreshEnhancedList();
  }

  /**
   * Bulk deactivate selected servers
   */
  async bulkDeactivate() {
    const selectedServers = this.core.getSelectedServers();
    if (selectedServers.length === 0) return;

    if (!confirm(`Deactivate ${selectedServers.length} servers?`)) return;

    selectedServers.forEach(serverName => {
      configManager.moveServer(serverName, 'inactive');
    });

    await configManager.saveConfig();
    notifications.showRestartWarning();
    this.ui.refreshEnhancedList();
  }

  /**
   * Bulk delete selected servers
   */
  async bulkDelete() {
    const selectedServers = this.core.getSelectedServers();
    if (selectedServers.length === 0) return;

    if (!confirm(`Delete ${selectedServers.length} servers? This action cannot be undone.`)) return;

    selectedServers.forEach(serverName => {
      const row = document.querySelector(`[data-server-name="${serverName}"]`);
      const section = row.dataset.serverStatus;
      configManager.deleteServer(serverName, section);
    });

    await configManager.saveConfig();
    notifications.showRestartWarning();
    this.ui.refreshEnhancedList();
  }

  /**
   * Deactivate all active servers
   */
  async deactivateAllActive() {
    const config = configManager.getConfig();
    const activeServers = Object.keys(config.mcpServers || {});
    
    if (activeServers.length === 0) {
      alert('No active servers to deactivate.');
      return;
    }

    if (!confirm(`Deactivate all ${activeServers.length} active servers?`)) return;

    activeServers.forEach(serverName => {
      configManager.moveServer(serverName, 'inactive');
    });

    await configManager.saveConfig();
    notifications.showRestartWarning();
    this.ui.refreshEnhancedList();
  }
}
