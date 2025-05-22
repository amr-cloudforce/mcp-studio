/**
 * Notifications
 * Handles warnings and notifications
 */

class Notifications {
  constructor() {
    // DOM elements
    this.prereqWarning = document.getElementById('prerequisites-warning');
    this.prereqMessage = document.getElementById('prereq-message');
    this.missingDocker = document.getElementById('missing-docker');
    this.missingNodejs = document.getElementById('missing-nodejs');
    this.installDockerBtn = document.getElementById('install-docker-btn');
    this.installNodejsBtn = document.getElementById('install-nodejs-btn');
    this.restartWarning = document.getElementById('restart-warning');
    this.restartClaudeBtn = document.getElementById('restart-claude-btn');
  }

  /**
   * Initialize notifications
   */
  initialize() {
    // Set up restart button
    this.restartClaudeBtn.addEventListener('click', this.handleRestartClaude.bind(this));
    
    // Set up install buttons
    this.installDockerBtn.addEventListener('click', async () => {
      const status = await require('electron').ipcRenderer.invoke('check-prerequisites');
      require('electron').ipcRenderer.invoke('open-url', status.dockerUrl);
    });
    
    this.installNodejsBtn.addEventListener('click', async () => {
      const status = await require('electron').ipcRenderer.invoke('check-prerequisites');
      require('electron').ipcRenderer.invoke('open-url', status.nodejsUrl);
    });
    
    // Check prerequisites
    this.checkPrerequisites();
    
    // Listen for prerequisites status from main process
    window.addEventListener('message', event => {
      if (event.data.type === 'prerequisites-status') {
        this.updatePrerequisitesStatus(event.data.data);
      }
    });
    
    return this;
  }

  /**
   * Check prerequisites
   */
  async checkPrerequisites() {
    try {
      const status = await require('electron').ipcRenderer.invoke('check-prerequisites');
      this.updatePrerequisitesStatus(status);
    } catch (error) {
      console.error('Failed to check prerequisites:', error);
    }
  }

  /**
   * Update prerequisites status
   * @param {object} status - Prerequisites status
   */
  updatePrerequisitesStatus(status) {
    const { docker, nodejs, appVersion } = status;
    
    // Update version tag if available
    const versionTag = document.getElementById('version-tag');
    if (versionTag && appVersion) {
      versionTag.textContent = `v${appVersion}`;
    }
    
    // Check prerequisites
    let missingDeps = [];
    
    if (!docker) {
      missingDeps.push('Docker');
      this.missingDocker.style.display = 'block';
    } else {
      this.missingDocker.style.display = 'none';
    }
    
    if (!nodejs) {
      missingDeps.push('Node.js');
      this.missingNodejs.style.display = 'block';
    } else {
      this.missingNodejs.style.display = 'none';
    }
    
    if (missingDeps.length > 0) {
      this.prereqMessage.textContent = `Missing dependencies: ${missingDeps.join(', ')}. Please install to use all features.`;
      this.prereqWarning.style.display = 'block';
    } else {
      this.prereqWarning.style.display = 'none';
    }
  }

  /**
   * Show restart warning
   */
  showRestartWarning() {
    this.restartWarning.style.display = 'block';
  }

  /**
   * Hide restart warning
   */
  hideRestartWarning() {
    this.restartWarning.style.display = 'none';
  }

  /**
   * Handle restart Claude button click
   */
  async handleRestartClaude() {
    try {
      // Temporarily change button state
      this.restartClaudeBtn.textContent = 'Restarting...';
      this.restartClaudeBtn.disabled = true;
      
      // Hide the warning immediately
      this.hideRestartWarning();
      
      // Start the restart process but don't await it
      // This way the function continues executing regardless of Claude restarting
      require('electron').ipcRenderer.invoke('restart-claude').catch(error => {
        console.error('Error in background restart:', error);
      });
      
      // Reset button state after a short delay
      setTimeout(() => {
        this.restartClaudeBtn.textContent = 'Restart Claude';
        this.restartClaudeBtn.disabled = false;
      }, 500);
    } catch (error) {
      console.error('Failed to restart Claude:', error);
      alert('Failed to restart Claude. Please restart it manually.');
      this.restartClaudeBtn.textContent = 'Restart Claude';
      this.restartClaudeBtn.disabled = false;
    }
  }
}

// Create and export a singleton instance
const notifications = new Notifications();
export default notifications;
