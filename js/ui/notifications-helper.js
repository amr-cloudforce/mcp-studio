/**
 * Notifications Helper
 * Provides helper functions for showing different types of notifications
 */

/**
 * Show an info notification
 * @param {string} message - The notification message
 * @param {number} duration - The duration in milliseconds (default: 5000)
 */
export function showInfo(message, duration = 5000) {
  showNotification(message, 'info', duration);
}

/**
 * Show a success notification
 * @param {string} message - The notification message
 * @param {number} duration - The duration in milliseconds (default: 5000)
 */
export function showSuccess(message, duration = 5000) {
  showNotification(message, 'success', duration);
}

/**
 * Show a warning notification
 * @param {string} message - The notification message
 * @param {number} duration - The duration in milliseconds (default: 5000)
 */
export function showWarning(message, duration = 5000) {
  showNotification(message, 'warning', duration);
}

/**
 * Show an error notification
 * @param {string} message - The notification message
 * @param {number} duration - The duration in milliseconds (default: 5000)
 */
export function showError(message, duration = 5000) {
  showNotification(message, 'error', duration);
}

/**
 * Show a notification
 * @param {string} message - The notification message
 * @param {string} type - The notification type (info, success, warning, error)
 * @param {number} duration - The duration in milliseconds
 */
function showNotification(message, type, duration) {
  // Create notification container if it doesn't exist
  let container = document.getElementById('notification-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'notification-container';
    container.style.position = 'fixed';
    container.style.top = '20px';
    container.style.right = '20px';
    container.style.zIndex = '9999';
    container.style.display = 'flex';
    container.style.flexDirection = 'column';
    container.style.gap = '10px';
    document.body.appendChild(container);
  }
  
  // Create notification element
  const notification = document.createElement('div');
  notification.className = `notification notification-${type}`;
  notification.style.padding = '10px 15px';
  notification.style.borderRadius = '4px';
  notification.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.1)';
  notification.style.marginBottom = '10px';
  notification.style.animation = 'fadeIn 0.3s ease-in-out';
  notification.style.cursor = 'pointer';
  notification.style.display = 'flex';
  notification.style.alignItems = 'center';
  notification.style.justifyContent = 'space-between';
  
  // Set notification style based on type
  switch (type) {
    case 'info':
      notification.style.backgroundColor = '#d1ecf1';
      notification.style.color = '#0c5460';
      notification.style.borderLeft = '4px solid #0c5460';
      break;
    case 'success':
      notification.style.backgroundColor = '#d4edda';
      notification.style.color = '#155724';
      notification.style.borderLeft = '4px solid #155724';
      break;
    case 'warning':
      notification.style.backgroundColor = '#fff3cd';
      notification.style.color = '#856404';
      notification.style.borderLeft = '4px solid #856404';
      break;
    case 'error':
      notification.style.backgroundColor = '#f8d7da';
      notification.style.color = '#721c24';
      notification.style.borderLeft = '4px solid #721c24';
      break;
  }
  
  // Add message
  const messageElement = document.createElement('span');
  messageElement.textContent = message;
  notification.appendChild(messageElement);
  
  // Add close button
  const closeButton = document.createElement('span');
  closeButton.textContent = '×';
  closeButton.style.marginLeft = '10px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontWeight = 'bold';
  closeButton.style.fontSize = '20px';
  closeButton.addEventListener('click', (e) => {
    e.stopPropagation();
    removeNotification(notification);
  });
  notification.appendChild(closeButton);
  
  // Add click event to dismiss notification
  notification.addEventListener('click', () => {
    removeNotification(notification);
  });
  
  // Add notification to container
  container.appendChild(notification);
  
  // Remove notification after duration
  setTimeout(() => {
    removeNotification(notification);
  }, duration);
  
  // Add CSS animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(-10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes fadeOut {
      from { opacity: 1; transform: translateY(0); }
      to { opacity: 0; transform: translateY(-10px); }
    }
  `;
  document.head.appendChild(style);
}

/**
 * Remove a notification
 * @param {HTMLElement} notification - The notification element
 */
function removeNotification(notification) {
  // Add fadeOut animation
  notification.style.animation = 'fadeOut 0.3s ease-in-out';
  
  // Remove notification after animation
  setTimeout(() => {
    if (notification.parentNode) {
      notification.parentNode.removeChild(notification);
    }
    
    // Remove container if empty
    const container = document.getElementById('notification-container');
    if (container && container.children.length === 0) {
      container.parentNode.removeChild(container);
    }
  }, 300);
}
