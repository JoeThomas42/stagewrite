/**
 * StageWrite Login Modal
 * Handles login and signup functionality in a modal
 */

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
  const loginFormContainer = document.getElementById('login-form');
  const signupFormContainer = document.getElementById('signup-form');
  const loginForm = loginFormContainer ? loginFormContainer.querySelector('form') : null;
  const signupForm = signupFormContainer ? signupFormContainer.querySelector('form') : null;

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

  form.addEventListener('submit', function (e) {
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
      .then((response) => response.json())
      .then((data) => {
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
          Object.keys(data.errors).forEach((field) => {
            const fieldElement = form.querySelector(`[name="${field}"]`);
            if (fieldElement) {
              let errorMessage = '';

              switch (data.errors[field]) {
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
            errorDiv.textContent = data.errors.general === 'database_error' ? 'Database error. Please try again later.' : 'An error occurred. Please try again.';

            form.prepend(errorDiv);
          }
        }
      })
      .catch((error) => {
        // Reset button
        submitButton.disabled = false;
        submitButton.textContent = originalText;

        // Show error notification
        showNotification('Error connecting to server. Please try again.', 'error');
        console.error('Form submission error:', error);
      });
  });
}

// Add initialization to global scope
window.initLoginModal = initLoginModal;
