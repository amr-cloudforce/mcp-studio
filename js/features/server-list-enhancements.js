/**
 * @file server-list-enhancements.js
 * @description Main entry point for server list enhancements
 */

import { StorageManager } from './server-list-enhancements/storage.js';
import { ServerListCore } from './server-list-enhancements/core.js';
import { ServerListUI } from './server-list-enhancements/ui.js';
import { ServerListEvents } from './server-list-enhancements/events.js';

class ServerListEnhancements {
  constructor() {
    this.storage = new StorageManager();
    this.core = new ServerListCore(this.storage);
    this.ui = new ServerListUI(this.core, this.storage);
    this.events = new ServerListEvents(this.core, this.storage, this.ui);
    this.ui.setEvents(this.events);
  }

  /**
   * Initialize the enhanced server list
   */
  initialize() {
    console.time('⚡ Enhanced UI Creation');
    this.ui.createEnhancedUI();
    console.timeEnd('⚡ Enhanced UI Creation');
    
    console.time('⚡ Enhanced Event Handlers');
    this.ui.wireEventHandlers();
    console.timeEnd('⚡ Enhanced Event Handlers');
    return this;
  }

  /**
   * Register event listeners
   */
  on(event, callback) {
    return this.events.on(event, callback);
  }

  /**
   * Refresh the enhanced server list
   */
  refreshEnhancedList() {
    console.time('🎯 Enhanced List UI Refresh');
    const result = this.ui.refreshEnhancedList();
    console.timeEnd('🎯 Enhanced List UI Refresh');
    return result;
  }
}

// Create and export a singleton instance
const serverListEnhancements = new ServerListEnhancements();
export default serverListEnhancements;
