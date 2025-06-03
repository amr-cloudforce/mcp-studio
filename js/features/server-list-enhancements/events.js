/**
 * @file events.js
 * @description Event handling for server list enhancements
 */

import configManager from '../../config/config-manager.js';
import notifications from '../../ui/notifications.js';
import { BulkActions } from './bulk-actions.js';

export class ServerListEvents {
  constructor(core, storage, ui) {
    this.core = core;
    this.storage = storage;
    this.ui = ui;
    this.eventListeners = {};
    this.bulkActions = new BulkActions(core, ui);
  }

  /**
   * Wire up event handlers for enhanced functionality
   */
  wireEventHandlers() {
    // Check if elements exist before adding listeners
    const serverSearch = document.getElementById('server-search');
    if (!serverSearch) {
      console.warn('Enhanced UI elements not found, skipping event handlers');
      return;
    }
    
    // Search
    serverSearch.addEventListener('input', (e) => {
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

    document.getElementById('favorites-filter').addEventListener('click', (e) => {
      e.preventDefault();
      this.core.activeFilters.favorites = !this.core.activeFilters.favorites;
      const favBtn = document.getElementById('favorites-filter');
      favBtn.classList.toggle('active', this.core.activeFilters.favorites);
      
      // Update button appearance
      const icon = favBtn.querySelector('i');
      if (this.core.activeFilters.favorites) {
        icon.className = 'fas fa-star';
        favBtn.style.background = '#007bff';
        favBtn.style.color = 'white';
        favBtn.style.borderColor = '#007bff';
      } else {
        icon.className = 'fas fa-star';
        favBtn.style.background = '';
        favBtn.style.color = '';
        favBtn.style.borderColor = '';
      }
      
      this.core.currentPage = 1;
      this.ui.refreshEnhancedList();
      
      console.log('Favorites filter toggled:', this.core.activeFilters.favorites);
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

    // View mode (skip if elements don't exist)
    const detailedView = document.getElementById('detailed-view');
    const compactView = document.getElementById('compact-view');
    
    if (detailedView) {
      detailedView.addEventListener('click', () => {
        this.ui.setViewMode('detailed');
      });
    }
    
    if (compactView) {
      compactView.addEventListener('click', () => {
        this.ui.setViewMode('compact');
      });
    }

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
      this.bulkActions.bulkActivate();
    });

    document.getElementById('bulk-deactivate').addEventListener('click', () => {
      this.bulkActions.bulkDeactivate();
    });

    document.getElementById('bulk-delete').addEventListener('click', () => {
      this.bulkActions.bulkDelete();
    });

    document.getElementById('deactivate-all').addEventListener('click', () => {
      this.bulkActions.deactivateAllActive();
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
