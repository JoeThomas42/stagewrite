/**
 * StageWrite Core JavaScript
 * Provides initialization and utility functions
 */

// Define main initialization function
window.initializeApp = function() {
  setupScrollRestoration();
  
  // Initialize each feature independently with error handling
  safeInit(window.initAuthForms, "Auth Forms");
  safeInit(window.initUserManagement, "User Management");
  safeInit(window.initVenueManagement, "Venue Management");  
  safeInit(window.initSortableTables, "Sortable Tables");
  safeInit(window.initTableFilters, "Table Filters");
  safeInit(window.initMobileMenu, "Mobile Menu");
  safeInit(window.initDropdownMenus, "Dropdown Menus");
  safeInit(window.initTableInteractions, "Table Interactions");
  safeInit(window.initNotificationSystem, "Notification System");
  safeInit(window.initThemeSystem, "Theme System");
  safeInit(window.initStageEditor, "Stage Editor");
  safeInit(window.initCustomDropdowns, "Custom Dropdowns");
  safeInit(window.initCityAutocomplete, "City Autocompletion");
  safeInit(window.initZipCodeAutoComplete, "Zip Autocompletion");
  safeInit(window.initProfileFunctionality, "Profile Functionality");
  safeInit(window.initCustomNumberInputs, "Custom Number Inputs");

  console.log("Application initialization complete!");
};

/**
 * Main initialization - hook into DOMContentLoaded event
 */
document.addEventListener("DOMContentLoaded", () => {
  try {
    console.log("Initializing application...");
    window.initializeApp();
  } catch (e) {
    console.error("Error during initialization:", e);
  }
});

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
    // Continue with other initializations despite this error
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
  // Try to prevent browser's automatic scroll restoration
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // Check if we need to restore scroll position
  if (sessionStorage.getItem('scrollPosition')) {
    // Prevent the flash of content at the top by setting position immediately
    document.documentElement.style.opacity = '0';
    
    // Restore scroll position right away
    window.scrollTo(0, parseInt(sessionStorage.getItem('scrollPosition')));
    
    // Fade the content back in
    setTimeout(function() {
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
  // Remove any previous error
  clearFieldError(field);
  
  // Add error class to the input
  field.classList.add('error-input');
  
  // Create and add error message
  const errorSpan = document.createElement('span');
  errorSpan.className = 'field-error';
  errorSpan.textContent = message;
  errorSpan.style.color = 'red';
  errorSpan.style.fontSize = '12px';
  errorSpan.style.display = 'block';
  errorSpan.style.marginTop = '-10px';
  errorSpan.style.marginBottom = '10px';
  
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
  inputs.forEach(input => {
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

// -------------------- Make core utilities available globally ----------------------
window.safeInit = safeInit;
window.showFieldError = showFieldError;
window.clearFieldError = clearFieldError;
window.clearAllErrors = clearAllErrors;
window.openModal = openModal;
window.closeModal = closeModal;
window.saveScrollPosition = saveScrollPosition;
window.setupScrollRestoration = setupScrollRestoration;
