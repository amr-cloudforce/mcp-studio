/**
 * Restart Command Handlers
 * Handles restart command functionality for clients
 */
import ClientSync from '../../config/client-sync.js';
import ClientDetector from '../../config/client-detector.js';

/**
 * Handle restart command change
 * @param {string} clientId - Client identifier
 * @param {string} restartCommand - Restart command value
 */
export function handleRestartCommandChange(clientId, restartCommand) {
  ClientSync.setClientRestartCommand(clientId, restartCommand.trim() || null);
}

/**
 * Handle restart client button click
 * @param {string} clientId - Client identifier
 * @param {Object} clientsTab - Reference to the clients tab instance
 */
export async function handleRestartClientClick(clientId, clientsTab) {
  try {
    const restartCommand = ClientSync.getClientRestartCommand(clientId);
    const inputFieldValue = document.getElementById(`restart-command-${clientId}`)?.value;
    
    // Debug logging to identify the issue
    console.log('[DEBUG] Restart command validation:');
    console.log('  - Client ID:', clientId);
    console.log('  - Input field value:', inputFieldValue);
    console.log('  - Stored restart command:', restartCommand);
    console.log('  - Command starts with #:', restartCommand?.startsWith('#'));
    
    // Use input field value as fallback if stored command is invalid
    let finalCommand = restartCommand;
    if (!restartCommand || restartCommand.startsWith('#')) {
      if (inputFieldValue && inputFieldValue.trim() && !inputFieldValue.trim().startsWith('#')) {
        finalCommand = inputFieldValue.trim();
        // Save the valid command from input field
        ClientSync.setClientRestartCommand(clientId, finalCommand);
        console.log('[DEBUG] Using input field value as restart command:', finalCommand);
      } else {
        clientsTab.showNotification('Please enter a valid restart command first', 'warning');
        return;
      }
    }
    
    let success;
    
    // Use existing restart-claude method for Claude (but show the actual command to user)
    if (clientId === 'claude' && finalCommand === 'pkill -f \'Claude\' && sleep 2 && /Applications/Claude.app/Contents/MacOS/Claude') {
      success = await require('electron').ipcRenderer.invoke('restart-claude');
    } else {
      // Execute custom restart command via IPC
      success = await require('electron').ipcRenderer.invoke('execute-restart-command', {
        clientId,
        command: finalCommand
      });
    }
    
    if (success) {
      clientsTab.showNotification(`Successfully restarted ${ClientDetector.getClientConfig(clientId)?.name}`, 'success');
    } else {
      clientsTab.showNotification(`Failed to restart ${ClientDetector.getClientConfig(clientId)?.name}`, 'error');
    }
  } catch (error) {
    clientsTab.showNotification(`Restart failed: ${error.message}`, 'error');
  }
}
