/**
 * JSON Editor
 * Handles the JSON editor functionality
 */

import configManager from '../config/config-manager.js';
import modalManager from './modal-manager.js';
import notifications from './notifications.js';

class JsonEditor {
  constructor() {
    // DOM elements
    this.modal = document.getElementById('json-modal');
    this.downloadBtn = document.getElementById('download-json');
    this.cancelBtn = document.getElementById('json-cancel');
    
    // ACE editor instance
    this.editor = null;
  }

  /**
   * Initialize the JSON editor
   */
  initialize() {
    // Initialize ACE editor
    this.editor = ace.edit('json-editor');
    this.editor.setTheme('ace/theme/monokai');
    this.editor.session.setMode('ace/mode/json');
    this.editor.setShowPrintMargin(false);
    
    // Set up event listeners
    this.downloadBtn.addEventListener('click', this.handleDownload.bind(this));
    this.cancelBtn.addEventListener('click', () => modalManager.closeActiveModal());
    
    return this;
  }

  /**
   * Open the JSON editor modal
   */
  openModal() {
    // Set editor value
    this.editor.setValue(JSON.stringify(configManager.getConfig(), null, 2), -1);
    
    // Show modal
    modalManager.showModal(this.modal);
  }

  /**
   * Handle download button click
   */
  async handleDownload() {
    try {
      const txt = this.editor.getValue();
      
      // Validate JSON
      try {
        JSON.parse(txt);
      } catch (e) {
        alert('Invalid JSON: ' + e.message);
        return;
      }
      
      // Save configuration
      await window.api.writeConfig(txt);
      
      // Update config manager
      configManager.config = JSON.parse(txt);
      
      // Notify listeners
      configManager.notifyChangeListeners();
      
      // Show restart warning
      notifications.showRestartWarning();
      
      // Close modal
      modalManager.closeActiveModal();
    } catch (error) {
      console.error('Failed to save JSON:', error);
      alert('Failed to save JSON: ' + error.message);
    }
  }
}

// Create and export a singleton instance
const jsonEditor = new JsonEditor();
export default jsonEditor;
