/**
 * Marketplace Categories Module
 * Handles category rendering and filtering
 */

import { getCategoryIcon } from './icons.js';
import { getCategoryColor } from './colors.js';
import { showItemsForCategory } from './items.js';

/**
 * Create a category element
 * @param {string} category - Category name
 * @param {Array} items - Items in the category
 * @returns {HTMLElement} - Category element
 */
export function createCategoryElement(category, items) {
  const categoryElement = document.createElement('div');
  categoryElement.className = 'marketplace-category-card';
  categoryElement.dataset.category = category;
  
  // Count available items
  const availableCount = items.filter(item => item.available).length;
  
  // Get icon for category
  const icon = getCategoryIcon(category);
  
  // Get color for category
  const color = getCategoryColor(category);
  
  // Set the color bar at the top
  categoryElement.style.setProperty('--category-color', color);
  
  // Create category content without the icon first
  categoryElement.innerHTML = `
    <div class="category-icon"></div>
    <h3>${category}</h3>
    <div class="category-meta">
      <span class="item-count">${availableCount} available items</span>
    </div>
  `;
  
  // Insert the icon using innerHTML to ensure proper rendering
  const iconContainer = categoryElement.querySelector('.category-icon');
  iconContainer.innerHTML = icon;
  
  // Add click event
  categoryElement.addEventListener('click', () => {
    showItemsForCategory(category);
  });
  
  return categoryElement;
}

/**
 * Populate the marketplace with categories
 * @param {Array} items - Marketplace items
 * @param {HTMLElement} categoriesContainer - The categories container element
 * @param {Function} groupByCategory - Function to group items by category
 */
export function populateCategories(items, categoriesContainer, groupByCategory) {
  // Group items by category
  const categories = groupByCategory(items);
  
  categoriesContainer.innerHTML = '';
  
  if (Object.keys(categories).length === 0) {
    categoriesContainer.innerHTML = '<div class="no-items">No marketplace categories available</div>';
    return;
  }
  
  // Create category cards
  Object.entries(categories).forEach(([category, categoryItems]) => {
    const categoryElement = createCategoryElement(category, categoryItems);
    categoriesContainer.appendChild(categoryElement);
  });
}

/**
 * Filter categories based on search query
 * @param {string} query - Search query
 * @param {Array} allItems - All marketplace items
 * @param {HTMLElement} categoriesContainer - The categories container element
 * @param {Function} showSearchResults - Function to show search results
 */
export function filterCategories(query, allItems, categoriesContainer, showSearchResults) {
  // Normalize query
  query = query.trim().toLowerCase();
  
  // If query is empty, reset and show all categories
  if (!query) {
    // Reset to categories view
    document.getElementById('marketplace-categories-view').style.display = 'block';
    document.getElementById('marketplace-items-view').style.display = 'none';
    
    // Show all category cards
    categoriesContainer.querySelectorAll('.marketplace-category-card').forEach(category => {
      category.style.display = 'flex';
    });
    
    // Hide any "no results" message
    const noResults = document.getElementById('no-search-results');
    if (noResults) {
      noResults.style.display = 'none';
    }
    
    return;
  }
  
  // Search across all items for the current query only
  const matchingItems = allItems.filter(item => {
    const itemName = item.repo_name.toLowerCase();
    const itemDesc = (item.summary_200_words || '').toLowerCase();
    const itemType = (item.server_type || '').toLowerCase();
    const itemCategory = (item.category || 'Uncategorized').toLowerCase();
    
    return itemName.includes(query) || 
           itemDesc.includes(query) || 
           itemType.includes(query) ||
           itemCategory.includes(query);
  });
  
  // For short queries (1-2 characters), just filter categories
  if (query.length < 3) {
    // Reset to categories view
    document.getElementById('marketplace-categories-view').style.display = 'block';
    document.getElementById('marketplace-items-view').style.display = 'none';
    
    // Get unique categories from matching items for this query only
    const matchingCategories = [...new Set(matchingItems.map(item => item.category || 'Uncategorized'))];
    
    // Show/hide categories based on whether they contain matching items
    const categories = categoriesContainer.querySelectorAll('.marketplace-category-card');
    let hasVisibleCategories = false;
    
    categories.forEach(category => {
      const categoryName = category.dataset.category;
      const categoryNameLower = categoryName.toLowerCase();
      
      // Show if category name matches OR if category contains matching items
      if (categoryNameLower.includes(query) || matchingCategories.includes(categoryName)) {
        category.style.display = 'flex';
        hasVisibleCategories = true;
      } else {
        category.style.display = 'none';
      }
    });
    
    // Show "no results" message if no categories match
    if (!hasVisibleCategories) {
      if (!document.getElementById('no-search-results')) {
        const noResults = document.createElement('div');
        noResults.id = 'no-search-results';
        noResults.className = 'no-items';
        noResults.textContent = `No results found for "${query}"`;
        categoriesContainer.appendChild(noResults);
      } else {
        document.getElementById('no-search-results').textContent = `No results found for "${query}"`;
        document.getElementById('no-search-results').style.display = 'block';
      }
    } else {
      // Hide any "no results" message
      const noResults = document.getElementById('no-search-results');
      if (noResults) {
        noResults.style.display = 'none';
      }
    }
    
    return;
  }
  
  // For longer queries (3+ characters), show matching items directly
  if (matchingItems.length > 0) {
    showSearchResults(matchingItems, query);
  } else {
    // No matching items, reset to categories view with no results
    document.getElementById('marketplace-categories-view').style.display = 'block';
    document.getElementById('marketplace-items-view').style.display = 'none';
    
    // Hide all categories since no items match
    categoriesContainer.querySelectorAll('.marketplace-category-card').forEach(category => {
      category.style.display = 'none';
    });
    
    // Show "no results" message
    if (!document.getElementById('no-search-results')) {
      const noResults = document.createElement('div');
      noResults.id = 'no-search-results';
      noResults.className = 'no-items';
      noResults.textContent = `No results found for "${query}"`;
      categoriesContainer.appendChild(noResults);
    } else {
      document.getElementById('no-search-results').textContent = `No results found for "${query}"`;
      document.getElementById('no-search-results').style.display = 'block';
    }
  }
}
