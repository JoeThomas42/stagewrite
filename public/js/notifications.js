/**
 * StageWrite Notification System
 * Handles displaying notifications in both the main interface and modals
 */

/**
 * Initialize notification system
 */
function initNotificationSystem() {
  document.addEventListener('click', function (event) {
    const modalTrigger = event.target.closest('[data-modal]') || event.target.closest('[data-toggle="modal"]') || event.target.closest('.open-modal');

    if (modalTrigger) {
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
  const notificationAreas = [document.getElementById('notification-area'), ...document.querySelectorAll('.modal-notification-area')].filter((area) => area !== null);

  if (notificationAreas.length === 0) return;

  notificationAreas.forEach((notificationArea) => {
    const existingNotifications = notificationArea.querySelectorAll('.notification');
    existingNotifications.forEach((notification) => {
      notification.classList.remove('visible');
      notification.classList.add('exiting');
      setTimeout(() => {
        if (notification.parentNode === notificationArea) {
          notificationArea.removeChild(notification);
        }
      }, 300);
    });

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;

    notificationArea.appendChild(notification);

    setTimeout(() => {
      notification.classList.add('visible');
    }, 10);

    setTimeout(() => {
      notification.classList.remove('visible');
      notification.classList.add('exiting');

      setTimeout(() => {
        if (notification.parentNode === notificationArea) {
          notificationArea.removeChild(notification);
        }
      }, 300);
    }, duration);
  });
}

window.initNotificationSystem = initNotificationSystem;
window.showNotification = showNotification;
