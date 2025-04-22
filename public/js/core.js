/**
 * StageWrite Core JavaScript
 * Provides initialization and utility functions
 */

// Define main initialization function
window.initializeApp = function() {
  setupScrollRestoration();
  
  // Initialize each feature independently with error handling
  safeInit(window.initCustomDropdowns, "Custom Dropdowns");
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
  safeInit(window.initProfileFunctionality, "Profile Functionality");
  safeInit(window.initCustomNumberInputs, "Custom Number Inputs");
  safeInit(window.initTooltips, "Enhanced Tooltips");
  safeInit(window.initPrintAndShare, "Print and Share Functionality");
  safeInit(window.initLoginModal, "Login Modal");
  
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

// -------------------- Login Modal Functionality ----------------------

/**
 * Initialize Login Modal functionality
 */
function initLoginModal() {
  // Get DOM elements
  const loginModalBtn = document.getElementById('login-modal-btn');
  const loginModal = document.getElementById('login-modal');
  const closeButton = loginModal ? loginModal.querySelector('.close-button') : null;
  const switchToSignupBtn = document.getElementById('switch-to-signup');
  const switchToLoginBtn = document.getElementById('switch-to-login');
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  
  // Skip if elements not found (e.g., user is already logged in)
  if (!loginModalBtn || !loginModal) return;

  // Open modal when login button is clicked
  loginModalBtn.addEventListener('click', () => {
    openModal(loginModal);
  });

  // Close modal when close button is clicked
  if (closeButton) {
    closeButton.addEventListener('click', () => {
      closeModal(loginModal);
    });
  }

  // Close modal when clicking outside of it
  loginModal.addEventListener('click', (event) => {
    if (event.target === loginModal) {
      closeModal(loginModal);
    }
  });

  // Toggle between login and signup forms
  if (switchToSignupBtn && switchToLoginBtn) {
    switchToSignupBtn.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
    });

    switchToLoginBtn.addEventListener('click', (e) => {
      e.preventDefault();
      signupForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
    });
  }

  // Handle form submissions with AJAX
  setupFormSubmission(loginForm, '/handlers/login_handler.php');
  setupFormSubmission(signupForm, '/handlers/signup_handler.php');
}

/**
 * Set up AJAX form submission
 * @param {HTMLFormElement} form - The form to set up
 * @param {string} endpoint - The API endpoint for form submission
 */
function setupFormSubmission(form, endpoint) {
  if (!form) return;

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    
    // Clear previous errors
    clearAllErrors(form);

    // Get form data
    const formData = new FormData(form);
    
    // Show loading indicator
    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';

    // Send form data to the server
    fetch(endpoint, {
      method: 'POST',
      body: formData,
    })
    .then(response => response.json())
    .then(data => {
      // Reset button
      submitButton.disabled = false;
      submitButton.textContent = originalText;
      
      if (data.success) {
        // Show success notification
        showNotification('Login successful!', 'success');
        
        // Reload page after successful login (to update UI with user info)
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else if (data.errors) {
        // Show field-specific errors
        Object.keys(data.errors).forEach(field => {
          const fieldElement = form.querySelector(`[name="${field}"]`);
          if (fieldElement) {
            let errorMessage = '';
            
            switch(data.errors[field]) {
              case 'required':
                errorMessage = 'This field is required';
                break;
              case 'invalid':
                errorMessage = 'Please enter a valid value';
                break;
              case 'invalid_credentials':
                errorMessage = 'Invalid email or password';
                break;
              case 'mismatch':
                errorMessage = 'Passwords do not match';
                break;
              case 'exists':
                errorMessage = 'Email already exists';
                break;
              default:
                errorMessage = 'There was an error with this field';
            }
            
            showFieldError(fieldElement, errorMessage);
          }
        });
        
        // Show general error message if needed
        if (data.errors.general) {
          const errorDiv = document.createElement('div');
          errorDiv.className = 'error-message';
          errorDiv.textContent = 
            data.errors.general === 'database_error' 
              ? 'Database error. Please try again later.' 
              : 'An error occurred. Please try again.';
          
          form.prepend(errorDiv);
        }
      }
    })
    .catch(error => {
      // Reset button
      submitButton.disabled = false;
      submitButton.textContent = originalText;
      
      // Show error notification
      showNotification('Error connecting to server. Please try again.', 'error');
      console.error('Form submission error:', error);
    });
  });
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
window.setupFormSubmission = setupFormSubmission;
