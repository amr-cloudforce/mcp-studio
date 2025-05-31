/**
 * @file core.js
 * @description Core data operations for server list enhancements
 */

import configManager from '../../config/config-manager.js';

export class ServerListCore {
  constructor(storage) {
    this.storage = storage;
    this.searchTerm = '';
    this.activeFilters = {
      status: 'active',
      category: 'all',
      favorites: false
    };
    this.sortBy = 'name';
    this.sortOrder = 'asc';
    this.currentPage = 1;
    this.itemsPerPage = 20;
    this.viewMode = 'compact';
    this.groupBy = 'none';
  }

  /**
   * Get all servers with enhanced data
   */
  getAllServers() {
    const mcpConfig = configManager.getConfig();
    const servers = [];

    // Add active servers
    Object.entries(mcpConfig.mcpServers || {}).forEach(([name, config]) => {
      servers.push({
        name,
        config,
        status: 'active',
        category: this.getServerCategory(name, config),
        isFavorite: this.storage.isFavorite(name),
        lastUsed: this.storage.getLastUsed(name)
      });
    });

    // Add inactive servers
    Object.entries(mcpConfig.inactive || {}).forEach(([name, config]) => {
      servers.push({
        name,
        config,
        status: 'inactive',
        category: this.getServerCategory(name, config),
        isFavorite: this.storage.isFavorite(name),
        lastUsed: this.storage.getLastUsed(name)
      });
    });

    return servers;
  }

  /**
   * Filter servers based on current filters
   */
  filterServers(servers) {
    return servers.filter(server => {
      // Search filter
      if (this.searchTerm) {
        const searchableText = `${server.name} ${server.config.command} ${server.category}`.toLowerCase();
        if (!searchableText.includes(this.searchTerm)) {
          return false;
        }
      }

      // If favorites filter is on, ignore status filter and show all favorite servers
      if (this.activeFilters.favorites) {
        if (!server.isFavorite) {
          return false;
        }
        // Still apply category filter if needed
        if (this.activeFilters.category !== 'all' && server.category !== this.activeFilters.category) {
          return false;
        }
        return true;
      }

      // Status filter (only applied when favorites filter is off)
      if (this.activeFilters.status !== 'all' && server.status !== this.activeFilters.status) {
        return false;
      }

      // Category filter
      if (this.activeFilters.category !== 'all' && server.category !== this.activeFilters.category) {
        return false;
      }

      return true;
    });
  }

  /**
   * Sort servers based on current sort settings
   */
  sortServers(servers) {
    return servers.sort((a, b) => {
      let aVal, bVal;

      switch (this.sortBy) {
        case 'name':
          aVal = a.name.toLowerCase();
          bVal = b.name.toLowerCase();
          break;
        case 'status':
          aVal = a.status;
          bVal = b.status;
          break;
        case 'category':
          aVal = a.category;
          bVal = b.category;
          break;
        case 'lastUsed':
          aVal = a.lastUsed;
          bVal = b.lastUsed;
          break;
        default:
          return 0;
      }

      if (aVal < bVal) return this.sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return this.sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
  }

  /**
   * Group servers based on current grouping setting
   */
  groupServers(servers) {
    if (this.groupBy === 'none') {
      return { 'All Servers': servers };
    }

    const groups = {};
    servers.forEach(server => {
      const groupKey = this.groupBy === 'category' ? server.category : server.status;
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(server);
    });

    return groups;
  }

  /**
   * Get paginated servers
   */
  paginateServers(servers) {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return servers.slice(startIndex, endIndex);
  }

  /**
   * Get total number of pages
   */
  getTotalPages() {
    const allServers = this.getAllServers();
    const filteredServers = this.filterServers(allServers);
    return Math.ceil(filteredServers.length / this.itemsPerPage);
  }

  /**
   * Get server category based on name and config
   */
  getServerCategory(name, config) {
    const command = config.command.toLowerCase();
    const nameLC = name.toLowerCase();

    if (nameLC.includes('filesystem') || command.includes('filesystem')) return 'filesystem';
    if (nameLC.includes('github') || nameLC.includes('git')) return 'development';
    if (nameLC.includes('database') || nameLC.includes('sql') || nameLC.includes('postgres')) return 'database';
    if (nameLC.includes('api') || nameLC.includes('rest') || nameLC.includes('http')) return 'api';
    if (nameLC.includes('ai') || nameLC.includes('ml') || nameLC.includes('openai')) return 'ai';
    
    return 'other';
  }

  /**
   * Truncate command for compact view
   */
  truncateCommand(command, maxLength = 30) {
    return command.length > maxLength ? command.substring(0, maxLength) + '...' : command;
  }

  /**
   * Get list of selected server names
   */
  getSelectedServers() {
    const checkedBoxes = document.querySelectorAll('.server-checkbox:checked');
    return Array.from(checkedBoxes).map(checkbox => {
      return checkbox.closest('tr').dataset.serverName;
    });
  }
}
