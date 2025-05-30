/**
 * @file ui.js
 * @description UI creation and rendering
 */

export class ServerListUI {
  constructor(core, storage) {
    this.core = core;
    this.storage = storage;
    this.events = null;
  }

  /**
   * Set events handler
   */
  setEvents(events) {
    this.events = events;
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
    if (this.events) {
      this.events.wireEventHandlers();
    }
  }

  /**
   * Set view mode (detailed or compact)
   */
  setViewMode(mode) {
    this.core.viewMode = mode;
    document.querySelectorAll('.view-btn').forEach(btn => btn.classList.remove('active'));
    document.getElementById(`${mode}-view`).classList.add('active');
    document.querySelector('table').className = `server-table ${mode}-view`;
    this.refreshEnhancedList();
  }

  /**
   * Refresh the enhanced server list
   */
  refreshEnhancedList() {
    const serverListElement = document.getElementById('server-list');
    if (!serverListElement) return;

    const allServers = this.core.getAllServers();
    const filteredServers = this.core.filterServers(allServers);
    const sortedServers = this.core.sortServers(filteredServers);
    const groupedServers = this.core.groupServers(sortedServers);

    // Update stats
    this.updateStats(allServers, filteredServers);

    // Clear current list
    serverListElement.innerHTML = '';

    // Render grouped servers
    Object.entries(groupedServers).forEach(([groupName, servers]) => {
      if (this.core.groupBy !== 'none') {
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
      const paginatedServers = this.core.paginateServers(servers);
      paginatedServers.forEach(server => {
        const row = this.createServerRow(server);
        serverListElement.appendChild(row);
      });
    });

    // Update pagination
    this.updatePagination();

    // Wire event handlers for new rows
    if (this.events) {
      this.events.wireServerRowHandlers();
    }
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

    if (this.core.viewMode === 'compact') {
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
        <td class="server-command-compact">${this.core.truncateCommand(server.config.command)}</td>
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
    const totalPages = this.core.getTotalPages();
    
    document.getElementById('page-info').textContent = `Page ${this.core.currentPage} of ${totalPages}`;
    document.getElementById('prev-page').disabled = this.core.currentPage <= 1;
    document.getElementById('next-page').disabled = this.core.currentPage >= totalPages;
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


}
