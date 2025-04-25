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
  const forgotPasswordForm = document.getElementById('forgot-password-form');
  const switchToSignup = document.getElementById('switch-to-signup');
  const switchToLogin = document.getElementById('switch-to-login');
  const forgotPasswordLink = document.getElementById('forgot-password-link');
  const backToLoginBtn = document.getElementById('back-to-login');
  const resetBackToLoginBtn = document.getElementById('reset-back-to-login');

  // Add form switching functionality
  if (switchToSignup) {
    switchToSignup.addEventListener('click', (e) => {
      e.preventDefault();
      clearAllErrors(loginForm);

      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
      if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden');

      // Initialize password toggles after switching forms
      initPasswordToggles();
    });
  }

  if (switchToLogin) {
    switchToLogin.addEventListener('click', (e) => {
      e.preventDefault();
      clearAllErrors(signupForm);

      signupForm.classList.add('hidden');
      loginForm.classList.remove('hidden');
      if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden');

      // Initialize password toggles after switching forms
      initPasswordToggles();
    });
  }

  // Password reset form switching
  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (loginForm) loginForm.classList.add('hidden');
      if (forgotPasswordForm) {
        forgotPasswordForm.classList.remove('hidden');

        // Reset form state
        const resetMessage = forgotPasswordForm.querySelector('.reset-message');
        const resetRequestForm = forgotPasswordForm.querySelector('#reset-request-form');
        const successMessage = forgotPasswordForm.querySelector('.success-message');
        const errorMessage = forgotPasswordForm.querySelector('.error-message');

        if (resetMessage) resetMessage.classList.add('hidden');
        if (resetRequestForm) resetRequestForm.classList.remove('hidden');
        if (successMessage) successMessage.classList.add('hidden');
        if (errorMessage) errorMessage.classList.add('hidden');
      }
    });
  }

  // Back to login from password reset
  if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', function (e) {
      e.preventDefault();
      // Important: Stop propagation to prevent modal from closing
      e.stopPropagation();

      if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden');
      if (loginForm) loginForm.classList.remove('hidden');

      // Initialize password toggles after switching forms
      initPasswordToggles();
    });
  }

  // After reset message, back to login
  if (resetBackToLoginBtn) {
    resetBackToLoginBtn.addEventListener('click', function (e) {
      e.preventDefault();
      // Important: Stop propagation to prevent modal from closing
      e.stopPropagation();

      if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden');
      if (loginForm) loginForm.classList.remove('hidden');

      // Initialize password toggles after switching forms
      initPasswordToggles();
    });
  }

  // Handle password reset request form submission
  const resetRequestForm = document.getElementById('reset-request-form');
  if (resetRequestForm) {
    resetRequestForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const resetMessage = document.querySelector('.reset-message');
      const successMessage = document.querySelector('.success-message');
      const errorMessage = document.querySelector('.error-message');
      const resetErrorText = document.getElementById('reset-error-text');

      const email = document.getElementById('reset_email').value.trim();

      if (!email) {
        if (resetErrorText) resetErrorText.textContent = 'Please enter a valid email address';
        if (errorMessage) errorMessage.classList.remove('hidden');
        return;
      }

      try {
        const response = await fetch('/handlers/password_reset_request.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `email=${encodeURIComponent(email)}`,
        });

        const data = await response.json();

        if (data.success) {
          // Show success message
          resetRequestForm.classList.add('hidden');
          if (resetMessage) resetMessage.classList.remove('hidden');
          if (successMessage) successMessage.classList.remove('hidden');
          if (errorMessage) errorMessage.classList.add('hidden');
        } else {
          // Show error message
          if (resetErrorText) resetErrorText.textContent = data.error || 'An error occurred. Please try again.';
          if (errorMessage) errorMessage.classList.remove('hidden');
        }
      } catch (error) {
        console.error('Error:', error);
        if (resetErrorText) resetErrorText.textContent = 'Network error. Please try again later.';
        if (errorMessage) errorMessage.classList.remove('hidden');
      }
    });
  }

  // Set up form submissions
  initSignupForm();
  initLoginForm();

  // Initialize password toggles for initial forms
  initPasswordToggles();
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
    const recaptchaResponse = grecaptcha.getResponse();
    const recaptchaErrorDiv = document.getElementById('recaptcha-error');

    if (recaptchaResponse.length === 0) {
      if (recaptchaErrorDiv) recaptchaErrorDiv.style.display = 'block';
      e.preventDefault();
      return;
    } else {
      if (recaptchaErrorDiv) recaptchaErrorDiv.style.display = 'none';
    }

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

    clearAllErrors(loginFormElement);

    const formData = new FormData(e.target);

    const stayLoggedIn = document.getElementById('stay_logged_in');
    if (stayLoggedIn && stayLoggedIn.checked) {
      formData.set('stay_logged_in', '1');
    } else {
      formData.set('stay_logged_in', '0');
    }

    try {
      const response = await fetch('/handlers/login_handler.php', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (data.errors) {
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
}

/**
 * Initialize account dropdown functionality
 */
function initAccountDropdown() {
  initPasswordChangeModal();
  initEmailChangeModal();
  initAccountDeletion();
}

/**
 * Initialize password change modal functionality
 */
function initPasswordChangeModal() {
  const changePasswordLink = document.getElementById('change-password-link');
  const passwordChangeModal = document.getElementById('password-change-modal');

  if (!changePasswordLink || !passwordChangeModal) return;

  // Open the modal when the change password link is clicked
  changePasswordLink.addEventListener('click', function (e) {
    e.preventDefault();

    // Reset form
    const form = document.getElementById('password-change-form');
    if (form) form.reset();

    // Hide success message, show form
    const successMessage = passwordChangeModal.querySelector('.password-change-success');
    if (successMessage) successMessage.classList.add('hidden');
    if (form) form.classList.remove('hidden');

    // Clear any error messages
    const errorMessage = document.getElementById('password-change-error');
    if (errorMessage) errorMessage.classList.add('hidden');

    // Open the modal
    openModal(passwordChangeModal);

    // Initialize password toggles
    initPasswordToggles();

    // Close dropdown after action
    const dropdown = this.closest('.dropdown');
    const menu = dropdown.querySelector('.dropdown-menu');
    if (menu) menu.classList.remove('active');
  });

  // Close button functionality
  const closeButton = passwordChangeModal.querySelector('.close-button');
  if (closeButton) {
    closeButton.addEventListener('click', function () {
      closeModal(passwordChangeModal);
    });
  }

  // Cancel button functionality
  const cancelButton = passwordChangeModal.querySelector('.cancel-button');
  if (cancelButton) {
    cancelButton.addEventListener('click', function () {
      closeModal(passwordChangeModal);
    });
  }

  // Close on outside click
  passwordChangeModal.addEventListener('click', function (e) {
    if (e.target === passwordChangeModal) {
      closeModal(passwordChangeModal);
    }
  });

  // Close success button
  const closeSuccessBtn = document.getElementById('close-success-btn');
  if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', function () {
      closeModal(passwordChangeModal);
    });
  }

  // Form submission
  const passwordChangeForm = document.getElementById('password-change-form');
  if (passwordChangeForm) {
    passwordChangeForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const currentPassword = document.getElementById('current_password').value;
      const newPassword = document.getElementById('new_password').value;
      const confirmNewPassword = document.getElementById('confirm_new_password').value;
      const errorMessageElement = document.getElementById('password-change-error');

      // Clear any existing error messages
      if (errorMessageElement) {
        errorMessageElement.textContent = '';
        errorMessageElement.classList.add('hidden');
      }

      // Validate passwords
      if (newPassword.length < 8) {
        if (errorMessageElement) {
          errorMessageElement.textContent = 'New password must be at least 8 characters';
          errorMessageElement.classList.remove('hidden');
        }
        return;
      }

      if (!/[0-9]/.test(newPassword)) {
        if (errorMessageElement) {
          errorMessageElement.textContent = 'New password must include at least one number';
          errorMessageElement.classList.remove('hidden');
        }
        return;
      }

      if (newPassword !== confirmNewPassword) {
        if (errorMessageElement) {
          errorMessageElement.textContent = 'New passwords do not match';
          errorMessageElement.classList.remove('hidden');
        }
        return;
      }

      try {
        const response = await fetch('/handlers/change_password.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_password: newPassword,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Show success message
          passwordChangeForm.classList.add('hidden');
          const successMessage = passwordChangeModal.querySelector('.password-change-success');
          if (successMessage) successMessage.classList.remove('hidden');

          // Show notification
          if (typeof showNotification === 'function') {
            showNotification('Password changed successfully!', 'success');
          }
        } else {
          // Show error message
          if (errorMessageElement) {
            errorMessageElement.textContent = data.error || 'An error occurred. Please try again.';
            errorMessageElement.classList.remove('hidden');
          }
        }
      } catch (error) {
        console.error('Error:', error);
        if (errorMessageElement) {
          errorMessageElement.textContent = 'Network error. Please try again later.';
          errorMessageElement.classList.remove('hidden');
        }
      }
    });
  }
}

