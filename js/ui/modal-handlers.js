/**
 * Modal Handlers
 * Centralizes logic for various modals (About, JSON Editor, Paste).
 */

import modalManager from './modal-manager.js';
import configManager from '../config/config-manager.js';
import serverForm from './server-form/index.js';

class ModalHandlers {
  constructor() {
    this.ipcRenderer = require('electron').ipcRenderer;
    this.shell = require('electron').shell;
    this.editor = null; // ACE editor instance, set in initialize
    
    // DOM references
    this.aboutModal = null;
    this.aboutClose = null;
    this.aboutCloseBtn = null;
    this.aboutVersion = null;
    this.dockerStatus = null;
    this.nodejsStatus = null;
    this.dockerStatusDot = null;
    this.nodejsStatusDot = null;
    this.dockerInstLink = null;
    this.nodejsInstLink = null;
    this.versionTag = null;
    
    this.pasteModal = null;
    this.pasteClose = null;
    this.pasteCancel = null;
    this.pasteLoad = null;
    this.pasteTextarea = null;
    
    this.jsonModal = null;
    this.downloadJsonBtn = null;
    this.jsonCancelBtn = null;
  }

  /**
   * Initialize the modal handlers
   */
  initialize() {
    // Get DOM references
    this.aboutModal = document.getElementById('about-modal');
    this.aboutClose = document.getElementById('about-close');
    this.aboutCloseBtn = document.getElementById('about-close-btn');
    this.aboutVersion = document.getElementById('about-version');
    this.dockerStatus = document.getElementById('docker-status');
    this.nodejsStatus = document.getElementById('nodejs-status');
    this.dockerStatusDot = document.getElementById('docker-status-dot');
    this.nodejsStatusDot = document.getElementById('nodejs-status-dot');
    this.dockerInstLink = document.getElementById('docker-install-link');
    this.nodejsInstLink = document.getElementById('nodejs-install-link');
    this.versionTag = document.getElementById('version-tag');
    
    this.pasteModal = document.getElementById('paste-modal');
    this.pasteClose = document.getElementById('paste-close');
    this.pasteCancel = document.getElementById('paste-cancel-btn');
    this.pasteLoad = document.getElementById('paste-load-btn');
    this.pasteTextarea = document.getElementById('paste-json');
    
    this.jsonModal = document.getElementById('json-modal');
    this.downloadJsonBtn = document.getElementById('download-json');
    this.jsonCancelBtn = document.getElementById('json-cancel');
    
    // Get ACE editor instance
    this.editor = ace.edit("json-editor");
    
    // Set up event handlers
    this.aboutClose.onclick = () => modalManager.closeActiveModal();
    this.aboutCloseBtn.onclick = () => modalManager.closeActiveModal();
    this.pasteClose.onclick = () => modalManager.closeActiveModal();
    this.pasteCancel.onclick = () => modalManager.closeActiveModal();
    this.jsonCancelBtn.onclick = () => modalManager.closeActiveModal();
    
    this.pasteLoad.onclick = this.handlePasteLoad.bind(this);
    this.downloadJsonBtn.onclick = this.handleDownloadJson.bind(this);
    
    return this;
  }

  /**
   * Opens the About modal and updates prerequisite status.
   */
  async openAboutModal() {
    const status = await this.ipcRenderer.invoke('check-prerequisites');
    const { docker, nodejs, dockerUrl, nodejsUrl } = status;

    // Update About modal with prerequisite status
    this.dockerStatus.textContent = docker ? 'Installed' : 'Not Installed';
    this.dockerStatusDot.className = docker ? 'status-dot green' : 'status-dot red';
    this.nodejsStatus.textContent = nodejs ? 'Installed' : 'Not Installed';
    this.nodejsStatusDot.className = nodejs ? 'status-dot green' : 'status-dot red';

    // Set version in about modal
    this.aboutVersion.textContent = this.versionTag.textContent;

    // Installation links
    this.dockerInstLink.onclick = (e) => {
      e.preventDefault();
      this.ipcRenderer.invoke('open-url', dockerUrl);
    };
    this.nodejsInstLink.onclick = (e) => {
      e.preventDefault();
      this.ipcRenderer.invoke('open-url', nodejsUrl);
    };

    modalManager.showModal(this.aboutModal);
  }

  /**
   * Opens the JSON editor modal with the current configuration.
   */
  openJsonModal() {
    this.editor.setValue(JSON.stringify(configManager.getConfig(), null, 2), -1);
    modalManager.showModal(this.jsonModal);
  }

  /**
   * Handles loading JSON from the paste textarea.
   */
  handlePasteLoad() {
    let txt = this.pasteTextarea.value;
    let obj;
    try {
      obj = JSON.parse(txt);
    } catch (e) {
      return alert('Invalid JSON: ' + e.message);
    }
    if (!obj.mcpServers) return alert('Missing "mcpServers"');
    const entries = Object.entries(obj.mcpServers);
    if (entries.length !== 1) return alert('Paste exactly one server entry');
    const [name, cfg] = entries[0];
    
    modalManager.closeActiveModal();
    // Trigger an event that the renderer can listen for
    document.dispatchEvent(new CustomEvent('paste:server:loaded', { detail: { name, cfg } }));
  }

  /**
   * Handles downloading/saving JSON from the editor.
   */
  async handleDownloadJson() {
    const txt = this.editor.getValue();
    try {
      const config = JSON.parse(txt); // Validate JSON
      await configManager.saveConfig(txt); // Save the new config
      configManager.config = config; // Update local config
      modalManager.closeActiveModal();
    } catch (e) {
      alert('Invalid JSON: ' + e.message);
    }
  }
}

// Create and export a singleton instance
const modalHandlers = new ModalHandlers();
export default modalHandlers;
