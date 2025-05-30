/**
 * @file server-list-toggle.js
 * @description Toggle between basic and enhanced server list views
 * 
 * This module provides a toggle button to switch between the basic server list
 * and the enhanced server list with advanced features. This allows users to
 * choose their preferred experience based on their needs.
 */

import serverList from '../ui/server-list.js';
import serverListEnhancements from './server-list-enhancements.js';

class ServerListToggle {
  constructor() {
    this.isEnhanced = true; // Default to enhanced view
    this.toggleButton = null;
  }

  /**
   * Initialize the toggle functionality
   */
  initialize() {
    this.createToggleButton();
    this.loadPreference();
    this.applyCurrentMode();
    return this;
  }

  /**
   * Create the toggle button in the header
   */
  createToggleButton() {
    const contentHeader = document.querySelector('.content-header');
    if (!contentHeader) return;

    // Create toggle container
    const toggleContainer = document.createElement('div');
    toggleContainer.className = 'server-list-toggle-container';
    toggleContainer.innerHTML = `
      <button id="server-list-toggle" class="btn btn-toggle" title="Toggle between basic and enhanced view">
        <i class="fas fa-toggle-on"></i>
        <span>Enhanced View</span>
      </button>
    `;

    // Add to header
    contentHeader.appendChild(toggleContainer);

    // Get button reference and wire event
    this.toggleButton = document.getElementById('server-list-toggle');
    this.toggleButton.addEventListener('click', () => this.toggle());
  }

  /**
   * Toggle between basic and enhanced views
   */
  toggle() {
    this.isEnhanced = !this.isEnhanced;
    this.savePreference();
    this.applyCurrentMode();
  }

  /**
   * Apply the current mode (basic or enhanced)
   */
  applyCurrentMode() {
    if (!this.toggleButton) return;

    const icon = this.toggleButton.querySelector('i');
    const text = this.toggleButton.querySelector('span');
    const enhancedHeader = document.querySelector('.enhanced-server-header');

    if (this.isEnhanced) {
      // Enhanced mode
      icon.className = 'fas fa-toggle-on';
      text.textContent = 'Enhanced View';
      this.toggleButton.classList.add('enhanced');
      
      // Show enhanced UI
      if (enhancedHeader) {
        enhancedHeader.style.display = 'block';
      }
      
      // Use enhanced list
      if (serverListEnhancements && typeof serverListEnhancements.refreshEnhancedList === 'function') {
        serverListEnhancements.refreshEnhancedList();
      }
    } else {
      // Basic mode
      icon.className = 'fas fa-toggle-off';
      text.textContent = 'Basic View';
      this.toggleButton.classList.remove('enhanced');
      
      // Hide enhanced UI
      if (enhancedHeader) {
        enhancedHeader.style.display = 'none';
      }
      
      // Use basic list
      serverList.renderBasicList();
    }
  }

  /**
   * Save preference to localStorage
   */
  savePreference() {
    localStorage.setItem('mcp-studio-enhanced-view', this.isEnhanced.toString());
  }

  /**
   * Load preference from localStorage
   */
  loadPreference() {
    const saved = localStorage.getItem('mcp-studio-enhanced-view');
    if (saved !== null) {
      this.isEnhanced = saved === 'true';
    }
  }

  /**
   * Get current mode
   */
  isEnhancedMode() {
    return this.isEnhanced;
  }

  /**
   * Set mode programmatically
   */
  setMode(enhanced) {
    if (this.isEnhanced !== enhanced) {
      this.isEnhanced = enhanced;
      this.savePreference();
      this.applyCurrentMode();
    }
  }
}

// Create and export a singleton instance
const serverListToggle = new ServerListToggle();
export default serverListToggle;
