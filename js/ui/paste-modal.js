/**
 * Paste Modal
 * Handles the paste functionality
 */

import configManager from '../config/config-manager.js';
import modalManager from './modal-manager.js';
import serverForm from './server-form.js';
import notifications from './notifications.js';

class PasteModal {
  constructor() {
    // DOM elements
    this.modal = document.getElementById('paste-modal');
    this.textarea = document.getElementById('paste-json');
    this.loadBtn = document.getElementById('paste-load-btn');
    this.cancelBtn = document.getElementById('paste-cancel-btn');
    this.closeBtn = document.getElementById('paste-close');
  }

  /**
   * Initialize the paste modal
   */
  initialize() {
    // Set up event listeners
    this.loadBtn.addEventListener('click', this.handleLoad.bind(this));
    this.cancelBtn.addEventListener('click', () => modalManager.closeActiveModal());
    this.closeBtn.addEventListener('click', () => modalManager.closeActiveModal());
    
    return this;
  }

  /**
   * Open the paste modal
   */
  openModal() {
    // Clear textarea
    this.textarea.value = '';
    
    // Show modal
    modalManager.showModal(this.modal);
  }

  /**
   * Handle load button click
   */
  handleLoad() {
    try {
      const txt = this.textarea.value;
      let obj;
      
      // Parse JSON
      try {
        obj = JSON.parse(txt);
      } catch (e) {
        alert('Invalid JSON: ' + e.message);
        return;
      }
      
      // Validate structure
      if (!obj.mcpServers) {
        alert('Missing "mcpServers" property');
        return;
      }
      
      const entries = Object.entries(obj.mcpServers);
      if (entries.length !== 1) {
        alert('Paste exactly one server entry');
        return;
      }
      
      // Extract server data
      const [name, cfg] = entries[0];
      
      // Close paste modal
      modalManager.closeActiveModal();
      
      // Open server form with pasted data
      serverForm.fillForm(name, cfg, false);
      modalManager.showModal(serverForm.modal);
    } catch (error) {
      console.error('Failed to load pasted JSON:', error);
      alert('Failed to load pasted JSON: ' + error.message);
    }
  }
}

// Create and export a singleton instance
const pasteModal = new PasteModal();
export default pasteModal;
