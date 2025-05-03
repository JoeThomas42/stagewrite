/**
 * StageWrite Login Modal
 * Handles login and signup functionality in a modal
 */

/**
 * Initialize Login Modal functionality.
 * Gets necessary DOM elements and sets up event listeners for opening/closing the modal,
 * switching between login and signup forms, and handling form submissions via AJAX.
 */
function initLoginModal() {
  const loginModalBtn = document.getElementById('login-modal-btn');
  const loginModal = document.getElementById('login-modal');
  const closeButton = loginModal ? loginModal.querySelector('.close-button') : null;
  const switchToSignupBtn = document.getElementById('switch-to-signup');
  const switchToLoginBtn = document.getElementById('switch-to-login');
  const loginFormContainer = document.getElementById('login-form');
  const signupFormContainer = document.getElementById('signup-form');
  const loginForm = loginFormContainer ? loginFormContainer.querySelector('form') : null;
  const signupForm = signupFormContainer ? signupFormContainer.querySelector('form') : null;

  if (!loginModalBtn || !loginModal) return;

  loginModalBtn.addEventListener('click', () => {
    openModal(loginModal);
  });

  if (closeButton) {
    closeButton.addEventListener('click', () => {
      closeModal(loginModal);
    });
  }

  loginModal.addEventListener('click', (event) => {
    if (event.target === loginModal) {
      closeModal(loginModal);
    }
  });

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

  setupFormSubmission(loginForm, '/handlers/login_handler.php');
  setupFormSubmission(signupForm, '/handlers/signup_handler.php');
}

/**
 * Sets up AJAX form submission for a given form.
 * Handles form data serialization, sending the request, processing the response (success/errors),
 * and updating the UI accordingly (e.g., showing errors, loading indicators, notifications).
 * @param {HTMLFormElement} form - The form element to attach the submit listener to.
 * @param {string} endpoint - The URL endpoint to submit the form data to.
 */
function setupFormSubmission(form, endpoint) {
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    clearAllErrors(form);

    const formData = new FormData(form);

    const submitButton = form.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    submitButton.disabled = true;
    submitButton.textContent = 'Processing...';

    function handleError(message) {
      submitButton.disabled = false;
      submitButton.textContent = originalText;

      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = message || 'An error occurred. Please try again.';
      form.prepend(errorDiv);

      console.error('Form submission error:', message);

      if (typeof grecaptcha !== 'undefined') {
        try {
          grecaptcha.reset();
        } catch (e) {}
      }
    }

    fetch(endpoint, {
      method: 'POST',
      body: formData,
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Server error (${response.status})`);
        }
        return response.text();
      })
      .then((text) => {
        if (!text || text.trim() === '') {
          throw new Error('Empty response from server');
        }
        try {
          return JSON.parse(text);
        } catch (e) {
          console.error('Server response:', text);
          throw new Error('Invalid response format');
        }
      })
      .then((data) => {
        submitButton.disabled = false;
        submitButton.textContent = originalText;

        if (data.success) {
          showNotification('Success!', 'success');

          setTimeout(() => {
            window.location.reload();
          }, 1000);
        } else if (data.errors) {
          Object.keys(data.errors).forEach((field) => {
            if (field === 'general') {
              const errorDiv = document.createElement('div');
              errorDiv.className = 'error-message';
              errorDiv.textContent = data.errors[field];
              form.prepend(errorDiv);
              return;
            }

            const fieldElement = form.querySelector(`[name="${field}"]`);
            if (fieldElement) {
              let errorMessage = 'Error';

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
                default:
                  errorMessage = data.errors[field];
              }

              showFieldError(fieldElement, errorMessage);
              showNotification("Check your fields!", 'error');
            }
          });
        }
      })
      .catch((error) => {
        handleError(error.message);
      });
  });
}

window.initLoginModal = initLoginModal;
