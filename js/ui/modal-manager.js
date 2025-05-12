/**
 * Modal Manager
 * Handles showing and hiding modals
 */

class ModalManager {
  constructor() {
    this.activeModal = null;
    
    // Set up global escape key handler
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeActiveModal();
      }
    });
    
    // Set up close button handlers
    document.querySelectorAll('.modal .close').forEach(button => {
      button.addEventListener('click', () => this.closeActiveModal());
    });
  }

  /**
   * Show a modal
   * @param {HTMLElement} modal - The modal element to show
   */
  showModal(modal) {
    if (this.activeModal) {
      this.closeActiveModal();
    }
    
    this.activeModal = modal;
    modal.classList.add('open');
    
    return this;
  }

  /**
   * Close the active modal
   */
  closeActiveModal() {
    if (this.activeModal) {
      this.activeModal.classList.remove('open');
      this.activeModal = null;
      return true;
    }
    return false;
  }

  /**
   * Get the active modal
   */
  getActiveModal() {
    return this.activeModal;
  }

  /**
   * Check if a modal is active
   */
  isModalActive() {
    return this.activeModal !== null;
  }
}

// Create and export a singleton instance
const modalManager = new ModalManager();
export default modalManager;
