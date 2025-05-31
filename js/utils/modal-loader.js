/**
 * Modal Loader
 * Dynamically loads modal HTML files into the main document
 */

class ModalLoader {
  constructor() {
    this.modalsLoaded = false;
  }

  /**
   * Load all modal HTML files
   */
  async loadModals() {
    if (this.modalsLoaded) return;

    const modalFiles = [
      'html/modals/paste-modal.html',
      'html/modals/server-modal.html',
      'html/modals/json-modal.html',
      'html/modals/quick-add-modal.html',
      'html/modals/about-modal.html'
    ];

    try {
      for (const file of modalFiles) {
        const response = await fetch(file);
        if (!response.ok) {
          throw new Error(`Failed to load ${file}: ${response.statusText}`);
        }
        const html = await response.text();
        
        // Create a temporary container to parse the HTML
        const temp = document.createElement('div');
        temp.innerHTML = html;
        
        // Append the modal to the document body
        while (temp.firstChild) {
          document.body.appendChild(temp.firstChild);
        }
      }
      
      this.modalsLoaded = true;
      console.log('All modals loaded successfully');
    } catch (error) {
      console.error('Error loading modals:', error);
      throw error;
    }
  }
}

// Create and export a singleton instance
const modalLoader = new ModalLoader();
export default modalLoader;
