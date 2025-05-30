/**
 * @file controls.js
 * @description UI controls and stats functionality
 */

export class ServerListControls {
  constructor(core, storage) {
    this.core = core;
    this.storage = storage;
  }

  /**
   * Create enhanced header with search and filters
   */
  createEnhancedHeader() {
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
            <option value="active" selected>Active</option>
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
    
    return enhancedHeader;
  }

  /**
   * Create pagination controls
   */
  createPaginationControls() {
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
    
    return paginationContainer;
  }

  /**
   * Update statistics display
   */
  updateStats(allServers, filteredServers) {
    const activeCount = allServers.filter(s => s.status === 'active').length;
    const inactiveCount = allServers.filter(s => s.status === 'inactive').length;

    const totalEl = document.getElementById('total-servers');
    const activeEl = document.getElementById('active-servers');
    const inactiveEl = document.getElementById('inactive-servers');
    const filteredCountEl = document.getElementById('filtered-count');

    if (totalEl) totalEl.textContent = `${allServers.length} servers`;
    if (activeEl) activeEl.textContent = `${activeCount} active`;
    if (inactiveEl) inactiveEl.textContent = `${inactiveCount} inactive`;

    if (filteredCountEl) {
      if (filteredServers.length !== allServers.length) {
        filteredCountEl.textContent = `${filteredServers.length} shown`;
        filteredCountEl.style.display = 'inline';
      } else {
        filteredCountEl.style.display = 'none';
      }
    }
  }

  /**
   * Update pagination controls
   */
  updatePagination() {
    const totalPages = this.core.getTotalPages();
    
    const pageInfo = document.getElementById('page-info');
    const prevBtn = document.getElementById('prev-page');
    const nextBtn = document.getElementById('next-page');

    if (pageInfo) pageInfo.textContent = `Page ${this.core.currentPage} of ${totalPages}`;
    if (prevBtn) prevBtn.disabled = this.core.currentPage <= 1;
    if (nextBtn) nextBtn.disabled = this.core.currentPage >= totalPages;
  }

  /**
   * Update bulk actions visibility and state
   */
  updateBulkActions() {
    const checkboxes = document.querySelectorAll('.server-checkbox');
    const checkedBoxes = document.querySelectorAll('.server-checkbox:checked');
    
    const bulkActions = document.querySelector('.bulk-actions');
    if (bulkActions) {
      if (checkedBoxes.length > 0) {
        bulkActions.style.display = 'flex';
      } else {
        bulkActions.style.display = 'none';
      }
    }

    // Update select all button
    const selectAllBtn = document.getElementById('select-all');
    if (selectAllBtn) {
      if (checkedBoxes.length === checkboxes.length && checkboxes.length > 0) {
        selectAllBtn.textContent = 'Deselect All';
      } else {
        selectAllBtn.textContent = 'Select All';
      }
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
