/**
 * Notifications
 * Handles warnings and notifications
 */
import ClientSync from '../config/client-sync.js';
import ClientDetector from '../config/client-detector.js';

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
    this.restartClientsBtn = document.getElementById('restart-clients-btn');
  }

  /**
   * Initialize notifications
   */
  initialize() {
    // Set up restart button
    this.restartClientsBtn.addEventListener('click', this.handleRestartAllClients.bind(this));
    
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
   * Handle restart all clients button click
   */
  async handleRestartAllClients() {
    try {
      // Temporarily change button state
      this.restartClientsBtn.textContent = 'Restarting...';
      this.restartClientsBtn.disabled = true;
      
      // Hide the warning immediately
      this.hideRestartWarning();
      
      // Get all client configs
      const clientConfigs = ClientSync.getAllClientConfigs();
      const restartPromises = [];
      const clientsToRestart = [];
      
      // Find clients with valid restart commands
      for (const [clientId, config] of Object.entries(clientConfigs)) {
        if (config.enabled) {
          const restartCommand = ClientSync.getClientRestartCommand(clientId);
          if (restartCommand && !restartCommand.startsWith('#')) {
            clientsToRestart.push(clientId);
            
            // Use existing restart-claude method for Claude
            if (clientId === 'claude' && restartCommand === 'pkill -f "Claude" && sleep 2 && /Applications/Claude.app/Contents/MacOS/Claude') {
              restartPromises.push(
                require('electron').ipcRenderer.invoke('restart-claude')
                  .then(() => ({ clientId, success: true }))
                  .catch(error => ({ clientId, success: false, error: error.message }))
              );
            } else {
              // Execute custom restart command
              restartPromises.push(
                require('electron').ipcRenderer.invoke('execute-restart-command', {
                  clientId,
                  command: restartCommand
                })
                  .then(success => ({ clientId, success }))
                  .catch(error => ({ clientId, success: false, error: error.message }))
              );
            }
          }
        }
      }
      
      if (clientsToRestart.length === 0) {
        alert('No clients with valid restart commands found.');
        this.restartClientsBtn.textContent = 'Restart Clients';
        this.restartClientsBtn.disabled = false;
        return;
      }
      
      // Execute all restart commands
      const results = await Promise.allSettled(restartPromises);
      
      // Process results
      let successCount = 0;
      let failedClients = [];
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled' && result.value.success) {
          successCount++;
        } else {
          const clientId = clientsToRestart[index];
          const clientName = ClientDetector.getClientConfig(clientId)?.name || clientId;
          failedClients.push(clientName);
        }
      });
      
      // Show results
      if (successCount === clientsToRestart.length) {
        alert(`Successfully restarted ${successCount} client(s).`);
      } else if (successCount > 0) {
        alert(`Restarted ${successCount} of ${clientsToRestart.length} clients. Failed: ${failedClients.join(', ')}`);
      } else {
        alert(`Failed to restart all clients: ${failedClients.join(', ')}`);
      }
      
      // Reset button state
      setTimeout(() => {
        this.restartClientsBtn.textContent = 'Restart Clients';
        this.restartClientsBtn.disabled = false;
      }, 500);
    } catch (error) {
      console.error('Failed to restart clients:', error);
      alert('Failed to restart clients. Please restart them manually.');
      this.restartClientsBtn.textContent = 'Restart Clients';
      this.restartClientsBtn.disabled = false;
    }
  }
}

// Create and export a singleton instance
const notifications = new Notifications();
export default notifications;
