/**
 * About Modal
 * Handles the about modal functionality
 */

import modalManager from './modal-manager.js';

class AboutModal {
  constructor() {
    // DOM elements
    this.modal = document.getElementById('about-modal');
    this.closeBtn = document.getElementById('about-close');
    this.closeBtnFooter = document.getElementById('about-close-btn');
    this.versionElement = document.getElementById('about-version');
    this.dockerStatus = document.getElementById('docker-status');
    this.nodejsStatus = document.getElementById('nodejs-status');
    this.dockerStatusDot = document.getElementById('docker-status-dot');
    this.nodejsStatusDot = document.getElementById('nodejs-status-dot');
    this.dockerInstLink = document.getElementById('docker-install-link');
    this.nodejsInstLink = document.getElementById('nodejs-install-link');
  }

  /**
   * Initialize the about modal
   */
  initialize() {
    // Set up event listeners
    this.closeBtn.addEventListener('click', () => modalManager.closeActiveModal());
    this.closeBtnFooter.addEventListener('click', () => modalManager.closeActiveModal());
    
    // Set up installation links
    this.dockerInstLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.api.checkPrerequisites().then(status => {
        window.api.openUrl(status.dockerUrl);
      });
    });
    
    this.nodejsInstLink.addEventListener('click', (e) => {
      e.preventDefault();
      window.api.checkPrerequisites().then(status => {
        window.api.openUrl(status.nodejsUrl);
      });
    });
    
    return this;
  }

  /**
   * Open the about modal
   */
  async openModal() {
    try {
      // Get prerequisites status
      const status = await window.api.checkPrerequisites();
      
      // Update status display
      this.updateStatus(status);
      
      // Show modal
      modalManager.showModal(this.modal);
    } catch (error) {
      console.error('Failed to check prerequisites:', error);
    }
  }

  /**
   * Update status display
   * @param {object} status - Prerequisites status
   */
  updateStatus(status) {
    const { docker, nodejs, appVersion, dockerUrl, nodejsUrl } = status;
    
    // Set version
    if (appVersion) {
      this.versionElement.textContent = `v${appVersion}`;
    }
    
    // Docker status
    if (docker) {
      this.dockerStatus.textContent = 'Installed';
      this.dockerStatusDot.className = 'status-dot green';
    } else {
      this.dockerStatus.textContent = 'Not Installed';
      this.dockerStatusDot.className = 'status-dot red';
    }
    
    // Node.js status
    if (nodejs) {
      this.nodejsStatus.textContent = 'Installed';
      this.nodejsStatusDot.className = 'status-dot green';
    } else {
      this.nodejsStatus.textContent = 'Not Installed';
      this.nodejsStatusDot.className = 'status-dot red';
    }
  }
}

// Create and export a singleton instance
const aboutModal = new AboutModal();
export default aboutModal;
