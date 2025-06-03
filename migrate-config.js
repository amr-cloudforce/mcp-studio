#!/usr/bin/env node

/*
 * MCP Studio Config Migration Script
 * Migrates server configurations from old Claude config to new MCP Studio config
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Get config paths
function getOldConfigPath() {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'Claude', 'claude_desktop_config.json');
  } else {
    return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'Claude', 'claude_desktop_config.json');
  }
}

function getNewConfigPath() {
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'MCP Studio', 'mcp_studio_config.json');
  } else {
    return path.join(process.env.APPDATA || path.join(os.homedir(), 'AppData', 'Roaming'), 'MCP Studio', 'mcp_studio_config.json');
  }
}

function createBackup(configPath) {
  const backupPath = configPath.replace('.json', '.backup.json');
  try {
    if (fs.existsSync(configPath)) {
      fs.copyFileSync(configPath, backupPath);
      console.log(`✅ Backup created: ${backupPath}`);
      return backupPath;
    }
  } catch (error) {
    console.warn(`⚠️  Failed to create backup: ${error.message}`);
  }
  return null;
}

function readConfig(configPath) {
  try {
    if (!fs.existsSync(configPath)) {
      console.log(`📁 Config file not found: ${configPath}`);
      return null;
    }
    
    const content = fs.readFileSync(configPath, 'utf8');
    const config = JSON.parse(content);
    console.log(`✅ Read config from: ${configPath}`);
    return config;
  } catch (error) {
    console.error(`❌ Failed to read config from ${configPath}: ${error.message}`);
    return null;
  }
}

function writeConfig(configPath, config) {
  try {
    // Ensure directory exists
    const dir = path.dirname(configPath);
    fs.mkdirSync(dir, { recursive: true });
    
    // Write config
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
    console.log(`✅ Wrote config to: ${configPath}`);
    return true;
  } catch (error) {
    console.error(`❌ Failed to write config to ${configPath}: ${error.message}`);
    return false;
  }
}

function migrateConfig() {
  console.log('🚀 Starting MCP Studio config migration...\n');
  
  const oldConfigPath = getOldConfigPath();
  const newConfigPath = getNewConfigPath();
  
  console.log(`📂 Old config: ${oldConfigPath}`);
  console.log(`📂 New config: ${newConfigPath}\n`);
  
  // Read old config
  const oldConfig = readConfig(oldConfigPath);
  if (!oldConfig) {
    console.log('❌ No old config found to migrate');
    return false;
  }
  
  // Read new config (or create default)
  let newConfig = readConfig(newConfigPath);
  if (!newConfig) {
    newConfig = { mcpServers: {} };
    console.log('📝 Creating new config file');
  }
  
  // Create backup of new config
  createBackup(newConfigPath);
  
  // Count servers to migrate
  const activeServers = oldConfig.mcpServers || {};
  const inactiveServers = oldConfig.inactive || {};
  const activeCount = Object.keys(activeServers).length;
  const inactiveCount = Object.keys(inactiveServers).length;
  
  if (activeCount === 0 && inactiveCount === 0) {
    console.log('ℹ️  No servers found in old config to migrate');
    return true;
  }
  
  // Migrate servers
  console.log(`📋 Migrating ${activeCount} active servers and ${inactiveCount} inactive servers...\n`);
  
  // Copy active servers
  if (activeCount > 0) {
    newConfig.mcpServers = { ...newConfig.mcpServers, ...activeServers };
    console.log(`✅ Migrated ${activeCount} active servers:`);
    Object.keys(activeServers).forEach(name => {
      console.log(`   - ${name}`);
    });
  }
  
  // Copy inactive servers
  if (inactiveCount > 0) {
    if (!newConfig.inactive) {
      newConfig.inactive = {};
    }
    newConfig.inactive = { ...newConfig.inactive, ...inactiveServers };
    console.log(`✅ Migrated ${inactiveCount} inactive servers:`);
    Object.keys(inactiveServers).forEach(name => {
      console.log(`   - ${name}`);
    });
  }
  
  // Write new config
  if (writeConfig(newConfigPath, newConfig)) {
    console.log('\n🎉 Migration completed successfully!');
    console.log('🔄 Restart MCP Studio to see your servers');
    return true;
  } else {
    console.log('\n❌ Migration failed');
    return false;
  }
}

// Run migration
if (require.main === module) {
  const success = migrateConfig();
  process.exit(success ? 0 : 1);
}

module.exports = { migrateConfig };
