/**
 * Log Viewer
 * Handles displaying and filtering MCP server logs
 */

import modalManager from '../ui/modal-manager.js';
const { ipcRenderer } = window.electron || {};

class LogViewer {
  constructor() {
    this.logs = {};
    this.currentServer = null;
    this.filterType = 'all'; // 'all', 'info', 'error'
    this.isAutoScrollEnabled = true;
    
    // DOM elements - will be initialized when the modal is created
    this.modal = null;
    this.serverList = null;
    this.logContent = null;
    this.filterButtons = null;
    this.autoScrollToggle = null;
    this.refreshButton = null;
  }

  /**
   * Initialize the log viewer
   */
  initialize() {
    // Create the modal if it doesn't exist
    this.createModal();
    
    // Set up event listeners
    this.setupEventListeners();
    
    return this;
  }

  /**
   * Create the log viewer modal
   */
  createModal() {
    // Create modal element if it doesn't exist
    if (!document.getElementById('log-modal')) {
      const modalHtml = `
        <div id="log-modal" class="modal">
          <div class="modal-content log-modal-content">
            <div class="modal-header">
              <span class="close" id="log-close">&times;</span>
              <span class="modal-esc-hint">Press <span class="kbd">ESC</span> to close</span>
              <h2>MCP Server Logs</h2>
            </div>
            <div class="log-container">
              <div class="log-sidebar">
                <div class="log-controls">
                  <button id="refresh-logs" class="btn btn-reveal">
                    <span class="refresh-icon">↻</span> Refresh
                  </button>
                  <label class="auto-scroll-toggle">
                    <input type="checkbox" id="auto-scroll" checked>
                    Auto-scroll
                  </label>
                </div>
                <div class="log-filter">
                  <span>Filter:</span>
                  <div class="filter-buttons">
                    <button class="filter-btn active" data-filter="all">All</button>
                    <button class="filter-btn" data-filter="info">Info</button>
                    <button class="filter-btn" data-filter="error">Errors</button>
                  </div>
                </div>
                <div class="server-list-container">
                  <h3>Log Files</h3>
                  <ul id="log-server-list" class="log-server-list"></ul>
                </div>
              </div>
              <div class="log-content-container">
                <div id="log-content" class="log-content"></div>
              </div>
            </div>
          </div>
        </div>
      `;
      
      // Append modal to body
      const modalContainer = document.createElement('div');
      modalContainer.innerHTML = modalHtml;
      document.body.appendChild(modalContainer.firstElementChild);
      
      // Cache DOM elements
      this.modal = document.getElementById('log-modal');
      this.serverList = document.getElementById('log-server-list');
      this.logContent = document.getElementById('log-content');
      this.filterButtons = document.querySelectorAll('.filter-btn');
      this.autoScrollToggle = document.getElementById('auto-scroll');
      this.refreshButton = document.getElementById('refresh-logs');
      
      // Add close button handler
      document.getElementById('log-close').addEventListener('click', () => {
        modalManager.closeActiveModal();
      });
    }
  }

  /**
   * Set up event listeners
   */
  setupEventListeners() {
    // Filter buttons
    this.filterButtons.forEach(button => {
      button.addEventListener('click', () => {
        this.filterButtons.forEach(btn => btn.classList.remove('active'));
        button.classList.add('active');
        this.filterType = button.dataset.filter;
        this.renderLogs();
      });
    });
    
    // Auto-scroll toggle
    this.autoScrollToggle.addEventListener('change', () => {
      this.isAutoScrollEnabled = this.autoScrollToggle.checked;
      if (this.isAutoScrollEnabled) {
        this.scrollToBottom();
      }
    });
    
    // Refresh button
    this.refreshButton.addEventListener('click', () => {
      this.loadLogs();
    });
  }

  /**
   * Open the log viewer modal
   */
  async openModal() {
    modalManager.showModal(this.modal);
    await this.loadLogs();
  }

