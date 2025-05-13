/**
 * View Modes
 * Handles switching between quick and advanced views
 */

/**
 * Initialize view mode toggle
 * @param {HTMLElement} quickSection - Quick view section element
 * @param {HTMLElement} typeSelector - Type selector element
 * @param {NodeList} viewModeRadios - View mode radio buttons
 */
export function initViewModeToggle(quickSection, typeSelector, viewModeRadios) {
  viewModeRadios.forEach(radio => {
    radio.addEventListener('change', () => {
      if (radio.value === 'quick') {
        // Show quick view, hide advanced view
        quickSection.classList.add('active');
        document.querySelectorAll('.form-section:not(#section-quick)').forEach(sec => sec.classList.remove('active'));
        typeSelector.style.display = 'none';
      } else {
        // Show advanced view, hide quick view
        quickSection.classList.remove('active');
        const selectedType = document.querySelector('input[name="type"]:checked').value;
        document.getElementById(`section-${selectedType}`).classList.add('active');
        typeSelector.style.display = 'block';
      }
    });
  });
}

/**
 * Initialize quick view advanced options toggle
 * @param {HTMLElement} quickShowAdvanced - Show advanced checkbox
 * @param {HTMLElement} quickAdvancedOptions - Advanced options container
 */
export function initAdvancedOptionsToggle(quickShowAdvanced, quickAdvancedOptions) {
  quickShowAdvanced.addEventListener('change', () => {
    quickAdvancedOptions.style.display = quickShowAdvanced.checked ? 'block' : 'none';
  });
}

/**
 * Set up the view mode for a server
 * @param {object} config - Server configuration
 * @param {HTMLElement} viewToggleContainer - View toggle container
 * @param {HTMLElement} quickSection - Quick view section
 * @param {HTMLElement} typeSelector - Type selector
 * @param {string} templateId - Template ID
 */
export function setupViewMode(config, viewToggleContainer, quickSection, typeSelector, templateId) {
  if (templateId) {
    // This is a Quick Add server, show the quick view
    viewToggleContainer.style.display = 'block';
    document.querySelector('input[name="view-mode"][value="quick"]').checked = true;
    quickSection.classList.add('active');
    document.querySelectorAll('.form-section:not(#section-quick)').forEach(sec => sec.classList.remove('active'));
    typeSelector.style.display = 'none';
  } else {
    // Hide view toggle for non-Quick Add servers
    viewToggleContainer.style.display = 'none';
    typeSelector.style.display = 'block';
  }
}
