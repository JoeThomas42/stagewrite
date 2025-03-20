/**
 * StageWrite Notification System
 * Handles displaying notifications in both the main interface and modals
 */

/**
 * Initialize notification system
 */
function initNotificationSystem() {
  // Find the control buttons area for default notifications
  const controlButtons = document.getElementById('control-buttons');
  if (!controlButtons) return;
  
  // Check if default notification area exists
  let notificationArea = document.getElementById('notification-area');
  
  // If it doesn't exist or isn't in the right place, create/move it
  if (!notificationArea || notificationArea.parentNode !== controlButtons) {
    // Remove old notification area if it exists elsewhere
    if (notificationArea) {
      notificationArea.parentNode.removeChild(notificationArea);
    }
    
    // Create new notification area inside control buttons
    notificationArea = document.createElement('div');
    notificationArea.id = 'notification-area';
    notificationArea.className = 'notification-area';
    
    // Add it before the Clear Plot button if it exists, otherwise at the end
    const clearStageBtn = controlButtons.querySelector('#clear-plot');
    if (clearStageBtn) {
      clearStageBtn.insertAdjacentElement('beforebegin', notificationArea);
    } else {
      controlButtons.appendChild(notificationArea);
    }
  }
  
  // Initialize modal notification areas
  initModalNotificationAreas();
}

/**
 * Initialize notification areas in all modals
 */
function initModalNotificationAreas() {
  const modals = document.querySelectorAll('.modal');
  
  modals.forEach(modal => {
    const modalContent = modal.querySelector('.modal-content');
    if (!modalContent) return;
    
    // Check if this modal already has a notification area
    let modalNotificationArea = modalContent.querySelector('.modal-notification-area');
    
    if (!modalNotificationArea) {
      // Create the notification area
      modalNotificationArea = document.createElement('div');
      modalNotificationArea.className = 'modal-notification-area';
      
      // Add it to the modal content
      modalContent.appendChild(modalNotificationArea);
    }
  });
  
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
window.initModalNotificationAreas = initModalNotificationAreas;
window.showNotification = showNotification;
