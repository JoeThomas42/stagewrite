/**
 * StageWrite Core JavaScript
 * Provides initialization and utility functions
 */

// Define main initialization function
window.initializeApp = function () {
  setupScrollRestoration();

  safeInit(window.initFirstTimePopup, 'First Time Popup');
  safeInit(window.initCustomDropdowns, 'Custom Dropdowns');
  safeInit(window.initAccountDropdown, 'Account Dropdown');
  safeInit(window.initAuthForms, 'Auth Forms');
  safeInit(window.initVenueManagement, 'Venue Management');
  safeInit(window.initMobileMenu, 'Mobile Menu');
  safeInit(window.initDropdownMenus, 'Dropdown Menus');
  safeInit(window.initNotificationSystem, 'Notification System');
  safeInit(window.initThemeSystem, 'Theme System');
  safeInit(window.initStageEditor, 'Stage Editor');
  safeInit(window.initProfileFunctionality, 'Profile Functionality');
  safeInit(window.initCustomNumberInputs, 'Custom Number Inputs');
  safeInit(window.initTooltips, 'Enhanced Tooltips');
  safeInit(window.initPrintAndShare, 'Print and Share Functionality');
  safeInit(window.initTouchInteraction, 'Touch Interaction');
  safeInit(window.initLoginModal, 'Login Modal');

  console.log('Application initialization complete!');
};

/**
 * Main initialization - hook into DOMContentLoaded event
 */
document.addEventListener('DOMContentLoaded', () => {
  try {
    console.log('Initializing application...');
    window.initializeApp();
  } catch (e) {
    console.error('Error during initialization:', e);
  }
});

/**
 * Simple client-side sorting indicator toggle if JS is enabled
 * Cycles through: Ascending -> Descending -> Default Order
 */
document.querySelectorAll('th.sortable').forEach((header) => {
  header.addEventListener('click', function () {
    const column = this.dataset.column;
    const url = new URL(window.location);
    const currentSort = url.searchParams.get('sort');
    const currentOrder = url.searchParams.get('order');

    if (currentSort === column) {
      if (currentOrder === 'asc') {
        url.searchParams.set('sort', column);
        url.searchParams.set('order', 'desc');
      } else if (currentOrder === 'desc') {
        url.searchParams.delete('sort');
        url.searchParams.delete('order');
      } else {
        url.searchParams.set('sort', column);
        url.searchParams.set('order', 'asc');
      }
    } else {
      url.searchParams.set('sort', column);
      url.searchParams.set('order', 'asc');
    }

    document.querySelectorAll('.search-input').forEach((input) => {
      if (input.value) {
        url.searchParams.set(input.name, input.value);
      } else {
        if (url.searchParams.has(input.name)) {
          url.searchParams.delete(input.name);
        }
      }
    });

    window.location.href = url.toString();
  });
});

function confirmAction(form) {
  const action = form.querySelector('button[type="submit"]:focus')?.value;
  let message = "Are you sure you want to perform this action?";
  if (action === 'delete') {
    message = "WARNING: Deleting this user is permanent and cannot be undone. Are you absolutely sure?";
  } else if (action === 'promote') {
    message = "Are you sure you want to promote this user to Admin?";
  } else if (action === 'demote') {
    message = "Are you sure you want to demote this user to Member?";
  } else if (action === 'toggle_status') {
    const currentStatus = json_encode($user_data['is_active']);
    message = `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`;
  }
  return confirm(message);
}

document.querySelectorAll('.actions-section form button[type="submit"]').forEach(button => {
  button.addEventListener('click', function() {
    this.form._clickedButton = this;
  });
});

document.querySelector('.actions-section form').onsubmit = function(event) {
  const actionButton = event.submitter || this._clickedButton;
  const action = actionButton ? actionButton.value : null;
  let message = "Are you sure you want to perform this action?";

  if (action === 'delete') {
    message = "WARNING: Deleting this user is permanent and cannot be undone. Are you absolutely sure?";
  } else if (action === 'promote') {
    message = "Are you sure you want to promote this user to Admin?";
  } else if (action === 'demote') {
    message = "Are you sure you want to demote this user to Member?";
  } else if (action === 'toggle_status') {
    const currentStatus = json_encode($user_data['is_active']);
    message = `Are you sure you want to ${currentStatus ? 'deactivate' : 'activate'} this user?`;
  }

  delete this._clickedButton;

  if (!confirm(message)) {
    event.preventDefault();
    return false;
  }
  return true;
};

/**
 * Initializes and shows the first-time user popup if needed.
 */
window.initFirstTimePopup = function () {
  const popup = document.getElementById('first-time-popup');
  if (!popup) return;

  const popupShownKey = 'stagewrite_popup_shown';

  if (localStorage.getItem(popupShownKey)) {
    console.log('First time popup already shown.');
    return;
  }

  const closePopup = () => {
    closeModal(popup);
    localStorage.setItem(popupShownKey, 'true');
    console.log('First time popup closed and flag set.');
  };

  setTimeout(() => {
    openModal(popup);
    console.log('Showing first time popup.');
  }, 500);

  const closeButtons = popup.querySelectorAll('.modal-close-button');
  closeButtons.forEach((button) => {
    button.removeEventListener('click', closePopup);
    button.addEventListener('click', closePopup);
  });

  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      closePopup();
    }
  });
};

