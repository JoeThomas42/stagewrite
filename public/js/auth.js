/**
 * StageWrite Authentication Module
 * Handles login and signup forms, validation, and submission
 */

/**
 * Initializes authentication forms (login and signup)
 * Handles form switching, validation, error display, and form submission
 */
function initAuthForms() {
  const loginForm = document.getElementById('login-form');
  const signupForm = document.getElementById('signup-form');
  const switchToSignup = document.getElementById('switch-to-signup');
  const switchToLogin = document.getElementById('switch-to-login');

  // Add form switching functionality
  if (switchToSignup) {
    switchToSignup.addEventListener('click', (e) => {
      e.preventDefault();
      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
    });
  }

  if (switchToLogin) {
    switchToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      signupForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
    });
  }

  // Set up form submissions
  initSignupForm();
  initLoginForm();
}

/**
 * Initializes signup form validation and submission
 */
function initSignupForm() {
  const signupFormElement = document.querySelector('#signup-form form');
  if (!signupFormElement) return;

  signupFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear any existing error messages
    clearAllErrors(signupFormElement);

    // Trim inputs before submission (except passwords)
    const inputs = signupFormElement.querySelectorAll('input:not([type="password"])');
    inputs.forEach((input) => {
      input.value = input.value.trim();
    });

    const formData = new FormData(e.target);

    try {
      const response = await fetch('/handlers/signup_handler.php', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.errors) {
        // Handle field-specific errors
        for (const [field, errorType] of Object.entries(data.errors)) {
          // Map field names to element IDs
          let fieldId = field;
          if (field === 'password') fieldId = 'password_signup';
          if (field === 'email') fieldId = 'email_signup';

          const inputField = document.getElementById(fieldId);

          if (!inputField) {
            console.error(`Could not find element with ID: ${fieldId}`);
            continue;
          }

          if (errorType === 'required') {
            showFieldError(inputField, 'This field is required');
          } else if (field === 'email' && errorType === 'invalid') {
            showFieldError(inputField, 'Please enter a valid email address');
          } else if (field === 'email' && errorType === 'exists') {
            showFieldError(inputField, 'This email is already registered');
          } else if (field === 'password' && (errorType === 'too_short' || errorType === 'no_number')) {
            showFieldError(inputField, 'Must be 8 characters and include at least one number');
          } else if (field === 'password' && errorType.startsWith('invalid_char:')) {
            const invalidChar = errorType.split(':')[1];
            showFieldError(inputField, `'${invalidChar}' cannot be used`);
          } else if (field === 'confirm_password' && errorType === 'mismatch') {
            showFieldError(inputField, 'Passwords do not match');
          }
        }
      } else if (data.success) {
        // Modified section to handle automatic login
        if (data.role_id) {
          // User was automatically logged in, redirect based on role
          if (data.role_id == 2 || data.role_id == 3) {
            // Admin or Super Admin - go directly to management page
            window.location.href = '/data_management.php';
          } else {
            // Regular user - go to home page
            window.location.href = '/index.php';
          }
        } else {
          // Fallback - just go to homepage if no role_id
          window.location.href = '/index.php';
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
}

/**
 * Initializes login form validation and submission
 */
function initLoginForm() {
  const loginFormElement = document.querySelector('#login-form form');
  if (!loginFormElement) return;

  loginFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Clear any existing error messages
    clearAllErrors(loginFormElement);

    const formData = new FormData(e.target);

    try {
      const response = await fetch('/handlers/login_handler.php', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.errors) {
        // Handle field-specific errors
        for (const [field, errorType] of Object.entries(data.errors)) {
          const inputField = document.getElementById(field);

          if (errorType === 'required') {
            showFieldError(inputField, 'Required');
          } else if (field === 'email' && errorType === 'invalid') {
            showFieldError(inputField, 'Invalid email format');
          } else if (errorType === 'invalid_credentials') {
            showFieldError(inputField, 'Invalid email or password');
          }
        }
      } else if (data.success) {
        // Redirect based on user role
        if (data.role_id == 2 || data.role_id == 3) {
          // Admin or Super Admin - go directly to management page
          window.location.href = '/data_management.php';
        } else {
          // Regular user - go to home page
          window.location.href = '/index.php';
        }
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An unexpected error occurred');
    }
  });

  /**
   * Initialize account dropdown functionality
   * This should be added to public/js/auth.js or another appropriate file
   */
  function initAccountDropdown() {
    // Change Password link
    const changePasswordLink = document.getElementById('change-password-link');
    if (changePasswordLink) {
      changePasswordLink.addEventListener('click', function (e) {
        e.preventDefault();

        // For now, just show a notification that this feature is coming soon
        if (typeof showNotification === 'function') {
          showNotification('Change password feature coming soon!', 'info');
        } else {
          alert('Change password feature coming soon!');
        }

        // Close dropdown after action
        const dropdown = this.closest('.dropdown');
        const menu = dropdown.querySelector('.dropdown-menu');
        menu.classList.remove('active');
      });
    }

    // Delete Account link
    const deleteAccountLink = document.getElementById('delete-account-link');
    if (deleteAccountLink) {
      deleteAccountLink.addEventListener('click', function (e) {
        e.preventDefault();

        // For now, just show a notification that this feature is coming soon
        if (typeof showNotification === 'function') {
          showNotification('Account deletion feature coming soon!', 'info');
        } else {
          alert('Account deletion feature coming soon!');
        }

        // Close dropdown after action
        const dropdown = this.closest('.dropdown');
        const menu = dropdown.querySelector('.dropdown-menu');
        menu.classList.remove('active');
      });
    }
  }
}

// -------------------- Make authentication functions available globally ---------------------
window.initAuthForms = initAuthForms;
window.initSignupForm = initSignupForm;
window.initLoginForm = initLoginForm;
window.initAccountDropdown = initAccountDropdown;
