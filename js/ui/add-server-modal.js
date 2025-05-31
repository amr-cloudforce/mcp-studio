/**
 * Add Server Modal
 * Unified entry point for adding servers (templates, manual, import)
 */

import modalManager from './modal-manager.js';
import serverForm from './server-form/index.js';
import quickAdd from '../quick-add.js';
import pasteModal from './paste-modal.js';
import { parseUrlResponse } from '../utils/url-parser.js';

class AddServerModal {
  constructor() {
    // Create modal element
    this.createModal();
    
    // DOM elements
    this.modal = document.getElementById('add-server-modal');
    this.closeBtn = document.getElementById('add-server-close');
    this.manualBtn = document.getElementById('manual-option');
    this.importBtn = document.getElementById('import-option');
    this.urlInput = document.getElementById('url-import-input');
    this.urlImportBtn = document.getElementById('url-import-btn');
    this.urlImportForm = document.getElementById('url-import-form');
    this.importOptions = document.getElementById('import-options');
    this.pasteJsonBtn = document.getElementById('paste-json-option');
    this.urlOption = document.getElementById('url-option');
    
    // Initialize event listeners
    this.initEventListeners();
  }
  
  /**
   * Create the modal HTML
   */
  createModal() {
    // Create modal element
    const modal = document.createElement('div');
    modal.id = 'add-server-modal';
    modal.className = 'modal';
    
    // Set modal content
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <span class="close" id="add-server-close">&times;</span>
          <span class="modal-esc-hint">Press <span class="kbd">ESC</span> to close</span>
          <h2>Add MCP Server</h2>
        </div>
        <div class="add-server-content">
          <p>How would you like to add a server?</p>
          
          <div class="option-grid">
            <div class="option-card" id="manual-option">
              <div class="option-icon">⚙️</div>
              <h3>Manual</h3>
              <p>Custom setup with full control over all settings</p>
            </div>
            
            <div class="option-card" id="import-option">
              <div class="option-icon">📥</div>
              <h3>Import</h3>
              <p>From JSON or URL</p>
            </div>
          </div>
          
          <div id="import-options" style="display: none; margin-top: 20px;">
            <div class="option-grid" style="grid-template-columns: 1fr 1fr;">
              <div class="option-card" id="paste-json-option">
                <div class="option-icon">📋</div>
                <h3>Paste JSON</h3>
                <p>Paste a JSON configuration</p>
              </div>
              
              <div class="option-card" id="url-option">
                <div class="option-icon">🔗</div>
                <h3>From URL</h3>
                <p>Import from a URL</p>
              </div>
            </div>
            
            <form id="url-import-form" style="display: none; margin-top: 20px;">
              <div class="form-group">
                <label for="url-import-input">Enter URL</label>
                <div style="display: flex; gap: 10px;">
                  <input type="text" id="url-import-input" placeholder="https://github.com/user/repo/..." style="flex: 1;">
                  <button type="submit" id="url-import-btn" class="btn btn-success">Import</button>
                </div>
                <small>Supports NPX configurations from any URL (GitHub, Gists, docs, etc.)</small>
              </div>
            </form>
          </div>
        </div>
      </div>
    `;
    
    // Add modal to document
    document.body.appendChild(modal);
    
    // Add styles
    this.addStyles();
  }
  
  /**
   * Add styles for the modal
   */
  addStyles() {
    // Create style element
    const style = document.createElement('style');
    
    // Set style content
    style.textContent = `
      .option-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 20px;
        margin-top: 20px;
      }
      
      .option-card {
        border: 1px solid var(--border);
        border-radius: 10px;
        padding: 20px;
        cursor: pointer;
        transition: var(--transition);
        background: #f9faff;
        box-shadow: var(--shadow-sm);
        height: 100%;
        display: flex;
        flex-direction: column;
        position: relative;
        overflow: hidden;
        text-align: center;
      }
      
      .option-card:hover {
        transform: translateY(-5px);
        box-shadow: var(--shadow-md);
        border-color: var(--primary);
        background: #fff;
      }
      
      .option-icon {
        font-size: 2rem;
        margin-bottom: 10px;
      }
      
      .option-card h3 {
        margin-top: 0;
        color: var(--primary);
      }
      
      .option-card p {
        font-size: 0.9rem;
        color: var(--text-light);
        margin-bottom: 0;
        flex-grow: 1;
      }
      
      .add-server-content {
        padding: 10px 0;
      }
      
      @media (max-width: 768px) {
        .option-grid {
          grid-template-columns: 1fr;
        }
      }
    `;
    
    // Add style to document
    document.head.appendChild(style);
  }
  
  /**
   * Initialize event listeners
   */
  initEventListeners() {
    // Close button
    this.closeBtn.addEventListener('click', () => this.closeModal());
    
    // ESC key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('open')) {
        this.closeModal();
      }
    });
    
    // Manual option
    this.manualBtn.addEventListener('click', () => {
      this.closeModal();
      serverForm.openModal();
    });
    
    // Import option
    this.importBtn.addEventListener('click', () => {
      this.importOptions.style.display = 'block';
      this.urlImportForm.style.display = 'none';
    });
    
    // Paste JSON option
    this.pasteJsonBtn.addEventListener('click', () => {
      this.closeModal();
      pasteModal.openModal();
    });
    
    // URL option
    this.urlOption.addEventListener('click', () => {
      this.urlImportForm.style.display = 'block';
      this.urlInput.focus();
    });
    
    // URL import form
    this.urlImportForm.addEventListener('submit', (e) => {
      e.preventDefault();
      this.importFromUrl();
    });
  }
  
  /**
   * Open the modal
   */
  openModal() {
    // Reset the form
    this.importOptions.style.display = 'none';
    this.urlImportForm.style.display = 'none';
    this.urlInput.value = '';
    
    // Show the modal
    modalManager.showModal(this.modal);
  }
  
  /**
   * Close the modal
   */
  closeModal() {
    modalManager.closeActiveModal();
  }
  
  /**
   * Import from URL
   */
  async importFromUrl() {
    const url = this.urlInput.value.trim();
    
    if (!url) {
      alert('Please enter a URL');
      return;
    }
    
    try {
      // Show loading state
      this.urlImportBtn.textContent = 'Importing...';
      this.urlImportBtn.disabled = true;
      
      // Fetch the URL
      const response = await window.api.fetchUrl(url);
      
      // Parse the response using the imported function
      const config = parseUrlResponse(url, response);
      
      if (!config) {
        alert('Could not find a valid NPX configuration in the URL content');
        return;
      }
      
      // Close the modal
      this.closeModal();
      
      // Open the server form with the parsed config
      serverForm.openModalWithConfig(config);
    } catch (error) {
      alert(`Error importing from URL: ${error.message}`);
    } finally {
      // Reset loading state
      this.urlImportBtn.textContent = 'Import';
      this.urlImportBtn.disabled = false;
    }
  }
}

// Create and export a singleton instance
const addServerModal = new AddServerModal();
export default addServerModal;
