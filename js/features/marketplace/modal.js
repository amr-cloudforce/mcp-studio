/**
 * Marketplace Modal Module
 * Handles the creation and setup of the marketplace modal
 */

// DOM element references
let marketplaceModal;
let marketplaceContent;
let categoriesContainer;
let itemsContainer;
let detailsContainer;
let backButton;
let backToCategoriesButton;

/**
 * Create the marketplace modal
 * @returns {Object} - References to DOM elements
 */
export function createModal() {
  // Create modal element if it doesn't exist
  if (!document.getElementById('marketplace-modal')) {
    const modalHtml = `
      <div id="marketplace-modal" class="modal">
        <div class="modal-content marketplace-modal-content">
          <div class="modal-header">
            <span class="close" id="marketplace-close">&times;</span>
            <span class="modal-esc-hint">Press <span class="kbd">ESC</span> to close</span>
            <h2>MCP Server Marketplace</h2>
          </div>
      <div class="marketplace-container">
        <div class="marketplace-search">
          <input type="text" id="marketplace-search-input" placeholder="Search all tools...">
        </div>
        <div id="marketplace-categories-view">
          <div id="marketplace-categories-container" class="marketplace-categories-container"></div>
        </div>
        <div id="marketplace-items-view" style="display: none;">
          <button id="back-to-categories" class="btn btn-reveal">&larr; Back to categories</button>
          <div class="marketplace-category-title">
            <h3 id="category-title"></h3>
          </div>
          <div id="marketplace-items-container" class="marketplace-items-container"></div>
        </div>
            <div id="marketplace-details-view" style="display: none;">
              <button id="back-to-marketplace" class="btn btn-reveal">&larr; Back to list</button>
              <div id="marketplace-details-container" class="marketplace-details-container"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    
    // Append modal to body
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHtml;
    document.body.appendChild(modalContainer.firstElementChild);
  }
  
  // Cache DOM elements
  marketplaceModal = document.getElementById('marketplace-modal');
  marketplaceContent = document.querySelector('.marketplace-container');
  categoriesContainer = document.getElementById('marketplace-categories-container');
  itemsContainer = document.getElementById('marketplace-items-container');
  detailsContainer = document.getElementById('marketplace-details-container');
  backButton = document.getElementById('back-to-marketplace');
  backToCategoriesButton = document.getElementById('back-to-categories');
  
  return {
    marketplaceModal,
    marketplaceContent,
    categoriesContainer,
    itemsContainer,
    detailsContainer,
    backButton,
    backToCategoriesButton
  };
}

/**
 * Show the marketplace modal
 * @param {HTMLElement} modal - The modal element
 */
export function showModal(modal) {
  window.modalManager.showModal(modal);
}

/**
 * Close the marketplace modal
 */
export function closeModal() {
  window.modalManager.closeActiveModal();
}

/**
 * Show the categories view
 * @param {HTMLElement} categoriesContainer - The categories container element
 */
export function showCategoriesView() {
  document.getElementById('marketplace-categories-view').style.display = 'block';
  document.getElementById('marketplace-items-view').style.display = 'none';
  document.getElementById('marketplace-details-view').style.display = 'none';
  
  // Reset search input and placeholder
  const searchInput = document.getElementById('marketplace-search-input');
  searchInput.value = '';
  searchInput.placeholder = 'Search all tools...';
  
  // Reset category title container style
  const categoryTitleContainer = document.querySelector('.marketplace-category-title');
  categoryTitleContainer.style.borderBottom = '';
  categoryTitleContainer.style.color = '';
  
  // Show all category cards
  categoriesContainer.querySelectorAll('.marketplace-category-card').forEach(category => {
    category.style.display = 'flex';
  });
  
  // Hide any "no results" message
  const noResults = document.getElementById('no-search-results');
  if (noResults) {
    noResults.style.display = 'none';
  }
}

/**
 * Show the items view
 */
export function showItemsView() {
  document.getElementById('marketplace-categories-view').style.display = 'none';
  document.getElementById('marketplace-items-view').style.display = 'block';
  document.getElementById('marketplace-details-view').style.display = 'none';
}

/**
 * Show the details view
 */
export function showDetailsView() {
  document.getElementById('marketplace-categories-view').style.display = 'none';
  document.getElementById('marketplace-items-view').style.display = 'none';
  document.getElementById('marketplace-details-view').style.display = 'block';
}
