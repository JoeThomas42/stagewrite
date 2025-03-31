/**
 * StageWrite Notification System
 * Handles displaying notifications in both the main interface and modals
 */

/**
 * Initialize notification system
 */
function initNotificationSystem() {
  // Add event listener for modal opening
  document.addEventListener('click', function(event) {
    // Check if the clicked element or its parent opens a modal
    const modalTrigger = event.target.closest('[data-modal]') || 
                         event.target.closest('[data-toggle="modal"]') || 
                         event.target.closest('.open-modal');
                         
    if (modalTrigger) {
      // Re-initialize modal notification areas to ensure they exist
      setTimeout(initModalNotificationAreas, 100);
    }
  });
}

/**
 * Show a notification message in all notification areas
 * @param {string} message - Message to display
 * @param {string} type - Type of notification (success, error, info, warning)
 * @param {number} duration - Time in milliseconds to show notification
 */
function showNotification(message, type = 'info', duration = 3000) {
  // Get all notification areas (main and modal ones)
  const notificationAreas = [
    document.getElementById('notification-area'),
    ...document.querySelectorAll('.modal-notification-area')
  ].filter(area => area !== null);
  
  if (notificationAreas.length === 0) return;
  
  // Display notification in all areas
  notificationAreas.forEach(notificationArea => {
    // Remove any existing notifications in this area
    const existingNotifications = notificationArea.querySelectorAll('.notification');
    existingNotifications.forEach(notification => {
      notification.classList.remove('visible');
      notification.classList.add('exiting');
      setTimeout(() => {
        if (notification.parentNode === notificationArea) {
          notificationArea.removeChild(notification);
        }
      }, 300);
    });
    
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Add to DOM
    notificationArea.appendChild(notification);
    
    // Trigger animation after a brief delay
    setTimeout(() => {
      notification.classList.add('visible');
    }, 10);
    
    // Remove after duration
    setTimeout(() => {
      notification.classList.remove('visible');
      notification.classList.add('exiting');
      
      // Remove from DOM after animation completes
      setTimeout(() => {
        if (notification.parentNode === notificationArea) {
          notificationArea.removeChild(notification);
        }
      }, 300);
    }, duration);
  });
}

// ------------------- Make notification functions available globally ---------------------
window.initNotificationSystem = initNotificationSystem;
window.showNotification = showNotification;
