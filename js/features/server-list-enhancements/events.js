/**
 * @file events.js
 * @description Event handling for server list enhancements
 */

import configManager from '../../config/config-manager.js';
import notifications from '../../ui/notifications.js';

export class ServerListEvents {
  constructor(core, storage, ui) {
    this.core = core;
    this.storage = storage;
    this.ui = ui;
    this.eventListeners = {};
  }

  /**
   * Wire up event handlers for enhanced functionality
   */
  wireEventHandlers() {
    // Search
    document.getElementById('server-search').addEventListener('input', (e) => {
      this.core.searchTerm = e.target.value.toLowerCase();
      this.core.currentPage = 1;
      this.ui.refreshEnhancedList();
    });

    // Filters
    document.getElementById('status-filter').addEventListener('change', (e) => {
      this.core.activeFilters.status = e.target.value;
      this.core.currentPage = 1;
      this.ui.refreshEnhancedList();
    });

    document.getElementById('category-filter').addEventListener('change', (e) => {
      this.core.activeFilters.category = e.target.value;
      this.core.currentPage = 1;
      this.ui.refreshEnhancedList();
    });

    document.getElementById('favorites-filter').addEventListener('click', () => {
      this.core.activeFilters.favorites = !this.core.activeFilters.favorites;
      document.getElementById('favorites-filter').classList.toggle('active', this.core.activeFilters.favorites);
      this.core.currentPage = 1;
      this.ui.refreshEnhancedList();
    });

    // Sorting
    document.getElementById('sort-select').addEventListener('change', (e) => {
      this.core.sortBy = e.target.value;
      this.ui.refreshEnhancedList();
    });

    document.getElementById('sort-order').addEventListener('click', () => {
      this.core.sortOrder = this.core.sortOrder === 'asc' ? 'desc' : 'asc';
      const icon = document.querySelector('#sort-order i');
      icon.className = this.core.sortOrder === 'asc' ? 'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-up';
      this.ui.refreshEnhancedList();
    });

    // Grouping
    document.getElementById('group-select').addEventListener('change', (e) => {
      this.core.groupBy = e.target.value;
      this.ui.refreshEnhancedList();
    });

    // View mode
    document.getElementById('detailed-view').addEventListener('click', () => {
      this.ui.setViewMode('detailed');
    });

    document.getElementById('compact-view').addEventListener('click', () => {
      this.ui.setViewMode('compact');
    });

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => {
      if (this.core.currentPage > 1) {
        this.core.currentPage--;
        this.ui.refreshEnhancedList();
      }
    });

    document.getElementById('next-page').addEventListener('click', () => {
      const totalPages = this.core.getTotalPages();
      if (this.core.currentPage < totalPages) {
        this.core.currentPage++;
        this.ui.refreshEnhancedList();
      }
    });

    document.getElementById('items-per-page').addEventListener('change', (e) => {
      this.core.itemsPerPage = parseInt(e.target.value);
      this.core.currentPage = 1;
      this.ui.refreshEnhancedList();
    });

    // Bulk actions
    document.getElementById('select-all').addEventListener('click', () => {
      this.ui.toggleSelectAll();
    });

    document.getElementById('bulk-activate').addEventListener('click', () => {
      this.bulkActivate();
    });

    document.getElementById('bulk-deactivate').addEventListener('click', () => {
      this.bulkDeactivate();
    });

    document.getElementById('bulk-delete').addEventListener('click', () => {
      this.bulkDelete();
    });
  }

  /**
   * Wire event handlers for server rows
   */
  wireServerRowHandlers() {
    // Favorite toggles
    document.querySelectorAll('[data-favorite]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.storage.toggleFavorite(btn.dataset.favorite);
        this.ui.refreshEnhancedList();
      });
    });

    // Edit buttons
    document.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.trigger('edit', { 
          name: btn.dataset.edit, 
          section: btn.dataset.section 
        });
        this.storage.updateLastUsed(btn.dataset.edit);
      });
    });

    // Delete buttons
    document.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = btn.dataset.delete;
        const section = btn.dataset.section;
        if (!confirm(`Delete "${name}"?`)) return;
        
        configManager.deleteServer(name, section);
        await configManager.saveConfig();
        notifications.showRestartWarning();
        this.ui.refreshEnhancedList();
      });
    });

    // Toggle status buttons
    document.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = btn.dataset.toggle;
        const currentStatus = btn.closest('tr').dataset.serverStatus;
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        
        if (!confirm(`${newStatus === 'active' ? 'Activate' : 'Deactivate'} "${name}"?`)) return;
        
        configManager.moveServer(name, newStatus);
        await configManager.saveConfig();
        notifications.showRestartWarning();
        this.ui.refreshEnhancedList();
      });
    });

    // Checkbox selection
    document.querySelectorAll('.server-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.ui.updateBulkActions();
      });
    });
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
   * Register event listeners
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
    return this;
  }

  /**
   * Trigger an event
   */
  trigger(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
    return this;
  }
}
