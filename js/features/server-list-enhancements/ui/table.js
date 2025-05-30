/**
 * @file table.js
 * @description Table rendering functionality
 */

export class ServerTableRenderer {
  constructor(core, storage) {
    this.core = core;
    this.storage = storage;
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

    // Always use compact view
    tr.innerHTML = `
      <td>
        <div class="server-info-compact">
          <input type="checkbox" class="server-checkbox">
          <i class="${favoriteIcon}" data-favorite="${server.name}"></i>
          <span class="server-name">${server.name}</span>
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
      <td class="status-column">
        <span class="status-dot ${server.status}"></span>
      </td>
    `;

    return tr;
  }

  /**
   * Render server list in table
   */
  renderServerList(groupedServers, events) {
    const serverListElement = document.getElementById('server-list');
    if (!serverListElement) return;

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

    // Wire event handlers for new rows
    if (events) {
      events.wireServerRowHandlers();
    }
  }

  /**
   * Create enhanced table
   */
  createEnhancedTable() {
    const mainContent = document.querySelector('.main-content');
    const table = mainContent.querySelector('table');
    
    // Create enhanced table
    const enhancedTable = document.createElement('table');
    enhancedTable.id = 'enhanced-table';
    enhancedTable.className = 'server-table compact-view';
    enhancedTable.innerHTML = `
      <thead>
        <tr>
          <th>Name & Category</th>
          <th>Command</th>
          <th>Actions</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody id="server-list"></tbody>
    `;
    
    // Replace basic table with enhanced table
    table.parentNode.insertBefore(enhancedTable, table);
    table.style.display = 'none';
  }
}
