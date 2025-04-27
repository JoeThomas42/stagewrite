/**
 * StageWrite User Management Module
 * Handles user removal, status toggling, promotion, and demotion
 */

/**
 * Initializes user management functionality
 */
function initUserManagement() {
  initUserRemoval();
  initStatusToggle();
  initUserPromotion();
  initUserDemotion();
}

/**
 * Sets up user removal functionality
 */
function initUserRemoval() {
  document.querySelectorAll('.remove-user').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const userName = link.getAttribute('data-user-name');
      if (confirm(`Are you sure you want to remove ${userName}?\nThis action cannot be undone.`)) {
        const userId = link.getAttribute('data-user-id');
        fetch('/handlers/delete_user.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `user_id=${encodeURIComponent(userId)}`,
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              link.closest('tr').remove();
            } else {
              alert(data.error || 'An error occurred while trying to remove the user');
            }
          })
          .catch((err) => {
            console.error('Error:', err);
            alert('An unexpected error occurred');
          });
      }
    });
  });
}

/**
 * Sets up user status toggle functionality
 */
function initStatusToggle() {
  document.querySelectorAll('.toggle-status').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      const userId = link.getAttribute('data-user-id');

      fetch('/handlers/toggle_status.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `user_id=${encodeURIComponent(userId)}`,
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            const row = link.closest('tr');
            const statusCell = row.querySelector('td:nth-child(4)');
            statusCell.textContent = data.status_text;
            link.setAttribute('data-status', data.is_active);
          } else {
            alert(data.error || 'An error occurred while toggling user status');
          }
        })
        .catch((err) => {
          console.error('Error:', err);
          alert('An unexpected error occurred');
        });
    });
  });
}

/**
 * Saves the current scroll position to session storage.
 * This is useful for restoring the scroll position after a page reload.
 */
function saveScrollPosition() {
  sessionStorage.setItem('scrollPosition', window.scrollY);
}

/**
 * Sets up user promotion functionality
 */
function initUserPromotion() {
  document.querySelectorAll('.promote-user').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const userName = link.getAttribute('data-user-name');
      if (confirm(`Are you sure you want to promote ${userName} to Admin?\nThis will give them administrative privileges.`)) {
        saveScrollPosition();

        const userId = link.getAttribute('data-user-id');
        fetch('/handlers/promote_user.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `user_id=${encodeURIComponent(userId)}`,
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              alert(`${userName} has been promoted to Admin successfully.`);
              window.location.reload();
            } else {
              alert(data.error || 'An error occurred while trying to promote the user');
            }
          })
          .catch((err) => {
            console.error('Error:', err);
            alert('An unexpected error occurred');
          });
      }
    });
  });
}

/**
 * Sets up user demotion functionality
 */
function initUserDemotion() {
  document.querySelectorAll('.demote-user').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const userName = link.getAttribute('data-user-name');
      if (confirm(`Are you sure you want to demote ${userName} to Member?\nThis will remove their administrative privileges.`)) {
        saveScrollPosition();

        const userId = link.getAttribute('data-user-id');
        fetch('/handlers/demote_user.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `user_id=${encodeURIComponent(userId)}`,
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              alert(`${userName} has been demoted to Member successfully.`);
              window.location.reload();
            } else {
              alert(data.error || 'An error occurred while trying to demote the user');
            }
          })
          .catch((err) => {
            console.error('Error:', err);
            alert('An unexpected error occurred');
          });
      }
    });
  });
}

window.initUserManagement = initUserManagement;
window.initUserRemoval = initUserRemoval;
window.initStatusToggle = initStatusToggle;
window.initUserPromotion = initUserPromotion;
window.initUserDemotion = initUserDemotion;
