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
    console.time('🔍 Get All Servers');
    const allServers = this.core.getAllServers();
    console.timeEnd('🔍 Get All Servers');
    
    console.time('🔍 Filter Servers');
    const filteredServers = this.core.filterServers(allServers);
    console.timeEnd('🔍 Filter Servers');
    
    console.time('🔍 Sort Servers');
    const sortedServers = this.core.sortServers(filteredServers);
    console.timeEnd('🔍 Sort Servers');
    
    console.time('🔍 Group Servers');
    const groupedServers = this.core.groupServers(sortedServers);
    console.timeEnd('🔍 Group Servers');

    console.time('📊 Update Stats');
    // Update stats
    this.controls.updateStats(allServers, filteredServers);
    console.timeEnd('📊 Update Stats');

    console.time('🎨 Render Table');
    // Render table
    this.tableRenderer.renderServerList(groupedServers, this.events);
    console.timeEnd('🎨 Render Table');

    console.time('📄 Update Pagination');
    // Update pagination
    this.controls.updatePagination();
    console.timeEnd('📄 Update Pagination');
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
