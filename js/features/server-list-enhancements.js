/**
 * @file server-list-enhancements.js
 * @description Enhanced server list functionality with search, filtering, grouping, and pagination.
 * 
 * This module extends the basic server list with advanced features for managing large numbers of servers:
 * - Real-time search across server names, commands, and descriptions
 * - Category-based filtering (filesystem, API, database, etc.)
 * - Status filtering (active/inactive/error states)
 * - Grouping and organization features
 * - Pagination for performance
 * - Bulk operations
 * - Favorites/pinning system
 */

import configManager from '../config/config-manager.js';
import notifications from '../ui/notifications.js';

class ServerListEnhancements {
  constructor() {
    this.searchTerm = '';
    this.activeFilters = {
      status: 'all', // all, active, inactive
      category: 'all', // all, filesystem, api, database, etc.
      favorites: false
    };
    this.sortBy = 'name'; // name, status, lastUsed, category
    this.sortOrder = 'asc'; // asc, desc
    this.currentPage = 1;
    this.itemsPerPage = 20;
    this.viewMode = 'detailed'; // detailed, compact
    this.groupBy = 'none'; // none, category, status
    
    this.favorites = new Set(this.loadFavorites());
    this.categories = this.loadCategories();
    this.lastUsed = this.loadLastUsed();
    
    this.eventListeners = {};
  }

  /**
   * Initialize the enhanced server list
   */
  initialize() {
    this.createEnhancedUI();
    this.wireEventHandlers();
    return this;
  }

  /**
   * Create the enhanced UI elements
   */
  createEnhancedUI() {
    const mainContent = document.querySelector('.main-content');
    const contentHeader = mainContent.querySelector('.content-header');
    
    // Create enhanced header with search and filters
    const enhancedHeader = document.createElement('div');
    enhancedHeader.className = 'enhanced-server-header';
    enhancedHeader.innerHTML = `
      <div class="server-controls">
        <div class="search-container">
          <input type="text" id="server-search" placeholder="Search servers..." class="search-input">
          <i class="fas fa-search search-icon"></i>
        </div>
        
        <div class="filter-container">
          <select id="status-filter" class="filter-select">
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
          
          <select id="category-filter" class="filter-select">
            <option value="all">All Categories</option>
            <option value="filesystem">Filesystem</option>
            <option value="api">API</option>
            <option value="database">Database</option>
            <option value="ai">AI/ML</option>
            <option value="development">Development</option>
            <option value="other">Other</option>
          </select>
          
          <button id="favorites-filter" class="filter-btn" title="Show favorites only">
            <i class="fas fa-star"></i>
          </button>
        </div>
        
        <div class="view-controls">
          <select id="sort-select" class="sort-select">
            <option value="name">Sort by Name</option>
            <option value="status">Sort by Status</option>
            <option value="category">Sort by Category</option>
            <option value="lastUsed">Sort by Last Used</option>
          </select>
          
          <button id="sort-order" class="sort-btn" title="Toggle sort order">
            <i class="fas fa-sort-alpha-down"></i>
          </button>
          
          <select id="group-select" class="group-select">
            <option value="none">No Grouping</option>
            <option value="category">Group by Category</option>
            <option value="status">Group by Status</option>
          </select>
          
          <div class="view-mode-toggle">
            <button id="detailed-view" class="view-btn active" title="Detailed view">
              <i class="fas fa-list"></i>
            </button>
            <button id="compact-view" class="view-btn" title="Compact view">
              <i class="fas fa-th-list"></i>
            </button>
          </div>
        </div>
        
        <div class="bulk-actions" style="display: none;">
          <button id="select-all" class="bulk-btn">Select All</button>
          <button id="bulk-activate" class="bulk-btn">Activate Selected</button>
          <button id="bulk-deactivate" class="bulk-btn">Deactivate Selected</button>
          <button id="bulk-delete" class="bulk-btn btn-danger">Delete Selected</button>
        </div>
      </div>
      
      <div class="server-stats">
        <span id="total-servers">0 servers</span>
        <span id="active-servers">0 active</span>
        <span id="inactive-servers">0 inactive</span>
        <span id="filtered-count" style="display: none;">0 shown</span>
      </div>
    `;
    
    contentHeader.appendChild(enhancedHeader);
    
    // Create pagination
    const paginationContainer = document.createElement('div');
    paginationContainer.className = 'pagination-container';
    paginationContainer.innerHTML = `
      <div class="pagination">
        <button id="prev-page" class="page-btn" disabled>
          <i class="fas fa-chevron-left"></i>
        </button>
        <span id="page-info">Page 1 of 1</span>
        <button id="next-page" class="page-btn" disabled>
          <i class="fas fa-chevron-right"></i>
        </button>
        <select id="items-per-page" class="items-select">
          <option value="10">10 per page</option>
          <option value="20" selected>20 per page</option>
          <option value="50">50 per page</option>
          <option value="100">100 per page</option>
        </select>
      </div>
    `;
    
    // Insert pagination after the table
    const table = mainContent.querySelector('table');
    table.parentNode.insertBefore(paginationContainer, table.nextSibling);
  }