  /**
   * Load logs from the file system
   */
  async loadLogs() {
    try {
      // Call the main process to get logs
      const logs = await window.api.getLogs();
      this.logs = logs;
      
      // Populate server list
      this.populateServerList();
      
      // Select the first server or keep the current selection
      if (!this.currentServer && Object.keys(this.logs).length > 0) {
        this.currentServer = Object.keys(this.logs)[0];
      }
      
      // Render logs for the selected server
      this.renderLogs();
    } catch (error) {
      console.error('Failed to load logs:', error);
      this.logContent.innerHTML = `<div class="log-error">Failed to load logs: ${error.message}</div>`;
    }
  }

  /**
   * Populate the server list
   */
  populateServerList() {
    this.serverList.innerHTML = '';
    
    Object.keys(this.logs).forEach(server => {
      const li = document.createElement('li');
      
      // Check if server has errors
      const hasErrors = this.logs[server].some(log => log.level === 'error');
      
      li.innerHTML = `
        <span class="server-name">${server}</span>
        ${hasErrors ? '<span class="error-indicator"></span>' : ''}
      `;
      
      li.classList.add('server-item');
      if (server === this.currentServer) {
        li.classList.add('active');
      }
      
      li.addEventListener('click', () => {
        this.serverList.querySelectorAll('.server-item').forEach(item => {
          item.classList.remove('active');
        });
        li.classList.add('active');
        this.currentServer = server;
        this.renderLogs();
      });
      
      this.serverList.appendChild(li);
    });
  }

  /**
   * Render logs for the selected server
   */
  renderLogs() {
    if (!this.currentServer || !this.logs[this.currentServer]) {
      this.logContent.innerHTML = '<div class="no-logs">No logs available</div>';
      return;
    }
    
    const logs = this.logs[this.currentServer];
    
    // Filter logs based on the selected filter
    const filteredLogs = this.filterType === 'all' 
      ? logs 
      : logs.filter(log => log.level === this.filterType);
    
    if (filteredLogs.length === 0) {
      this.logContent.innerHTML = `<div class="no-logs">No ${this.filterType} logs available</div>`;
      return;
    }
    
    // Render logs
    this.logContent.innerHTML = filteredLogs.map(log => {
      const timestamp = new Date(log.timestamp).toLocaleTimeString();
      const levelClass = `log-level-${log.level}`;
      
      let message = log.message;
      let details = '';
      
      // Check if the message contains JSON
      if (log.details) {
        try {
          details = `<pre class="log-details">${JSON.stringify(log.details, null, 2)}</pre>`;
        } catch (e) {
          details = `<pre class="log-details">${log.details}</pre>`;
        }
      }
      
      return `
        <div class="log-entry ${levelClass}">
          <span class="log-timestamp">${timestamp}</span>
          <span class="log-level">${log.level}</span>
          <span class="log-message">${message}</span>
          ${details}
        </div>
      `;
    }).join('');
    
    // Scroll to bottom if auto-scroll is enabled
    if (this.isAutoScrollEnabled) {
      this.scrollToBottom();
    }
  }

  /**
   * Scroll to the bottom of the log content
   */
  scrollToBottom() {
    this.logContent.scrollTop = this.logContent.scrollHeight;
  }

  /**
   * Parse a log line into a structured object
   * @param {string} line - Log line to parse
   * @returns {object} Parsed log entry
   */
  static parseLine(line) {
    try {
      // Example log format: 2025-05-12T16:17:33.029Z [tavily-mcp] [info] Initializing server...
      const regex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z) \[([^\]]+)\] \[([^\]]+)\] (.+)$/;
      const match = line.match(regex);
      
      if (!match) {
        return null;
      }
      
      const [, timestamp, server, level, message] = match;
      
      // Check if the message contains JSON
      let details = null;
      const jsonMatch = message.match(/(\{.+\})$/);
      
      if (jsonMatch) {
        try {
          details = JSON.parse(jsonMatch[1]);
        } catch (e) {
          // Not valid JSON, ignore
        }
      }
      
      return {
        timestamp,
        server,
        level,
        message: details ? message.replace(jsonMatch[1], '') : message,
        details
      };
    } catch (error) {
      console.error('Failed to parse log line:', error);
      return null;
    }
  }
}

// Create and export a singleton instance
const logViewer = new LogViewer();
export default logViewer;
