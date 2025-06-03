/**
 * Bundles Feature - Main Entry Point
 * Handles bundle management and integration
 */

import * as bundleData from './data.js';
import * as bundleUI from './ui.js';
import * as bundleModal from './modal.js';

/**
 * Initialize the bundles feature
 */
export function initialize() {
  console.log('Initializing Bundles feature...');
  
  // Load bundle data
  bundleData.loadBundles();
  
  // Initialize UI components
  bundleUI.initialize();
  bundleModal.initialize();
  
  console.log('Bundles feature initialized');
}

/**
 * Open bundles view (similar to marketplace modal)
 */
export function openModal() {
  bundleUI.showBundlesView();
}

/**
 * Show bundles view
 */
export function showBundlesView() {
  bundleUI.showBundlesView();
}

/**
 * Get all bundles
 * @returns {Array} Array of bundle objects
 */
export function getAllBundles() {
  return bundleData.getAllBundles();
}

/**
 * Get bundle by ID
 * @param {string} bundleId - Bundle ID
 * @returns {Object|null} Bundle object or null if not found
 */
export function getBundleById(bundleId) {
  return bundleData.getBundleById(bundleId);
}
