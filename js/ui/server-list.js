/**
 * Server List
 * Handles rendering the server list and attaching event handlers
 */

import configManager from '../config/config-manager.js';
import modalManager from './modal-manager.js';
import notifications from './notifications.js';

class ServerList {
  constructor() {
    this.serverListElement = document.getElementById('server-list');
    this.serverFormModal = document.getElementById('server-modal');
    this.eventHandlers = {};
  }

  /**
   * Initialize the server list
   */
  initialize() {
    // Listen for configuration changes
    configManager.addChangeListener(() => this.refreshList());
    
    return this;
  }

  /**
   * Refresh the server list
   */
  refreshList() {
    const config = configManager.getConfig();
    this.serverListElement.innerHTML = '';
    
    // Add active servers
    Object.entries(config.mcpServers || {}).forEach(([name, serverConfig]) => {
      this.addServerToList(name, serverConfig, 'active');
    });
    
    // Add inactive servers
    Object.entries(config.inactive || {}).forEach(([name, serverConfig]) => {
      this.addServerToList(name, serverConfig, 'inactive');
    });
    
    return this;
  }

  /**
   * Add a server to the list
   * @param {string} name - Server name
   * @param {object} serverConfig - Server configuration
   * @param {string} section - 'active' or 'inactive'
   */
  addServerToList(name, serverConfig, section) {
    const tr = document.createElement('tr');
    
    if (section === 'inactive') {
      tr.className = 'inactive-row';
    }
    
    tr.innerHTML = `
      <td>${name}</td>
      <td>${serverConfig.command}</td>
      <td>
        <span class="badge ${section === 'active' ? 'badge-enabled' : 'badge-disabled'}">
          ${section === 'active' ? 'Active' : 'Inactive'}
        </span>
      </td>
      <td>
        <button class="btn btn-export" data-action="edit" data-name="${name}" data-section="${section}">Edit</button>
        <button class="btn btn-del" data-action="delete" data-name="${name}" data-section="${section}">Delete</button>
        ${section === 'active' 
          ? `<button class="btn btn-reveal" data-action="deactivate" data-name="${name}">Deactivate</button>`
          : `<button class="btn btn-add" data-action="activate" data-name="${name}">Activate</button>`
        }
      </td>
    `;
    
    // Add event listeners to buttons
    tr.querySelectorAll('[data-action]').forEach(button => {
      const action = button.dataset.action;
      const name = button.dataset.name;
      const section = button.dataset.section;
      
      button.addEventListener('click', () => {
        this.handleAction(action, name, section);
      });
    });
    
    this.serverListElement.appendChild(tr);
  }

  /**
   * Handle button actions
   * @param {string} action - Action to perform
   * @param {string} name - Server name
   * @param {string} section - 'active' or 'inactive'
   */
  handleAction(action, name, section) {
    switch (action) {
      case 'edit':
        this.triggerEvent('edit', { name, section });
        break;
        
      case 'delete':
        if (confirm(`Delete ${section} server "${name}"?`)) {
          configManager.deleteServer(name, section);
          configManager.saveConfig();
          notifications.showRestartWarning();
        }
        break;
        
      case 'activate':
        configManager.moveServer(name, 'active');
        configManager.saveConfig();
        notifications.showRestartWarning();
        break;
        
      case 'deactivate':
        configManager.moveServer(name, 'inactive');
        configManager.saveConfig();
        notifications.showRestartWarning();
        break;
    }
  }

  /**
   * Register an event handler
   * @param {string} event - Event name
   * @param {Function} handler - Event handler
   */
  on(event, handler) {
    if (!this.eventHandlers[event]) {
      this.eventHandlers[event] = [];
    }
    this.eventHandlers[event].push(handler);
    return this;
  }

  /**
   * Trigger an event
   * @param {string} event - Event name
   * @param {object} data - Event data
   */
  triggerEvent(event, data) {
    if (this.eventHandlers[event]) {
      this.eventHandlers[event].forEach(handler => handler(data));
    }
    return this;
  }
}

// Create and export a singleton instance
const serverList = new ServerList();
export default serverList;
