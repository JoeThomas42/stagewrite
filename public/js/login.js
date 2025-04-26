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

    // Basic handling function for errors
    function handleError(message) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;
      
      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message || 'An error occurred. Please try again.';
      form.prepend(errorDiv);
      
      console.error('Login error:', message);
      
      // Reset reCAPTCHA if present
      if (typeof grecaptcha !== 'undefined') {
        try { grecaptcha.reset(); } catch(e) {}
      }
    }

    // Send form data to the server - use simpler fetch with error handling
    fetch(endpoint, {
      method: 'POST',
      body: formData,
    })
    .then(response => {
      // First check for network or server errors
      if (!response.ok) {
        throw new Error(`Server error (${response.status})`);
      }
      
      // Try to get the response as text first
      return response.text();
    })
    .then(text => {
      // Make sure we got a response
      if (!text || text.trim() === '') {
        throw new Error('Empty response from server');
      }
      
      // Try to parse as JSON
      try {
        return JSON.parse(text);
      } catch (e) {
        console.error('Server response:', text);
        throw new Error('Invalid response format');
      }
    })
    .then(data => {
      // Reset button state
      submitButton.disabled = false;
      submitButton.textContent = originalText;
      
      // Process response data
      if (data.success) {
        // Show success notification
        showNotification('Login successful!', 'success');

        // Reload page after successful login
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } else if (data.errors) {
        // Process field errors
        Object.keys(data.errors).forEach(field => {
          // Handle general error differently
          if (field === 'general') {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = data.errors[field];
            form.prepend(errorDiv);
            return;
          }
          
          // Handle field-specific errors
          const fieldElement = form.querySelector(`[name="${field}"]`);
          if (fieldElement) {
            let errorMessage = 'Error';
            
            switch (data.errors[field]) {
              case 'required': errorMessage = 'This field is required'; break;
              case 'invalid': errorMessage = 'Please enter a valid value'; break;
              case 'invalid_credentials': errorMessage = 'Invalid email or password'; break;
              default: errorMessage = data.errors[field];
            }
            
            showFieldError(fieldElement, errorMessage);
          }
        });
      }
    })
    .catch(error => {
      handleError(error.message);
    });
  });
}

// Add initialization to global scope
window.initLoginModal = initLoginModal;
