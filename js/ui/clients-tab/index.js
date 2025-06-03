/**
 * Clients Tab Main Controller
 * Entry point for client synchronization management
 */
import { renderClientsTab } from './ui-components.js';
import { attachEventListeners } from './event-handlers.js';

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
    renderClientsTab(this.container);
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    if (!this.container) return;
    attachEventListeners(this.container, this);
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
   * Show backup management modal
   * @param {string} clientId - Client identifier
   */
  showBackupManagementModal(clientId) {
    import('./backup-modal.js').then(module => {
      module.showBackupManagementModal(clientId);
    });
  }
}

// Export singleton instance
const clientsTab = new ClientsTab();
export default clientsTab;
