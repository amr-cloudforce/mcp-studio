/**
 * Backup Management Modal
 * Handles backup viewing and management functionality
 */
import BackupManager from '../../config/backup-manager.js';
import ClientDetector from '../../config/client-detector.js';

/**
 * Show backup management modal
 * @param {string} clientId - Client identifier
 */
export function showBackupManagementModal(clientId) {
  // This would integrate with the existing modal system
  // For now, we'll use a simple alert
  const backups = BackupManager.listBackups(clientId);
  const backupList = backups.map(backup => 
    `${backup.name} (${backup.formattedSize}, ${backup.created.toLocaleString()})`
  ).join('\n');
  
  alert(`Backups for ${ClientDetector.getClientConfig(clientId)?.name}:\n\n${backupList}`);
}