/**
 * Initialize password toggle functionality for all password fields
 * This allows users to show/hide their password input
 */
function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.password-toggle');

  toggleButtons.forEach((button) => {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    newButton.addEventListener('click', function () {
      const container = this.parentNode;
      const passwordField = container.querySelector('input');
      const fieldType = passwordField.getAttribute('type');

      if (fieldType === 'password') {
        passwordField.setAttribute('type', 'text');
        this.innerHTML = '<i class="fas fa-eye-slash"></i>';
      } else {
        passwordField.setAttribute('type', 'password');
        this.innerHTML = '<i class="fas fa-eye"></i>';
      }
    });
  });
}

/**
 * Initialize email change modal functionality
 */
function initEmailChangeModal() {
  const changeEmailLink = document.getElementById('change-email-link');
  const emailChangeModal = document.getElementById('email-change-modal');

  if (!changeEmailLink || !emailChangeModal) return;

  // Open the modal when the change email link is clicked
  changeEmailLink.addEventListener('click', function (e) {
    e.preventDefault();

    // Reset form
    const form = document.getElementById('email-change-form');
    if (form) form.reset();

    // Fetch the current email from the server
    fetch('/handlers/get_user_info.php')
      .then((response) => response.json())
      .then((data) => {
        if (data.success && data.email) {
          const currentEmailField = document.getElementById('current_email');
          if (currentEmailField) currentEmailField.value = data.email;
        }
      })
      .catch((error) => {
        console.error('Error fetching user info:', error);
      });

    // Hide success message, show form
    const successMessage = emailChangeModal.querySelector('.email-change-success');
    if (successMessage) successMessage.classList.add('hidden');
    if (form) form.classList.remove('hidden');

    // Clear any error messages
    const errorMessage = document.getElementById('email-change-error');
    if (errorMessage) errorMessage.classList.add('hidden');

    // Open the modal
    openModal(emailChangeModal);

    // Initialize password toggles
    initPasswordToggles();

    // Close dropdown after action
    const dropdown = this.closest('.dropdown');
    const menu = dropdown.querySelector('.dropdown-menu');
    if (menu) menu.classList.remove('active');
  });

  // Close button functionality
  const closeButton = emailChangeModal.querySelector('.close-button');
  if (closeButton) {
    closeButton.addEventListener('click', function () {
      closeModal(emailChangeModal);
    });
  }

  // Cancel button functionality
  const cancelButton = emailChangeModal.querySelector('.cancel-button');
  if (cancelButton) {
    cancelButton.addEventListener('click', function () {
      closeModal(emailChangeModal);
    });
  }

  // Close on outside click
  emailChangeModal.addEventListener('click', function (e) {
    if (e.target === emailChangeModal) {
      closeModal(emailChangeModal);
    }
  });

  // Close success button
  const closeSuccessBtn = document.getElementById('close-email-success-btn');
  if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', function () {
      closeModal(emailChangeModal);
    });
  }

  // Form submission
  const emailChangeForm = document.getElementById('email-change-form');
  if (emailChangeForm) {
    emailChangeForm.addEventListener('submit', async function (e) {
      e.preventDefault();

      const currentPassword = document.getElementById('current_password_email').value;
      const newEmail = document.getElementById('new_email').value;
      const errorMessageElement = document.getElementById('email-change-error');

      // Clear any existing error messages
      if (errorMessageElement) {
        errorMessageElement.textContent = '';
        errorMessageElement.classList.add('hidden');
      }

      // Validate email format
      if (!isValidEmail(newEmail)) {
        if (errorMessageElement) {
          errorMessageElement.textContent = 'Please enter a valid email address';
          errorMessageElement.classList.remove('hidden');
        }
        return;
      }

      try {
        const response = await fetch('/handlers/change_email.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            current_password: currentPassword,
            new_email: newEmail,
          }),
        });

        const data = await response.json();

        if (data.success) {
          // Show success message
          emailChangeForm.classList.add('hidden');
          const successMessage = emailChangeModal.querySelector('.email-change-success');
          if (successMessage) successMessage.classList.remove('hidden');

          // Show notification
          if (typeof showNotification === 'function') {
            showNotification('Email changed successfully!', 'success');
          }
        } else {
          // Show error message
          if (errorMessageElement) {
            errorMessageElement.textContent = data.error || 'An error occurred. Please try again.';
            errorMessageElement.classList.remove('hidden');
          }
        }
      } catch (error) {
        console.error('Error:', error);
        if (errorMessageElement) {
          errorMessageElement.textContent = 'Network error. Please try again later.';
          errorMessageElement.classList.remove('hidden');
        }
      }
    });
  }
}

