/**
 * @file storage.js
 * @description LocalStorage operations for server list enhancements
 */

export class StorageManager {
  constructor() {
    this.favorites = new Set(this.loadFavorites());
    this.categories = this.loadCategories();
    this.lastUsed = this.loadLastUsed();
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
   * Toggle favorite status for a server
   */
  toggleFavorite(serverName) {
    if (this.favorites.has(serverName)) {
      this.favorites.delete(serverName);
    } else {
      this.favorites.add(serverName);
    }
    this.saveFavorites();
  }

  /**
   * Update last used timestamp for a server
   */
  updateLastUsed(serverName) {
    this.lastUsed[serverName] = Date.now();
    this.saveLastUsed();
  }

  /**
   * Check if server is favorite
   */
  isFavorite(serverName) {
    return this.favorites.has(serverName);
  }

  /**
   * Get last used timestamp for server
   */
  getLastUsed(serverName) {
    return this.lastUsed[serverName] || 0;
  }
}