/**
 * Mobile menu system initialization
 */
window.initMobileMenu = function () {
  const mobileMenuButton = document.querySelector('.mobile-menu-toggle');
  const navContainer = document.getElementById('nav-container');

  if (mobileMenuButton && navContainer) {
    mobileMenuButton.addEventListener('click', function () {
      mobileMenuButton.classList.toggle('active');
      navContainer.classList.toggle('active');
      document.body.classList.toggle('menu-open');
    });

    document.addEventListener('click', function (event) {
      if (navContainer.classList.contains('active') && !navContainer.contains(event.target) && !mobileMenuButton.contains(event.target)) {
        mobileMenuButton.classList.remove('active');
        navContainer.classList.remove('active');
        document.body.classList.remove('menu-open');
      }
    });
  }
};

/**
 * Account dropdown system initialization - enhance mobile behavior
 */
window.initAccountDropdown = function () {
  const accountToggle = document.querySelector('.account-toggle');
  const accountMenu = document.querySelector('.account-dropdown .dropdown-menu');

  if (accountToggle && accountMenu) {
    accountToggle.addEventListener('click', function (e) {
      e.stopPropagation();
      accountMenu.classList.toggle('active');
    });

    document.addEventListener('click', function (event) {
      if (!accountToggle.contains(event.target) && !accountMenu.contains(event.target)) {
        accountMenu.classList.remove('active');
      }
    });

    if (document.body.classList.contains('is-mobile-device')) {
      accountMenu.style.maxHeight = '80vh';
      accountMenu.style.overflowY = 'auto';
    }
  }
};

/**
 * Safely initialize a module with error handling
 * @param {Function} initFunction - The initialization function to call
 * @param {string} moduleName - Name of the module for logging
 */
function safeInit(initFunction, moduleName) {
  try {
    if (typeof initFunction === 'function') {
      console.log(`Initializing ${moduleName}...`);
      initFunction();
      console.log(`${moduleName} initialized successfully`);
    } else {
      console.warn(`${moduleName} initialization function not found`);
    }
  } catch (err) {
    console.error(`Error initializing ${moduleName}:`, err);
  }
}

/**
 * Central function to save scroll position before any page reload
 */
function saveScrollPosition() {
  sessionStorage.setItem('scrollPosition', window.pageYOffset);
}

/**
 * Sets up scroll position preservation between page loads
 */
function setupScrollRestoration() {
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  if (sessionStorage.getItem('scrollPosition')) {
    document.documentElement.style.opacity = '0';

    window.scrollTo(0, parseInt(sessionStorage.getItem('scrollPosition')));

    setTimeout(function () {
      document.documentElement.style.opacity = '1';
      sessionStorage.removeItem('scrollPosition');
    }, 10);
  }
}

/**
 * Shows a field-specific error message
 * @param {HTMLElement} field - The form field with the error
 * @param {string} message - The error message to display
 */
function showFieldError(field, message) {
  clearFieldError(field);

  field.classList.add('error-input');

  const errorSpan = document.createElement('span');
  errorSpan.className = 'field-error';
  errorSpan.textContent = message;
  errorSpan.style.display = 'block';

  field.parentNode.insertBefore(errorSpan, field.nextSibling);
}

/**
 * Clears error styling and message for a specific field
 * @param {HTMLElement} field - The form field to clear errors from
 */
function clearFieldError(field) {
  field.classList.remove('error-input');
  const existingError = field.nextElementSibling;
  if (existingError && existingError.className === 'field-error') {
    existingError.remove();
  }
}

/**
 * Clears all error messages from a form
 * @param {HTMLFormElement} form - The form to clear errors from
 */
function clearAllErrors(form) {
  const inputs = form.querySelectorAll('input');
  inputs.forEach((input) => {
    clearFieldError(input);
  });

  const generalError = form.querySelector('.error-message');
  if (generalError) {
    generalError.remove();
  }
}

/**
 * Opens a modal
 * @param {HTMLElement} modal - The modal element to open
 */
function openModal(modal) {
  if (!modal) return;
  modal.classList.remove('hidden');
  modal.classList.add('visible');

  document.getElementById('notification-area').classList.add('modal-open');
}

/**
 * Closes a modal
 * @param {HTMLElement} modal - The modal element to close
 */
function closeModal(modal) {
  if (!modal) return;
  modal.classList.remove('visible');
  modal.classList.add('hidden');

  document.getElementById('notification-area').classList.remove('modal-open');
}

window.safeInit = safeInit;
window.showFieldError = showFieldError;
window.clearFieldError = clearFieldError;
window.clearAllErrors = clearAllErrors;
window.openModal = openModal;
window.closeModal = closeModal;
window.saveScrollPosition = saveScrollPosition;
window.setupScrollRestoration = setupScrollRestoration;
