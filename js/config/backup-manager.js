/**
 * Backup Manager
 * Handles automatic backup creation and management for client configurations
 */
const { ipcRenderer } = require('electron');
const fs = require('fs');
const path = require('path');
const os = require('os');

class BackupManager {
  /**
   * Create a backup of a client configuration file
   * @param {string} clientId - Client identifier (claude, librechat, etc.)
   * @param {string} configPath - Path to the configuration file
   * @returns {string} Path to the created backup file
   */
  static createBackup(clientId, configPath) {
    const backupDir = path.join(os.homedir(), '.config', 'mcp-studio', 'backups', clientId);
    
    // Ensure backup directory exists
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Read current config
    const currentConfig = fs.readFileSync(configPath, 'utf8');
    
    // Create backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = path.extname(configPath);
    const backupFilename = `config.backup.${timestamp}${extension}`;
    const backupPath = path.join(backupDir, backupFilename);
    
    // Write backup
    fs.writeFileSync(backupPath, currentConfig);
    
    // Clean old backups (keep only 3 most recent)
    this.cleanOldBackups(backupDir, 3);
    
    return backupPath;
  }

  /**
   * Clean old backups, keeping only the most recent ones
   * @param {string} backupDir - Directory containing backups
   * @param {number} maxBackups - Maximum number of backups to keep
   */
  static cleanOldBackups(backupDir, maxBackups) {
    try {
      const backupFiles = fs.readdirSync(backupDir)
        .filter(file => file.startsWith('config.backup.'))
        .map(file => ({
          name: file,
          path: path.join(backupDir, file),
          mtime: fs.statSync(path.join(backupDir, file)).mtime
        }))
        .sort((a, b) => b.mtime - a.mtime); // Sort by modification time, newest first

      // Remove old backups beyond the limit
      if (backupFiles.length > maxBackups) {
        const filesToDelete = backupFiles.slice(maxBackups);
        filesToDelete.forEach(file => {
          fs.unlinkSync(file.path);
          console.log(`Deleted old backup: ${file.name}`);
        });
      }
    } catch (error) {
      console.warn(`Failed to clean old backups: ${error.message}`);
    }
  }

  /**
   * List all available backups for a client
   * @param {string} clientId - Client identifier
   * @returns {Array} Array of backup information objects
   */
  static listBackups(clientId) {
    const backupDir = path.join(os.homedir(), '.config', 'mcp-studio', 'backups', clientId);
    
    if (!fs.existsSync(backupDir)) {
      return [];
    }

    try {
      return fs.readdirSync(backupDir)
        .filter(file => file.startsWith('config.backup.'))
        .map(file => {
          const filePath = path.join(backupDir, file);
          const stats = fs.statSync(filePath);
          return {
            name: file,
            path: filePath,
            created: stats.mtime,
            size: stats.size,
            formattedSize: this.formatFileSize(stats.size)
          };
        })
        .sort((a, b) => b.created - a.created); // Sort by creation time, newest first
    } catch (error) {
      console.error(`Failed to list backups for ${clientId}:`, error.message);
      return [];
    }
  }

  /**
   * Restore a backup to the target configuration file
   * @param {string} clientId - Client identifier
   * @param {string} backupFilename - Name of the backup file to restore
   * @param {string} targetPath - Path where to restore the backup
   * @returns {boolean} True if restore was successful
   */
  static restoreBackup(clientId, backupFilename, targetPath) {
    try {
      const backupDir = path.join(os.homedir(), '.config', 'mcp-studio', 'backups', clientId);
      const backupPath = path.join(backupDir, backupFilename);

      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupFilename}`);
      }

      // Create backup of current config before restore (safety measure)
      if (fs.existsSync(targetPath)) {
        this.createBackup(clientId, targetPath);
      }

      // Restore from backup
      const backupContent = fs.readFileSync(backupPath, 'utf8');
      
      // Ensure target directory exists
      const targetDir = path.dirname(targetPath);
      fs.mkdirSync(targetDir, { recursive: true });
      
      fs.writeFileSync(targetPath, backupContent);

      return true;
    } catch (error) {
      console.error(`Failed to restore backup ${backupFilename}:`, error.message);
      return false;
    }
  }

  /**
   * Delete a specific backup file
   * @param {string} clientId - Client identifier
   * @param {string} backupFilename - Name of the backup file to delete
   * @returns {boolean} True if deletion was successful
   */
  static deleteBackup(clientId, backupFilename) {
    try {
      const backupDir = path.join(os.homedir(), '.config', 'mcp-studio', 'backups', clientId);
      const backupPath = path.join(backupDir, backupFilename);

      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupFilename}`);
      }

      fs.unlinkSync(backupPath);
      return true;
    } catch (error) {
      console.error(`Failed to delete backup ${backupFilename}:`, error.message);
      return false;
    }
  }

  /**
   * Get the content of a backup file
   * @param {string} clientId - Client identifier
   * @param {string} backupFilename - Name of the backup file
   * @returns {string} Content of the backup file
   */
  static getBackupContent(clientId, backupFilename) {
    try {
      const backupDir = path.join(os.homedir(), '.config', 'mcp-studio', 'backups', clientId);
      const backupPath = path.join(backupDir, backupFilename);

      if (!fs.existsSync(backupPath)) {
        throw new Error(`Backup file not found: ${backupFilename}`);
      }

      return fs.readFileSync(backupPath, 'utf8');
    } catch (error) {
      console.error(`Failed to read backup ${backupFilename}:`, error.message);
      return '';
    }
  }

  /**
   * Get backup count for a client
   * @param {string} clientId - Client identifier
   * @returns {number} Number of available backups
   */
  static getBackupCount(clientId) {
    return this.listBackups(clientId).length;
  }

  /**
   * Format file size in human-readable format
   * @param {number} bytes - File size in bytes
   * @returns {string} Formatted file size
   */
  static formatFileSize(bytes) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  /**
   * Create a manual backup (for UI "Create Manual Backup" button)
   * @param {string} clientId - Client identifier
   * @param {string} configPath - Path to the configuration file
   * @returns {string} Path to the created backup file
   */
  static createManualBackup(clientId, configPath) {
    // Same as createBackup but with a different naming convention
    const backupDir = path.join(os.homedir(), '.config', 'mcp-studio', 'backups', clientId);
    
    // Ensure backup directory exists
    fs.mkdirSync(backupDir, { recursive: true });
    
    // Read current config
    const currentConfig = fs.readFileSync(configPath, 'utf8');
    
    // Create backup filename with timestamp and "manual" prefix
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const extension = path.extname(configPath);
    const backupFilename = `config.backup.manual.${timestamp}${extension}`;
    const backupPath = path.join(backupDir, backupFilename);
    
    // Write backup
    fs.writeFileSync(backupPath, currentConfig);
    
    return backupPath;
  }
}

export default BackupManager;
