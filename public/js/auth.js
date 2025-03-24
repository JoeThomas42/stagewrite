/**
 * StageWrite Authentication Module
 * Handles login and signup forms, validation, and submission
 */

/**
 * Initializes authentication forms (login and signup)
 * Handles form switching, validation, error display, and form submission
 */
function initAuthForms() {
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const switchToSignup = document.getElementById("switch-to-signup");
  const switchToLogin = document.getElementById("switch-to-login");

  // Add form switching functionality
  if (switchToSignup) {
    switchToSignup.addEventListener("click", e => {
      e.preventDefault();
      loginForm.classList.add("hidden");
      signupForm.classList.remove("hidden");
    });
  }

  if (switchToLogin) {
    switchToLogin.addEventListener("click", e => {
      e.preventDefault();
      signupForm.classList.add("hidden");
      loginForm.classList.remove("hidden");
    });
  }

  // Set up form submissions
  initSignupForm();
  initLoginForm();
  
  // Add CSS for error styling
  addErrorStyles();
}

/**
 * Initializes signup form validation and submission
 */
function initSignupForm() {
  const signupFormElement = document.querySelector('#signup-form form');
  if (!signupFormElement) return;
  
  signupFormElement.addEventListener('submit', async e => {
    e.preventDefault();
    
    // Clear any existing error messages
    clearAllErrors(signupFormElement);
    
    // Trim inputs before submission (except passwords)
    const inputs = signupFormElement.querySelectorAll('input:not([type="password"])');
    inputs.forEach(input => {
      input.value = input.value.trim();
    });
    
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch('/handlers/signup_handler.php', {
        method: 'POST',
        body: formData
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
            window.location.href = '/profile.php';
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
  
  loginFormElement.addEventListener('submit', async e => {
    e.preventDefault();
    
    // Clear any existing error messages
    clearAllErrors(loginFormElement);
    
    const formData = new FormData(e.target);
    
    try {
      const response = await fetch('/handlers/login_handler.php', {
        method: 'POST',
        body: formData
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
          window.location.href = '/profile.php';
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
}

/**
 * Adds CSS for error styling to the document
 */
function addErrorStyles() {
  const style = document.createElement('style');
  style.innerHTML = `
    .error-input {
      border: 1px solid #dc3545 !important;
    }
    .field-error {
      color: #dc3545;
      font-size: 12px;
      margin-top: -10px;
      margin-bottom: 10px;
    }
  `;
  document.head.appendChild(style);
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

// -------------------- Make authentication functions available globally ---------------------
window.initAuthForms = initAuthForms;
window.initSignupForm = initSignupForm;
window.initLoginForm = initLoginForm;
window.addErrorStyles = addErrorStyles;
window.showFieldError = showFieldError;
window.clearFieldError = clearFieldError;
window.clearAllErrors = clearAllErrors;
