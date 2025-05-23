/**
 * Apify Marketplace Details Module
 * Handles actor detail view
 */

import * as modal from './modal.js';
import * as connector from './connector.js';

/**
 * Show details for an actor
 * @param {Object} item - Actor item to show details for
 */
export function showDetails(item) {
  console.log('[DEBUG] Showing details for actor:', item.actor_id);
  
  // Populate details content
  populateDetailsContent(item);
  
  // Show details view
  modal.showDetailsView();
}

/**
 * Populate the details content
 * @param {Object} item - Actor item
 */
async function populateDetailsContent(item) {
  const detailsContent = document.getElementById('apify-marketplace-details-content');
  if (!detailsContent) return;
  
  // Check if actor is currently selected
  const isSelected = await connector.isActorConfigured(item.actor_id);
  const buttonText = isSelected ? 'Remove from Server' : 'Add to Server';
  const buttonClass = isSelected ? 'btn-danger' : 'btn-primary';
  
  detailsContent.innerHTML = `
    <div class="actor-details">
      <div class="actor-header">
        <h2 class="actor-title">${escapeHtml(item.actor_title || item.actor_name)}</h2>
        <div class="actor-meta">
          <span class="actor-author">by ${escapeHtml(item.actor_username || 'Unknown')}</span>
          <div class="actor-stats">
            <span class="stat-item">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26"/>
              </svg>
              ${item.stars || 0} runs
            </span>
          </div>
        </div>
      </div>
      
      <div class="actor-actions">
        <button id="actor-toggle-btn" class="btn ${buttonClass}" data-actor-id="${item.actor_id}">
          ${buttonText}
        </button>
        <a href="https://apify.com/${item.actor_username}/${item.actor_name}" target="_blank" class="btn btn-secondary">
          View on Apify
        </a>
      </div>
      
      <div class="actor-description">
        <h3>Description</h3>
        <p>${escapeHtml(item.actor_description || item.summary_200_words || 'No description available.')}</p>
      </div>
      
      ${item.actor_stats ? createStatsSection(item.actor_stats) : ''}
      
      ${item.actor_categories && item.actor_categories.length > 0 ? createCategoriesSection(item.actor_categories) : ''}
      
      ${item.actor_pricing ? createPricingSection(item.actor_pricing) : ''}
      
      <div class="actor-technical">
        <h3>Technical Information</h3>
        <div class="technical-info">
          <div class="info-item">
            <strong>Actor ID:</strong>
            <code>${escapeHtml(item.actor_id)}</code>
          </div>
          <div class="info-item">
            <strong>Repository Name:</strong>
            <code>${escapeHtml(item.repo_name || item.actor_name)}</code>
          </div>
        </div>
      </div>
    </div>
  `;
  
  // Add event listener to the toggle button
  const toggleButton = document.getElementById('actor-toggle-btn');
  if (toggleButton) {
    toggleButton.addEventListener('click', async () => {
      await toggleActorFromDetails(item.actor_id, toggleButton);
    });
  }
}

/**
 * Create stats section HTML
 * @param {Object} stats - Actor stats
 * @returns {string} - HTML string
 */
function createStatsSection(stats) {
  const statItems = [];
  
  if (stats.totalRuns !== undefined) {
    statItems.push(`<div class="stat-item"><strong>Total Runs:</strong> ${stats.totalRuns.toLocaleString()}</div>`);
  }
  
  if (stats.totalUsers !== undefined) {
    statItems.push(`<div class="stat-item"><strong>Total Users:</strong> ${stats.totalUsers.toLocaleString()}</div>`);
  }
  
  if (stats.totalMetamorphs !== undefined) {
    statItems.push(`<div class="stat-item"><strong>Total Metamorphs:</strong> ${stats.totalMetamorphs.toLocaleString()}</div>`);
  }
  
  if (statItems.length === 0) return '';
  
  return `
    <div class="actor-stats-section">
      <h3>Statistics</h3>
      <div class="stats-grid">
        ${statItems.join('')}
      </div>
    </div>
  `;
}

/**
 * Create categories section HTML
 * @param {Array} categories - Actor categories
 * @returns {string} - HTML string
 */
function createCategoriesSection(categories) {
  const categoryTags = categories.map(category => 
    `<span class="category-tag">${escapeHtml(category)}</span>`
  ).join('');
  
  return `
    <div class="actor-categories">
      <h3>Categories</h3>
      <div class="categories-list">
        ${categoryTags}
      </div>
    </div>
  `;
}

/**
 * Create pricing section HTML
 * @param {Object} pricing - Actor pricing information
 * @returns {string} - HTML string
 */
function createPricingSection(pricing) {
  if (!pricing || typeof pricing !== 'object') return '';
  
  const pricingItems = [];
  
  if (pricing.type) {
    pricingItems.push(`<div class="pricing-item"><strong>Type:</strong> ${escapeHtml(pricing.type)}</div>`);
  }
  
  if (pricing.perRun !== undefined) {
    pricingItems.push(`<div class="pricing-item"><strong>Per Run:</strong> $${pricing.perRun}</div>`);
  }
  
  if (pricing.perHour !== undefined) {
    pricingItems.push(`<div class="pricing-item"><strong>Per Hour:</strong> $${pricing.perHour}</div>`);
  }
  
  if (pricingItems.length === 0) return '';
  
  return `
    <div class="actor-pricing">
      <h3>Pricing</h3>
      <div class="pricing-info">
        ${pricingItems.join('')}
      </div>
    </div>
  `;
}

/**
 * Toggle actor from details view
 * @param {string} actorId - Actor ID to toggle
 * @param {HTMLElement} button - Button element
 */
async function toggleActorFromDetails(actorId, button) {
  const isSelected = await connector.isActorConfigured(actorId);
  
  try {
    button.disabled = true;
    button.textContent = isSelected ? 'Removing...' : 'Adding...';
    
    let success;
    if (isSelected) {
      success = await connector.removeActor(actorId);
    } else {
      success = await connector.addActor(actorId);
    }
    
    if (success) {
      // Update button state
      const newIsSelected = !isSelected;
      button.textContent = newIsSelected ? 'Remove from Server' : 'Add to Server';
      button.className = newIsSelected ? 'btn btn-danger' : 'btn btn-primary';
      
      // Show success message
      const action = isSelected ? 'removed from' : 'added to';
      console.log(`[DEBUG] Actor ${actorId} ${action} server configuration`);
      
      // Update the main items view if visible
      const itemElement = document.querySelector(`[data-actor-id="${actorId}"]`);
      if (itemElement) {
        const itemButton = itemElement.querySelector('.add-remove-btn');
        if (itemButton) {
          if (newIsSelected) {
            itemElement.classList.add('selected');
            itemButton.textContent = 'Remove';
            itemButton.className = 'btn btn-danger add-remove-btn';
          } else {
            itemElement.classList.remove('selected');
            itemButton.textContent = 'Add';
            itemButton.className = 'btn btn-primary add-remove-btn';
          }
        }
      }
    } else {
      alert(`Failed to ${isSelected ? 'remove' : 'add'} actor. Please try again.`);
      // Reset button text
      button.textContent = isSelected ? 'Remove from Server' : 'Add to Server';
    }
  } catch (error) {
    console.error('Failed to toggle actor:', error);
    alert(`Failed to ${isSelected ? 'remove' : 'add'} actor. Please try again.`);
    // Reset button text
    button.textContent = isSelected ? 'Remove from Server' : 'Add to Server';
  } finally {
    button.disabled = false;
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} - Escaped text
 */
function escapeHtml(text) {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