  /**
   * Wire up event handlers for enhanced functionality
   */
  wireEventHandlers() {
    // Search
    document.getElementById('server-search').addEventListener('input', (e) => {
      this.searchTerm = e.target.value.toLowerCase();
      this.currentPage = 1;
      this.refreshEnhancedList();
    });

    // Filters
    document.getElementById('status-filter').addEventListener('change', (e) => {
      this.activeFilters.status = e.target.value;
      this.currentPage = 1;
      this.refreshEnhancedList();
    });

    document.getElementById('category-filter').addEventListener('change', (e) => {
      this.activeFilters.category = e.target.value;
      this.currentPage = 1;
      this.refreshEnhancedList();
    });

    document.getElementById('favorites-filter').addEventListener('click', () => {
      this.activeFilters.favorites = !this.activeFilters.favorites;
      document.getElementById('favorites-filter').classList.toggle('active', this.activeFilters.favorites);
      this.currentPage = 1;
      this.refreshEnhancedList();
    });

    // Sorting
    document.getElementById('sort-select').addEventListener('change', (e) => {
      this.sortBy = e.target.value;
      this.refreshEnhancedList();
    });

    document.getElementById('sort-order').addEventListener('click', () => {
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      const icon = document.querySelector('#sort-order i');
      icon.className = this.sortOrder === 'asc' ? 'fas fa-sort-alpha-down' : 'fas fa-sort-alpha-up';
      this.refreshEnhancedList();
    });

    // Grouping
    document.getElementById('group-select').addEventListener('change', (e) => {
      this.groupBy = e.target.value;
      this.refreshEnhancedList();
    });

    // View mode
    document.getElementById('detailed-view').addEventListener('click', () => {
      this.setViewMode('detailed');
    });

    document.getElementById('compact-view').addEventListener('click', () => {
      this.setViewMode('compact');
    });

    // Pagination
    document.getElementById('prev-page').addEventListener('click', () => {
      if (this.currentPage > 1) {
        this.currentPage--;
        this.refreshEnhancedList();
      }
    });

    document.getElementById('next-page').addEventListener('click', () => {
      const totalPages = this.getTotalPages();
      if (this.currentPage < totalPages) {
        this.currentPage++;
        this.refreshEnhancedList();
      }
    });

    document.getElementById('items-per-page').addEventListener('change', (e) => {
      this.itemsPerPage = parseInt(e.target.value);
      this.currentPage = 1;
      this.refreshEnhancedList();
    });

    // Bulk actions
    document.getElementById('select-all').addEventListener('click', () => {
      this.toggleSelectAll();
    });

    document.getElementById('bulk-activate').addEventListener('click', () => {
      this.bulkActivate();
    });

    document.getElementById('bulk-deactivate').addEventListener('click', () => {
      this.bulkDeactivate();
    });

    document.getElementById('bulk-delete').addEventListener('click', () => {
      this.bulkDelete();
    });
  }

