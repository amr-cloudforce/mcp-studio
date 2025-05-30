/**
 * @file ui.js
 * @description Main UI coordination for server list enhancements
 */

import { ServerTableRenderer } from './ui/table.js';
import { ServerListControls } from './ui/controls.js';

export class ServerListUI {
  constructor(core, storage) {
    this.core = core;
    this.storage = storage;
    this.events = null;
    this.tableRenderer = new ServerTableRenderer(core, storage);
    this.controls = new ServerListControls(core, storage);
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
    // Check if enhanced UI already exists
    if (document.querySelector('.enhanced-server-header')) {
      return;
    }
    
    const mainContent = document.querySelector('.main-content');
    const contentHeader = mainContent.querySelector('.content-header');
    
    // Create and append enhanced header
    const enhancedHeader = this.controls.createEnhancedHeader();
    contentHeader.appendChild(enhancedHeader);
    
    // Create and insert pagination
    const paginationContainer = this.controls.createPaginationControls();
    const table = mainContent.querySelector('table');
    table.parentNode.insertBefore(paginationContainer, table.nextSibling);
    
    // Create enhanced table
    this.tableRenderer.createEnhancedTable();
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
    const viewBtn = document.getElementById(`${mode}-view`);
    if (viewBtn) viewBtn.classList.add('active');
    
    const table = document.querySelector('table');
    if (table) table.className = `server-table ${mode}-view`;
    
    this.refreshEnhancedList();
  }

  /**
   * Refresh the enhanced server list
   */
  refreshEnhancedList() {
    const allServers = this.core.getAllServers();
    const filteredServers = this.core.filterServers(allServers);
    const sortedServers = this.core.sortServers(filteredServers);
    const groupedServers = this.core.groupServers(sortedServers);

    // Update stats
    this.controls.updateStats(allServers, filteredServers);

    // Render table
    this.tableRenderer.renderServerList(groupedServers, this.events);

    // Update pagination
    this.controls.updatePagination();
  }

  /**
   * Update bulk actions visibility and state
   */
  updateBulkActions() {
    this.controls.updateBulkActions();
  }

  /**
   * Toggle select all checkboxes
   */
  toggleSelectAll() {
    this.controls.toggleSelectAll();
  }
}
