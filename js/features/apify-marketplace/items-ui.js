/**
 * Apify Marketplace Items UI Module
 * Handles UI rendering for marketplace items
 */

import * as itemsCore from './items-core.js';

/**
 * Create an item element
 * @param {Object} item - Apify marketplace item
 * @param {boolean} showCategory - Whether to show the category label
 * @returns {HTMLElement} - Item element wrapper
 */
export function createItemElement(item, showCategory = false) {
  // Create wrapper for consistent sizing
  const wrapper = document.createElement('div');
  wrapper.className = 'marketplace-item-wrapper';
  
  // Create the actual item element
  const itemElement = document.createElement('div');
  const isSelected = itemsCore.isActorSelected(item.actor_id);
  const isInstalled = itemsCore.isActorSelected(item.actor_id); // For Apify, selected = installed
  itemElement.className = `marketplace-item ${!item.available ? 'unavailable' : ''} ${isSelected ? 'selected' : ''}`;
  itemElement.dataset.actorId = item.actor_id;
  
  // Create documentation URL for Apify
  const docUrl = `https://apify.com/${item.actor_id}`;
  
  // Create item content
  itemElement.innerHTML = `
    <div class="doc-link" data-url="${docUrl}">
      📖 Documentation ↗️
    </div>
    <div class="item-header">
      <span class="server-type">${item.server_type ? item.server_type.toUpperCase() : 'APIFY'}</span>
      ${showCategory ? `<span class="item-category">${item.category || 'Apify Actors'}</span>` : ''}
    </div>
    <div class="item-title-row">
      <h3>${item.actor_title || item.actor_name || item.repo_name}${isInstalled ? '<span class="installed-badge">✓ Installed</span>' : ''}</h3>
    </div>
    <p>${item.actor_description || item.summary_200_words ? (item.actor_description || item.summary_200_words).substring(0, 100) : 'No description available'}...</p>
    <div class="item-footer">
      <span class="stars">⭐ ${item.stars || 0}</span>
      <span class="author">by ${item.actor_username || 'Unknown'}</span>
    </div>
    <div class="marketplace-item-actions">
      <button  style="display:none" class="btn btn-primary view-details-btn" data-actor="${item.actor_id}">
        Details
      </button>
      <button class="btn ${isSelected ? 'btn-danger' : 'btn-primary'} add-remove-btn" data-actor-id="${item.actor_id}">
        ${isSelected ? 'Remove' : 'Add'}
      </button>
    </div>
    ${!item.available ? `<div class="unavailable-overlay">
      <span class="unavailable-reason">${item.unavailableReason}</span>
    </div>` : ''}
  `;
  
  // Add click event for buttons
  if (item.available) {
    // Details button
    const detailsBtn = itemElement.querySelector('.view-details-btn');
    if (detailsBtn) {
      detailsBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        showItemDetails(item);
      });
    }
    
    // Add/Remove button
    const addRemoveBtn = itemElement.querySelector('.add-remove-btn');
    if (addRemoveBtn) {
      addRemoveBtn.addEventListener('click', async (e) => {
        e.stopPropagation();
        await itemsCore.toggleActor(item.actor_id, addRemoveBtn);
      });
    }
  }
  
  // Add click event for documentation link
  const docLink = itemElement.querySelector('.doc-link');
  if (docLink) {
    docLink.addEventListener('click', (e) => {
      e.stopPropagation();
      const url = docLink.dataset.url;
      if (url) {
        require('electron').ipcRenderer.invoke('open-url', url);
      }
    });
  }
  
  // Add the item to the wrapper
  wrapper.appendChild(itemElement);
  
  return wrapper;
}

/**
 * Show item details
 * @param {Object} item - Apify marketplace item
 */
function showItemDetails(item) {
  // Import the details module dynamically to avoid circular dependencies
  import('./details.js').then(detailsModule => {
    detailsModule.showDetails(item);
  });
}