  /**
   * Set view mode (detailed or compact)
   */
  setViewMode(mode) {
    this.viewMode = mode;
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${mode}-view`).classList.add('active');
    document.querySelector('table').className = `server-table ${mode}-view`;
    this.refreshEnhancedList();
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
        isFavorite: this.favorites.has(name),
        lastUsed: this.lastUsed[name] || 0
      });
    });

    // Add inactive servers
    Object.entries(mcpConfig.inactive || {}).forEach(([name, config]) => {
      servers.push({
        name,
        config,
        status: 'inactive',
        category: this.getServerCategory(name, config),
        isFavorite: this.favorites.has(name),
        lastUsed: this.lastUsed[name] || 0
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

      // Status filter
      if (this.activeFilters.status !== 'all' && server.status !== this.activeFilters.status) {
        return false;
      }

      // Category filter
      if (this.activeFilters.category !== 'all' && server.category !== this.activeFilters.category) {
        return false;
      }

      // Favorites filter
      if (this.activeFilters.favorites && !server.isFavorite) {
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
   * Refresh the enhanced server list
   */
  refreshEnhancedList() {
    const serverListElement = document.getElementById('server-list');
    if (!serverListElement) return;

    const allServers = this.getAllServers();
    const filteredServers = this.filterServers(allServers);
    const sortedServers = this.sortServers(filteredServers);
    const groupedServers = this.groupServers(sortedServers);

    // Update stats
    this.updateStats(allServers, filteredServers);

    // Clear current list
    serverListElement.innerHTML = '';

    // Render grouped servers
    Object.entries(groupedServers).forEach(([groupName, servers]) => {
      if (this.groupBy !== 'none') {
        // Add group header
        const groupHeader = document.createElement('tr');
        groupHeader.className = 'group-header';
        groupHeader.innerHTML = `
          <td colspan="4">
            <strong>${groupName} (${servers.length})</strong>
          </td>
        `;
        serverListElement.appendChild(groupHeader);
      }

      // Add paginated servers for this group
      const paginatedServers = this.paginateServers(servers);
      paginatedServers.forEach(server => {
        const row = this.createServerRow(server);
        serverListElement.appendChild(row);
      });
    });

    // Update pagination
    this.updatePagination();

    // Wire event handlers for new rows
    this.wireServerRowHandlers();
  }

  /**
   * Create a server row element
   */
  createServerRow(server) {
    const tr = document.createElement('tr');
    tr.className = `server-row ${server.status}-row`;
    tr.dataset.serverName = server.name;
    tr.dataset.serverStatus = server.status;

    const favoriteIcon = server.isFavorite ? 'fas fa-star favorite' : 'far fa-star';
    const statusBadge = server.status === 'active' ? 'badge-enabled' : 'badge-disabled';

    if (this.viewMode === 'compact') {
      tr.innerHTML = `
        <td>
          <div class="server-info-compact">
            <input type="checkbox" class="server-checkbox">
            <i class="${favoriteIcon}" data-favorite="${server.name}"></i>
            <span class="server-name">${server.name}</span>
            <span class="badge ${statusBadge}">${server.status}</span>
            <span class="server-category">${server.category}</span>
          </div>
        </td>
        <td class="server-command-compact">${this.truncateCommand(server.config.command)}</td>
        <td>
          <div class="action-buttons-compact">
            <button class="btn-icon" data-edit="${server.name}" data-section="${server.status}" title="Edit">
              <i class="fas fa-edit"></i>
            </button>
            <button class="btn-icon" data-delete="${server.name}" data-section="${server.status}" title="Delete">
              <i class="fas fa-trash"></i>
            </button>
            <button class="btn-icon" data-toggle="${server.name}" title="${server.status === 'active' ? 'Deactivate' : 'Activate'}">
              <i class="fas ${server.status === 'active' ? 'fa-pause' : 'fa-play'}"></i>
            </button>
          </div>
        </td>
      `;
    } else {
      tr.innerHTML = `
        <td>
          <div class="server-name-cell">
            <input type="checkbox" class="server-checkbox">
            <i class="${favoriteIcon}" data-favorite="${server.name}"></i>
            <span class="server-name">${server.name}</span>
            <span class="server-category-tag">${server.category}</span>
          </div>
        </td>
        <td class="server-command">${server.config.command}</td>
        <td>
          <span class="badge ${statusBadge}">${server.status}</span>
        </td>
        <td>
          <div class="action-buttons">
            <button class="btn btn-export" data-edit="${server.name}" data-section="${server.status}">Edit</button>
            <button class="btn btn-del" data-delete="${server.name}" data-section="${server.status}">Delete</button>
            <button class="btn ${server.status === 'active' ? 'btn-reveal' : 'btn-add'}" data-toggle="${server.name}">
              ${server.status === 'active' ? 'Deactivate' : 'Activate'}
            </button>
          </div>
        </td>
      `;
    }

    return tr;
  }

  /**
   * Wire event handlers for server rows
   */
  wireServerRowHandlers() {
    // Favorite toggles
    document.querySelectorAll('[data-favorite]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.toggleFavorite(btn.dataset.favorite);
      });
    });

    // Edit buttons
    document.querySelectorAll('[data-edit]').forEach(btn => {
      btn.addEventListener('click', () => {
        this.trigger('edit', { 
          name: btn.dataset.edit, 
          section: btn.dataset.section 
        });
        this.updateLastUsed(btn.dataset.edit);
      });
    });

    // Delete buttons
    document.querySelectorAll('[data-delete]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = btn.dataset.delete;
        const section = btn.dataset.section;
        if (!confirm(`Delete "${name}"?`)) return;
        
        configManager.deleteServer(name, section);
        await configManager.saveConfig();
        notifications.showRestartWarning();
        this.refreshEnhancedList();
      });
    });

    // Toggle status buttons
    document.querySelectorAll('[data-toggle]').forEach(btn => {
      btn.addEventListener('click', async () => {
        const name = btn.dataset.toggle;
        const currentStatus = btn.closest('tr').dataset.serverStatus;
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        
        if (!confirm(`${newStatus === 'active' ? 'Activate' : 'Deactivate'} "${name}"?`)) return;
        
        configManager.moveServer(name, newStatus);
        await configManager.saveConfig();
        notifications.showRestartWarning();
        this.refreshEnhancedList();
      });
    });

    // Checkbox selection
    document.querySelectorAll('.server-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', () => {
        this.updateBulkActions();
      });
    });
  }

  /**
   * Update statistics display
   */
  updateStats(allServers, filteredServers) {
    const activeCount = allServers.filter(s => s.status === 'active').length;
    const inactiveCount = allServers.filter(s => s.status === 'inactive').length;

    document.getElementById('total-servers').textContent = `${allServers.length} servers`;
    document.getElementById('active-servers').textContent = `${activeCount} active`;
    document.getElementById('inactive-servers').textContent = `${inactiveCount} inactive`;

    const filteredCountEl = document.getElementById('filtered-count');
    if (filteredServers.length !== allServers.length) {
      filteredCountEl.textContent = `${filteredServers.length} shown`;
      filteredCountEl.style.display = 'inline';
    } else {
      filteredCountEl.style.display = 'none';
    }
  }

  /**
   * Update pagination controls
   */
  updatePagination() {
    const totalPages = this.getTotalPages();
    
    document.getElementById('page-info').textContent = `Page ${this.currentPage} of ${totalPages}`;
    document.getElementById('prev-page').disabled = this.currentPage <= 1;
    document.getElementById('next-page').disabled = this.currentPage >= totalPages;
  }

  /**
   * Toggle favorite status for a server
   */
  toggleFavorite(serverName) {
    if (this.favorites.has(serverName)) {
      this.favorites.delete(serverName);
    } else {
      this.favorites.add(serverName);
    }
    this.saveFavorites();
    this.refreshEnhancedList();
  }

  /**
   * Update last used timestamp for a server
   */
  updateLastUsed(serverName) {
    this.lastUsed[serverName] = Date.now();
    this.saveLastUsed();
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
   * Update bulk actions visibility and state
   */
  updateBulkActions() {
    const checkboxes = document.querySelectorAll('.server-checkbox');
    const checkedBoxes = document.querySelectorAll('.server-checkbox:checked');
    
    const bulkActions = document.querySelector('.bulk-actions');
    if (checkedBoxes.length > 0) {
      bulkActions.style.display = 'flex';
    } else {
      bulkActions.style.display = 'none';
    }

    // Update select all button
    const selectAllBtn = document.getElementById('select-all');
    if (checkedBoxes.length === checkboxes.length && checkboxes.length > 0) {
      selectAllBtn.textContent = 'Deselect All';
    } else {
      selectAllBtn.textContent = 'Select All';
    }
  }

  /**
   * Toggle select all checkboxes
   */
  toggleSelectAll() {
    const checkboxes = document.querySelectorAll('.server-checkbox');
    const checkedBoxes = document.querySelectorAll('.server-checkbox:checked');
    const shouldCheck = checkedBoxes.length !== checkboxes.length;

    checkboxes.forEach(checkbox => {
      checkbox.checked = shouldCheck;
    });

    this.updateBulkActions();
  }

  /**
   * Bulk activate selected servers
   */
  async bulkActivate() {
    const selectedServers = this.getSelectedServers();
    if (selectedServers.length === 0) return;

    if (!confirm(`Activate ${selectedServers.length} servers?`)) return;

    selectedServers.forEach(serverName => {
      configManager.moveServer(serverName, 'active');
    });

    await configManager.saveConfig();
    notifications.showRestartWarning();
    this.refreshEnhancedList();
  }

  /**
   * Bulk deactivate selected servers
   */
  async bulkDeactivate() {
    const selectedServers = this.getSelectedServers();
    if (selectedServers.length === 0) return;

    if (!confirm(`Deactivate ${selectedServers.length} servers?`)) return;

    selectedServers.forEach(serverName => {
      configManager.moveServer(serverName, 'inactive');
    });

    await configManager.saveConfig();
    notifications.showRestartWarning();
    this.refreshEnhancedList();
  }

  /**
   * Bulk delete selected servers
   */
  async bulkDelete() {
    const selectedServers = this.getSelectedServers();
    if (selectedServers.length === 0) return;

    if (!confirm(`Delete ${selectedServers.length} servers? This action cannot be undone.`)) return;

    selectedServers.forEach(serverName => {
      const row = document.querySelector(`[data-server-name="${serverName}"]`);
      const section = row.dataset.serverStatus;
      configManager.deleteServer(serverName, section);
    });

    await configManager.saveConfig();
    notifications.showRestartWarning();
    this.refreshEnhancedList();
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

  /**
   * Load favorites from localStorage
   */
  loadFavorites() {
    try {
      const saved = localStorage.getItem('mcp-studio-favorites');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save favorites to localStorage
   */
  saveFavorites() {
    localStorage.setItem('mcp-studio-favorites', JSON.stringify([...this.favorites]));
  }

  /**
   * Load categories from localStorage
   */
  loadCategories() {
    try {
      const saved = localStorage.getItem('mcp-studio-categories');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  /**
   * Save categories to localStorage
   */
  saveCategories() {
    localStorage.setItem('mcp-studio-categories', JSON.stringify(this.categories));
  }

  /**
   * Load last used timestamps from localStorage
   */
  loadLastUsed() {
    try {
      const saved = localStorage.getItem('mcp-studio-last-used');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  }

  /**
   * Save last used timestamps to localStorage
   */
  saveLastUsed() {
    localStorage.setItem('mcp-studio-last-used', JSON.stringify(this.lastUsed));
  }

  /**
   * Register event listeners
   */
  on(event, callback) {
    if (!this.eventListeners[event]) {
      this.eventListeners[event] = [];
    }
    this.eventListeners[event].push(callback);
    return this;
  }

  /**
   * Trigger an event
   */
  trigger(event, data) {
    if (this.eventListeners[event]) {
      this.eventListeners[event].forEach(callback => callback(data));
    }
    return this;
  }
}

// Create and export a singleton instance
const serverListEnhancements = new ServerListEnhancements();
export default serverListEnhancements;
