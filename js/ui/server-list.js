/**
 * @file server-list.js
 * @description Handles rendering and interactions for the MCP server list.
 * 
 * This module is responsible for displaying the list of MCP servers,
 * handling user interactions with the list (edit, delete, activate, deactivate),
 * and communicating with other modules via events.
 * 
 * ## Responsibilities:
 * - Render the server list based on configuration
 * - Handle user interactions with server list items
 * - Trigger events for other modules to respond to
 * - Update the list when configuration changes
 * 
 * ## Modularization Strategy:
 * If this module grows too large, consider these strategies:
 * 
 * 1. Split rendering and event handling into separate modules
 *    (e.g., server-list-renderer.js and server-list-events.js)
 * 
 * 2. Extract complex rendering logic into template functions
 *    (e.g., createActiveServerRow, createInactiveServerRow)
 * 
 * 3. Use a component-based approach for different types of list items
 *    while maintaining the singleton pattern
 * 
 * 4. Keep the public API simple and focused on the core responsibilities
 *    (initialize, refreshList, on/trigger for events)
 */

import configManager from '../config/config-manager.js';
import notifications from './notifications.js';
import serverForm from './server-form/index.js';
import serverListEnhancements from '../features/server-list-enhancements.js';

class ServerList {
  constructor() {
    this.serverListElement = null;
    this.eventListeners = {};
    
    // Listen for config changes to refresh the list
    configManager.addChangeListener(() => this.refreshList());
  }

  /**
   * Initialize the server list
   */
  initialize() {
    this.serverListElement = document.getElementById('server-list');
    
    // Initialize enhancements
    serverListEnhancements.initialize();
    
    // Forward edit events from enhancements to this module
    serverListEnhancements.on('edit', (data) => {
      this.trigger('edit', data);
    });
    
    return this;
  }

  /**
   * Register event listeners
   * @param {string} event - Event name
   * @param {Function} callback - Event callback
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
   * @param {string} event - Event name
   * @param {*} data - Event data
   */
  trigger(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
    return this;
  }

  /**
   * Refreshes the server list based on the current configuration.
   */
  refreshList() {
    if (!this.serverListElement) return;
    
    // Use enhanced list if available, otherwise fall back to basic list
    if (serverListEnhancements && typeof serverListEnhancements.refreshEnhancedList === 'function') {
      serverListEnhancements.refreshEnhancedList();
    } else {
      this.renderBasicList();
    }
    
    return this;
  }

  /**
   * Render the basic server list (fallback)
   */
  renderBasicList() {
    this.serverListElement.innerHTML = '';
    const mcpConfig = configManager.getConfig();

    // Add active servers
    Object.entries(mcpConfig.mcpServers || {}).forEach(([n, c]) => {
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${n}</td>
        <td>${c.command}</td>
        <td>
          <span class="badge badge-enabled">Active</span>
        </td>
        <td>
          <button class="btn btn-export" data-edit="${n}">Edit</button>
          <button class="btn btn-del" data-del="${n}">Delete</button>
          <button class="btn btn-reveal" data-deactivate="${n}">Deactivate</button>
        </td>`;
      this.serverListElement.appendChild(tr);
    });

    // Add inactive servers
    Object.entries(mcpConfig.inactive || {}).forEach(([n, c]) => {
      const tr = document.createElement('tr');
      tr.className = 'inactive-row';
      tr.innerHTML = `
        <td>${n}</td>
        <td>${c.command}</td>
        <td>
          <span class="badge badge-disabled">Inactive</span>
        </td>
        <td>
          <button class="btn btn-export" data-edit-inactive="${n}">Edit</button>
          <button class="btn btn-del" data-del-inactive="${n}">Delete</button>
          <button class="btn btn-add" data-activate="${n}">Activate</button>
        </td>`;
      this.serverListElement.appendChild(tr);
    });

    this.wireEventHandlers();
  }

  /**
   * Wires up event handlers for the server list buttons.
   */
  wireEventHandlers() {
    this.serverListElement.querySelectorAll('[data-edit]').forEach(b =>
      b.onclick = () => {
        const name = b.dataset.edit;
        this.trigger('edit', { name, section: 'active' });
      }
    );

    this.serverListElement.querySelectorAll('[data-del]').forEach(b =>
      b.onclick = async () => {
        if (!confirm(`Delete "${b.dataset.del}"?`)) return;
        configManager.deleteServer(b.dataset.del, 'active');
        await configManager.saveConfig();
        notifications.showRestartWarning();
      }
    );

    this.serverListElement.querySelectorAll('[data-deactivate]').forEach(b =>
      b.onclick = async () => {
        const name = b.dataset.deactivate;
        if (!confirm(`Deactivate "${name}"?`)) return;
        configManager.moveServer(name, 'inactive');
        await configManager.saveConfig();
        notifications.showRestartWarning();
      }
    );

    this.serverListElement.querySelectorAll('[data-edit-inactive]').forEach(b =>
      b.onclick = () => {
        const name = b.dataset.editInactive;
        this.trigger('edit', { name, section: 'inactive' });
      }
    );

    this.serverListElement.querySelectorAll('[data-del-inactive]').forEach(b =>
      b.onclick = async () => {
        const name = b.dataset.delInactive;
        if (!confirm(`Delete inactive server "${name}"?`)) return;
        configManager.deleteServer(name, 'inactive');
        await configManager.saveConfig();
        notifications.showRestartWarning();
      }
    );

    this.serverListElement.querySelectorAll('[data-activate]').forEach(b =>
      b.onclick = async () => {
        const name = b.dataset.activate;
        if (!confirm(`Activate "${name}"?`)) return;
        configManager.moveServer(name, 'active');
        await configManager.saveConfig();
        notifications.showRestartWarning();
      }
    );
  }
}

// Create and export a singleton instance
const serverList = new ServerList();
export default serverList;
