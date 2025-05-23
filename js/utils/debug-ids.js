/**
 * Debug ID Utility
 * Adds small, copyable debug IDs to windows and dialogs for debugging
 */

class DebugIdManager {
  constructor() {
    this.addStyles();
  }

  /**
   * Add CSS styles for debug IDs
   */
  addStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .debug-id {
        position: absolute;
        top: 5px;
        right: 5px;
        font-size: 8px;
        color: rgba(255, 255, 255, 0.6);
        background: rgba(0, 0, 0, 0.1);
        padding: 2px 4px;
        border-radius: 2px;
        cursor: pointer;
        user-select: none;
        z-index: 10000;
        font-family: monospace;
        transition: opacity 0.2s;
        opacity: 0.3;
      }
      
      .debug-id:hover {
        opacity: 1;
        background: rgba(0, 0, 0, 0.3);
        color: white;
      }
      
      .debug-id.copied {
        background: rgba(0, 255, 0, 0.3);
        color: white;
      }
    `;
    document.head.appendChild(style);
  }

  /**
   * Add debug ID to an element
   * @param {HTMLElement} element - The element to add debug ID to
   * @param {string} id - The debug ID string
   */
  addDebugId(element, id) {
    // Remove existing debug ID if present
    const existing = element.querySelector('.debug-id');
    if (existing) {
      existing.remove();
    }

    // Create debug ID element
    const debugElement = document.createElement('div');
    debugElement.className = 'debug-id';
    debugElement.textContent = id;
    debugElement.title = `Debug ID: ${id} (click to copy)`;

    // Add click handler to copy ID
    debugElement.addEventListener('click', (e) => {
      e.stopPropagation();
      this.copyToClipboard(id, debugElement);
    });

    // Add to element
    element.style.position = 'relative';
    element.appendChild(debugElement);
  }

  /**
   * Copy text to clipboard
   * @param {string} text - Text to copy
   * @param {HTMLElement} element - Element to show feedback on
   */
  async copyToClipboard(text, element) {
    try {
      await navigator.clipboard.writeText(text);
      
      // Show feedback
      element.classList.add('copied');
      element.textContent = 'COPIED';
      
      setTimeout(() => {
        element.classList.remove('copied');
        element.textContent = text;
      }, 1000);
    } catch (err) {
      console.error('Failed to copy debug ID:', err);
      
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      
      // Show feedback
      element.classList.add('copied');
      element.textContent = 'COPIED';
      
      setTimeout(() => {
        element.classList.remove('copied');
        element.textContent = text;
      }, 1000);
    }
  }
}

// Create and export singleton instance
const debugIdManager = new DebugIdManager();
export default debugIdManager;