/**
 * Validate email format
 * @param {string} email - Email address to validate
 * @return {boolean} Whether the email is valid
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Initialize account deletion feature
 */
function initAccountDeletion() {
  const deleteAccountLink = document.getElementById('delete-account-link');
  const deleteAccountModal = document.getElementById('delete-account-modal');

  if (!deleteAccountLink || !deleteAccountModal) return;

  // Open the modal when the delete account link is clicked
  deleteAccountLink.addEventListener('click', function (e) {
    e.preventDefault();

    // Reset form
    const form = document.getElementById('delete-account-form');
    if (form) form.reset();

    // Clear any error messages
    const errorMessage = document.getElementById('delete-account-error');
    if (errorMessage) errorMessage.classList.add('hidden');

    // Open the modal
    openModal(deleteAccountModal);

    // Initialize password toggles
    initPasswordToggles();

    // Close dropdown after action
    const dropdown = this.closest('.dropdown');
    const menu = dropdown.querySelector('.dropdown-menu');
    if (menu) menu.classList.remove('active');
  });

  // Close button functionality
  const closeButton = deleteAccountModal.querySelector('.close-button');
  if (closeButton) {
    closeButton.addEventListener('click', function () {
      closeModal(deleteAccountModal);
    });
  }

  // Cancel button functionality
  const cancelButton = deleteAccountModal.querySelector('.cancel-button');
  if (cancelButton) {
    cancelButton.addEventListener('click', function () {
      closeModal(deleteAccountModal);
    });
  }

  // Close on outside click
  deleteAccountModal.addEventListener('click', function (e) {
    if (e.target === deleteAccountModal) {
      closeModal(deleteAccountModal);
    }
  });

  // Form submission with double-confirmation using setupConfirmButton
  const deleteAccountForm = document.getElementById('delete-account-form');
  if (deleteAccountForm) {
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

    deleteAccountForm.addEventListener('submit', function (e) {
      e.preventDefault();

      // Use setupConfirmButton for double confirmation
      setupConfirmButton(
        confirmDeleteBtn,
        async function () {
          // This function will run after the second click
          const password = document.getElementById('delete_account_password').value;
          const errorMessageElement = document.getElementById('delete-account-error');

          // Clear any existing error messages
          if (errorMessageElement) {
            errorMessageElement.textContent = '';
            errorMessageElement.classList.add('hidden');
          }

          // Validate password is not empty
          if (!password) {
            if (errorMessageElement) {
              errorMessageElement.textContent = 'Password is required';
              errorMessageElement.classList.remove('hidden');
            }
            return;
          }

          try {
            const response = await fetch('/handlers/delete_account.php', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                password: password,
              }),
            });

            const data = await response.json();

            if (data.success) {
              // Show notification before redirect
              if (typeof showNotification === 'function') {
                showNotification('Your account has been deleted. Redirecting to homepage...', 'info', 2000);
              }

              // Redirect to homepage after a short delay
              setTimeout(function () {
                window.location.href = '/';
              }, 2000);
            } else {
              // Show error message
              if (errorMessageElement) {
                errorMessageElement.textContent = data.error || 'An error occurred. Please try again.';
                errorMessageElement.classList.remove('hidden');
              }
            }
          } catch (error) {
            console.error('Error:', error);
            if (errorMessageElement) {
              errorMessageElement.textContent = 'Network error. Please try again later.';
              errorMessageElement.classList.remove('hidden');
            }
          }
        },
        {
          confirmText: 'Confirm Delete',
          confirmTitle: 'Click again to permanently delete your account',
          originalText: 'Delete Account',
          originalTitle: 'Delete your account',
          timeout: 5000, // Give users more time (5 seconds) to think about this important action
          stopPropagation: true,
          event: e,
        }
      );
    });
  }
}

// -------------------- Make authentication functions available globally ---------------------
window.initAuthForms = initAuthForms;
window.initSignupForm = initSignupForm;
window.initLoginForm = initLoginForm;
window.initAccountDropdown = initAccountDropdown;
window.initPasswordChangeModal = initPasswordChangeModal;
window.initPasswordToggles = initPasswordToggles;
window.initEmailChangeModal = initEmailChangeModal;
window.initAccountDeletion = initAccountDeletion;
