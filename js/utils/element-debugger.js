/**
 * @file element-debugger.js
 * @description Lightweight element selector for debugging UI issues
 */

class ElementDebugger {
  constructor() {
    this.isActive = false;
    this.originalCursor = '';
    this.init();
  }

  init() {
    // Listen for F12 to toggle debug mode
    document.addEventListener('keydown', (e) => {
      if (e.key === 'F12') {
        e.preventDefault();
        this.toggle();
      }
    });

    // Handle element clicks in debug mode
    document.addEventListener('click', (e) => {
      if (this.isActive) {
        e.preventDefault();
        e.stopPropagation();
        this.selectElement(e.target);
      }
    }, true);

    // Add hover effect in debug mode
    document.addEventListener('mouseover', (e) => {
      if (this.isActive) {
        this.highlightElement(e.target);
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (this.isActive) {
        this.removeHighlight(e.target);
      }
    });
  }

  toggle() {
    this.isActive = !this.isActive;
    
    if (this.isActive) {
      this.originalCursor = document.body.style.cursor;
      document.body.style.cursor = 'crosshair';
      this.showNotification('Debug mode ON - Click any element to copy its info');
    } else {
      document.body.style.cursor = this.originalCursor;
      this.showNotification('Debug mode OFF');
    }
  }

  highlightElement(element) {
    element.style.outline = '2px solid #ff0000';
    element.style.outlineOffset = '2px';
  }

  removeHighlight(element) {
    element.style.outline = '';
    element.style.outlineOffset = '';
  }

  selectElement(element) {
    // Generate element info
    const info = this.getElementInfo(element);
    
    // Copy to clipboard
    this.copyToClipboard(info);
    
    // Flash the element
    this.flashElement(element);
    
    // Turn off debug mode
    this.toggle();
  }

  getElementInfo(element) {
    const tag = element.tagName.toLowerCase();
    const id = element.id ? `#${element.id}` : '';
    const classes = element.className ? `.${element.className.split(' ').join('.')}` : '';
    const text = element.textContent ? element.textContent.trim().substring(0, 50) : '';
    
    // Generate CSS selector
    let selector = tag;
    if (id) selector = id;
    else if (classes) selector = tag + classes;
    
    return `Window: ${document.title}
Page: Main Application
Element: ${tag}${id}${classes}
ID: ${element.id || 'none'}
Classes: ${element.className || 'none'}
Selector: ${selector}
Text: ${text || 'none'}
Parent: ${element.parentElement ? element.parentElement.tagName.toLowerCase() : 'none'}`;
  }

  async copyToClipboard(text) {
    try {
      await navigator.clipboard.writeText(text);
      console.log('Element info copied to clipboard:', text);
    } catch (err) {
      console.error('Failed to copy to clipboard:', err);
      // Fallback for older browsers
      this.fallbackCopyToClipboard(text);
    }
  }

  fallbackCopyToClipboard(text) {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    document.body.appendChild(textArea);
    textArea.select();
    document.execCommand('copy');
    document.body.removeChild(textArea);
  }

  flashElement(element) {
    const originalBg = element.style.backgroundColor;
    element.style.backgroundColor = '#ffff00';
    element.style.transition = 'background-color 0.3s';
    
    setTimeout(() => {
      element.style.backgroundColor = originalBg;
      setTimeout(() => {
        element.style.transition = '';
      }, 300);
    }, 200);
  }

  showNotification(message) {
    // Remove existing notification
    const existing = document.querySelector('.debug-notification');
    if (existing) existing.remove();
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = 'debug-notification';
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: #333;
      color: white;
      padding: 10px 15px;
      border-radius: 5px;
      z-index: 10000;
      font-size: 14px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 3000);
  }
}

// Initialize the debugger
const elementDebugger = new ElementDebugger();

export default elementDebugger;
