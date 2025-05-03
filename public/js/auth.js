/**
 * StageWrite Authentication Module
 * Handles login and signup forms, validation, and submission
 */

/**
 * Initializes authentication forms (login, signup, forgot password)
 * Handles form switching, validation, error display, and form submission.
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

  if (switchToSignup) {
    switchToSignup.addEventListener('click', (e) => {
      e.preventDefault();
      clearAllErrors(loginForm);

      loginForm.classList.add('hidden');
      signupForm.classList.remove('hidden');
      if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden');

      grecaptcha.reset();

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

      grecaptcha.reset();

      initPasswordToggles();
    });
  }

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (e) => {
      e.preventDefault();
      if (loginForm) loginForm.classList.add('hidden');
      if (forgotPasswordForm) {
        forgotPasswordForm.classList.remove('hidden');

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

  if (backToLoginBtn) {
    backToLoginBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden');
      if (loginForm) loginForm.classList.remove('hidden');

      initPasswordToggles();
    });
  }

  if (resetBackToLoginBtn) {
    resetBackToLoginBtn.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      if (forgotPasswordForm) forgotPasswordForm.classList.add('hidden');
      if (loginForm) loginForm.classList.remove('hidden');

      initPasswordToggles();
    });
  }

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
        showNotification('Please enter a valid email address', 'error');
        if (errorMessage) errorMessage.classList.remove('hidden');
        if (resetErrorText) resetErrorText.textContent = 'Please enter a valid email address';
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
          resetRequestForm.classList.add('hidden');
          if (resetMessage) resetMessage.classList.remove('hidden');
          if (successMessage) successMessage.classList.remove('hidden');
          if (errorMessage) errorMessage.classList.add('hidden');
        } else {
          showNotification(data.error || 'An error occurred. Please try again.', 'error');
          if (resetErrorText) resetErrorText.textContent = data.error || 'An error occurred. Please try again.';
          if (errorMessage) errorMessage.classList.remove('hidden');
        }
      } catch (error) {
        console.error('Error:', error);
        showNotification('Network error. Please try again later.', 'error');
        if (resetErrorText) resetErrorText.textContent = 'Network error. Please try again later.';
        if (errorMessage) errorMessage.classList.remove('hidden');
      }
    });
  }

  initSignupForm();
  initLoginForm();
  initPasswordToggles();
}

/**
 * Initializes signup form validation and submission.
 * Handles input trimming, reCAPTCHA validation, form submission via fetch,
 * error display, and redirection upon successful signup and login.
 */
function initSignupForm() {
  const signupFormElement = document.querySelector('#signup-form form');
  if (!signupFormElement) return;

  signupFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    clearAllErrors(signupFormElement);

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
        for (const [field, errorType] of Object.entries(data.errors)) {
          let fieldId = field;
          if (field === 'password') fieldId = 'password_signup';
          if (field === 'email') fieldId = 'email_signup';

          const inputField = document.getElementById(fieldId);

          if (!inputField) {
            console.error(`Could not find element with ID: ${fieldId}`);
            continue;
          }

          if (errorType === 'required') {
            showFieldError(inputField);
            showNotification('Please fill in all required fields', 'error');
          } else if (field === 'email' && errorType === 'invalid') {
            showFieldError(inputField);
            showNotification('Please enter a valid email address', 'error');
          } else if (field === 'email' && errorType === 'exists') {
            showFieldError(inputField, 'This email is already registered');
            showNotification('Invalid email', 'error');
          } else if (field === 'password' && (errorType === 'too_short' || errorType === 'no_number')) {
            showFieldError(inputField, 'Must be 8 characters and include at least one number');
            showNotification('Invalid Password', 'error');
          } else if (field === 'password' && errorType.startsWith('invalid_char:')) {
            const invalidChar = errorType.split(':')[1];
            showFieldError(inputField, `'${invalidChar}' cannot be used`);
            showNotification('Invalid Password', 'error');
          } else if (field === 'confirm_password' && errorType === 'mismatch') {
            showFieldError(inputField);
            showNotification('Passwords do not match', 'error');
          }
        }
      } else if (data.success) {
        if (data.role_id) {
          if (data.role_id == 2 || data.role_id == 3) {
            window.location.href = '/data_management.php';
          } else {
            window.location.href = '/index.php';
          }
        } else {
          window.location.href = '/index.php';
        }
      }
    } catch (error) {
      console.error('Error:', error);
    }
  });
}

/**
 * Initializes login form validation and submission.
 * Handles reCAPTCHA verification, form data preparation (including 'Stay logged in'),
 * form submission via fetch, processing indicators, error display, and redirection upon success.
 */
function initLoginForm() {
  const loginFormElement = document.querySelector('#login-form form');
  if (!loginFormElement) return;

  loginFormElement.addEventListener('submit', async (e) => {
    e.preventDefault();

    clearAllErrors(loginFormElement);

    const recaptchaResponse = grecaptcha.getResponse();
    const recaptchaErrorDiv = document.getElementById('login-recaptcha-error');

    if (recaptchaResponse.length === 0) {
      if (recaptchaErrorDiv) recaptchaErrorDiv.style.display = 'block';
      return;
    } else {
      if (recaptchaErrorDiv) recaptchaErrorDiv.style.display = 'none';
    }

    const formData = new FormData(e.target);
    formData.append('g-recaptcha-response', recaptchaResponse);

    const stayLoggedIn = document.getElementById('stay_logged_in');
    if (stayLoggedIn && stayLoggedIn.checked) {
      formData.set('stay_logged_in', '1');
    } else {
      formData.set('stay_logged_in', '0');
    }

    const submitButton = loginFormElement.querySelector('button[type="submit"]');
    let originalButtonText;

    try {
      if (submitButton) {
        originalButtonText = submitButton.textContent;
        submitButton.disabled = true;
        submitButton.textContent = 'Processing...';
      }

      const response = await fetch('/handlers/login_handler.php', {
        method: 'POST',
        body: formData,
      });

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText;
      }

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}: ${response.statusText}`);
      }

      const text = await response.text();

      if (!text || text.trim() === '') {
        throw new Error('Server returned an empty response');
      }

      let data;
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        console.error('JSON parse error:', parseError);
        console.error('Raw response:', text);
        throw new Error(`Invalid JSON response: ${parseError.message}`);
      }

      if (data.errors) {
        for (const [field, errorType] of Object.entries(data.errors)) {
          if (field === 'recaptcha') {
            if (recaptchaErrorDiv) {
              recaptchaErrorDiv.textContent = data.message || 'reCAPTCHA verification failed';
              recaptchaErrorDiv.style.display = 'block';
            }
            grecaptcha.reset();
            continue;
          }

          if (field === 'general') {
            const errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            errorDiv.textContent = errorType;
            loginFormElement.prepend(errorDiv);
            continue;
          }

          const inputField = document.getElementById(field);
          if (!inputField) continue;

          if (errorType === 'required') {
            showFieldError(inputField);
            showNotification('Please fill in all required fields', 'error');
          } else if (field === 'email' && errorType === 'invalid') {
            showFieldError(inputField);
            showNotification('Please enter a valid email address', 'error');
          } else if (errorType === 'invalid_credentials') {
            showFieldError(inputField);
            showNotification('Invalid email or password', 'error');
          }
        }
      } else if (data.success) {
        if (typeof showNotification === 'function') {
          showNotification('Login successful!', 'success');
        }

        if (data.role_id == 2 || data.role_id == 3) {
          window.location.href = '/data_management.php';
        } else {
          window.location.href = '/index.php';
        }
      }
    } catch (error) {
      console.error('Login error:', error);

      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalButtonText || 'Login';
      }

      const errorDiv = document.createElement('div');
      errorDiv.className = 'error-message';
      errorDiv.textContent = `Error: ${error.message}`;
      loginFormElement.prepend(errorDiv);

      if (typeof showNotification === 'function') {
        showNotification('Login failed. Please try again.', 'error');
      }

      grecaptcha.reset();
    }
  });
}

/**
 * Initializes account dropdown functionality by setting up
 * listeners for password change, email change, and account deletion modals.
 */
function initAccountDropdown() {
  initPasswordChangeModal();
  initEmailChangeModal();
  initAccountDeletion();
}

/**
 * Initializes password change modal functionality.
 * Handles opening the modal, form reset, form submission via fetch,
 * validation, error/success message display, and closing the modal.
 */
function initPasswordChangeModal() {
  const changePasswordLink = document.getElementById('change-password-link');
  const passwordChangeModal = document.getElementById('password-change-modal');

  if (!changePasswordLink || !passwordChangeModal) return;

  changePasswordLink.addEventListener('click', function (e) {
    e.preventDefault();
    const form = document.getElementById('password-change-form');
    if (form) form.reset();
    const successMessage = passwordChangeModal.querySelector('.password-change-success');
    if (successMessage) successMessage.classList.add('hidden');
    if (form) form.classList.remove('hidden');
    const errorMessage = document.getElementById('password-change-error');
    if (errorMessage) errorMessage.classList.add('hidden');
    openModal(passwordChangeModal);
    initPasswordToggles();
    const dropdown = this.closest('.dropdown');
    const menu = dropdown.querySelector('.dropdown-menu');
    if (menu) menu.classList.remove('active');
  });

  const passwordChangeForm = document.getElementById('password-change-form');
  if (passwordChangeForm) {
    passwordChangeForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      clearAllErrors(passwordChangeForm);

      const currentPasswordInput = document.getElementById('current_password');
      const newPasswordInput = document.getElementById('new_password');
      const confirmNewPasswordInput = document.getElementById('confirm_new_password');
      const errorMessageElement = document.getElementById('password-change-error');

      let isValid = true;

      const requiredFields = [
        { input: currentPasswordInput, name: 'Current Password' },
        { input: newPasswordInput, name: 'New Password' },
        { input: confirmNewPasswordInput, name: 'Confirm New Password' },
      ];

      requiredFields.forEach((fieldInfo) => {
        if (fieldInfo.input && !fieldInfo.input.value.trim()) {
          showNotification(`${fieldInfo.name} is required.`, 'error');
          showFieldError(fieldInfo.input);
          isValid = false;
        }
      });

      if (!isValid) {
        return;
      }

      const currentPassword = currentPasswordInput.value;
      const newPassword = newPasswordInput.value;
      const confirmNewPassword = confirmNewPasswordInput.value;

      if (errorMessageElement) {
        errorMessageElement.textContent = '';
        errorMessageElement.classList.add('hidden');
      }

      if (newPassword.length < 8) {
        showNotification('New password must be at least 8 characters.', 'error');
        showFieldError(newPasswordInput);
        return;
      }

      if (!/[0-9]/.test(newPassword)) {
        showNotification('New password must include at least one number.', 'error');
        showFieldError(newPasswordInput);
        return;
      }

      if (newPassword !== confirmNewPassword) {
        showNotification('New passwords do not match.', 'error');
        showFieldError(confirmNewPasswordInput);
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
          passwordChangeForm.classList.add('hidden');
          const successMessage = passwordChangeModal.querySelector('.password-change-success');
          if (successMessage) successMessage.classList.remove('hidden');
          if (typeof showNotification === 'function') {
            showNotification('Password changed successfully!', 'success');
          }
        } else {
          showNotification(data.error || 'An error occurred. Please try again.', 'error');
          if (errorMessageElement) {
            errorMessageElement.textContent = data.error || 'An error occurred. Please try again.';
            errorMessageElement.classList.remove('hidden');
            if (data.error && data.error.toLowerCase().includes('current password')) {
              showFieldError(currentPasswordInput);
              showNotification('Incorrect password. Please try again.', 'error');
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
        showNotification('Network error. Please try again later.', 'error');
        if (errorMessageElement) {
          errorMessageElement.textContent = 'Network error. Please try again later.';
          errorMessageElement.classList.remove('hidden');
        }
      }
    });
  }

  const closeButton = passwordChangeModal?.querySelector('.close-button');
  if (closeButton) {
    closeButton.addEventListener('click', function () {
      closeModal(passwordChangeModal);
    });
  }

  const cancelButton = passwordChangeModal?.querySelector('.cancel-button');
  if (cancelButton) {
    cancelButton.addEventListener('click', function () {
      closeModal(passwordChangeModal);
    });
  }

  passwordChangeModal?.addEventListener('click', function (e) {
    if (e.target === passwordChangeModal) {
      closeModal(passwordChangeModal);
    }
  });

  const closeSuccessBtn = document.getElementById('close-success-btn');
  if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', function () {
      closeModal(passwordChangeModal);
    });
  }
}

/**
 * Initializes password toggle functionality for all password fields.
 * This allows users to show/hide their password input by clicking an associated icon.
 * It replaces existing buttons with clones to ensure clean event listener setup.
 */
function initPasswordToggles() {
  const toggleButtons = document.querySelectorAll('.password-toggle');

  toggleButtons.forEach((button) => {
    const newButton = button.cloneNode(true);
    button.parentNode.replaceChild(newButton, button);

    newButton.addEventListener('click', function () {
      const container = this.parentNode;
      const passwordField = container.querySelector('input[type="password"], input[type="text"]');
      if (!passwordField) return;

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
 * Initializes email change modal functionality.
 * Handles opening the modal, fetching current email, form reset, form submission via fetch,
 * validation, error/success message display, and closing the modal.
 */
function initEmailChangeModal() {
  const changeEmailLink = document.getElementById('change-email-link');
  const emailChangeModal = document.getElementById('email-change-modal');

  if (!changeEmailLink || !emailChangeModal) return;

  changeEmailLink.addEventListener('click', function (e) {
    e.preventDefault();
    const form = document.getElementById('email-change-form');
    if (form) form.reset();
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
    const successMessage = emailChangeModal.querySelector('.email-change-success');
    if (successMessage) successMessage.classList.add('hidden');
    if (form) form.classList.remove('hidden');
    const errorMessage = document.getElementById('email-change-error');
    if (errorMessage) errorMessage.classList.add('hidden');
    openModal(emailChangeModal);
    initPasswordToggles();
    const dropdown = this.closest('.dropdown');
    const menu = dropdown.querySelector('.dropdown-menu');
    if (menu) menu.classList.remove('active');
  });

  const emailChangeForm = document.getElementById('email-change-form');
  if (emailChangeForm) {
    emailChangeForm.addEventListener('submit', async function (e) {
      e.preventDefault();
      clearAllErrors(emailChangeForm);

      const currentPasswordInput = document.getElementById('current_password_email');
      const newEmailInput = document.getElementById('new_email');
      const errorMessageElement = document.getElementById('email-change-error');

      let isValid = true;

      const requiredFields = [
        { input: currentPasswordInput, name: 'Current Password' },
        { input: newEmailInput, name: 'New Email' },
      ];

      requiredFields.forEach((fieldInfo) => {
        if (fieldInfo.input && !fieldInfo.input.value.trim()) {
          showNotification(`${fieldInfo.name} is required.`, 'error');
          showFieldError(fieldInfo.input);
          isValid = false;
        }
      });

      const currentPassword = currentPasswordInput.value;
      const newEmail = newEmailInput.value.trim();

      if (errorMessageElement) {
        errorMessageElement.textContent = '';
        errorMessageElement.classList.add('hidden');
      }

      if (isValid && !isValidEmail(newEmail)) {
        showNotification('Please enter a valid email address.', 'error');
        showFieldError(newEmailInput);
        isValid = false;
      }

      if (!isValid) {
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
          emailChangeForm.classList.add('hidden');
          const successMessage = emailChangeModal.querySelector('.email-change-success');
          if (successMessage) successMessage.classList.remove('hidden');
          if (typeof showNotification === 'function') {
            showNotification('Email changed successfully!', 'success');
          }
        } else {
          showNotification(data.error || 'An error occurred. Please try again.', 'error');
          if (errorMessageElement) {
            errorMessageElement.textContent = data.error || 'An error occurred. Please try again.';
            errorMessageElement.classList.remove('hidden');
            if (data.error && data.error.toLowerCase().includes('password')) {
              showFieldError(currentPasswordInput);
              showNotification('Incorrect password. Please try again.', 'error');
            } else if (data.error && data.error.toLowerCase().includes('email')) {
              showFieldError(newEmailInput);
              showNotification(data.error, 'error');
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
        showNotification('Network error. Please try again later.', 'error');
        if (errorMessageElement) {
          errorMessageElement.textContent = 'Network error. Please try again later.';
          errorMessageElement.classList.remove('hidden');
        }
      }
    });
  }

  const closeButton = emailChangeModal?.querySelector('.close-button');
  if (closeButton) {
    closeButton.addEventListener('click', function () {
      closeModal(emailChangeModal);
    });
  }

  const cancelButton = emailChangeModal?.querySelector('.cancel-button');
  if (cancelButton) {
    cancelButton.addEventListener('click', function () {
      closeModal(emailChangeModal);
    });
  }

  emailChangeModal?.addEventListener('click', function (e) {
    if (e.target === emailChangeModal) {
      closeModal(emailChangeModal);
    }
  });

  const closeSuccessBtn = document.getElementById('close-email-success-btn');
  if (closeSuccessBtn) {
    closeSuccessBtn.addEventListener('click', function () {
      closeModal(emailChangeModal);
    });
  }
}

/**
 * Validates if the provided string is a valid email format.
 * @param {string} email - The email string to validate.
 * @returns {boolean} True if the email format is valid, false otherwise.
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Initializes account deletion feature.
 * Handles opening the deletion confirmation modal, form submission via fetch,
 * password validation, error display, and redirection upon successful deletion.
 * Uses a double-confirmation mechanism for the delete button.
 */
function initAccountDeletion() {
  const deleteAccountLink = document.getElementById('delete-account-link');
  const deleteAccountModal = document.getElementById('delete-account-modal');

  if (!deleteAccountLink || !deleteAccountModal) return;

  deleteAccountLink.addEventListener('click', function (e) {
    e.preventDefault();

    const form = document.getElementById('delete-account-form');
    if (form) form.reset();

    openModal(deleteAccountModal);
    initPasswordToggles();

    const dropdown = this.closest('.dropdown');
    const menu = dropdown.querySelector('.dropdown-menu');
    if (menu) menu.classList.remove('active');
  });

  const closeButton = deleteAccountModal.querySelector('.close-button');
  if (closeButton) {
    closeButton.addEventListener('click', function () {
      closeModal(deleteAccountModal);
    });
  }

  const cancelButton = deleteAccountModal.querySelector('.cancel-button');
  if (cancelButton) {
    cancelButton.addEventListener('click', function () {
      closeModal(deleteAccountModal);
    });
  }

  deleteAccountModal.addEventListener('click', function (e) {
    if (e.target === deleteAccountModal) {
      closeModal(deleteAccountModal);
    }
  });

  const deleteAccountForm = document.getElementById('delete-account-form');
  if (deleteAccountForm) {
    const confirmDeleteBtn = document.getElementById('confirm-delete-btn');

    deleteAccountForm.addEventListener('submit', function (e) {
      e.preventDefault();

      setupConfirmButton(
        confirmDeleteBtn,
        async function () {
          const passwordInput = document.getElementById('delete_account_password');
          const password = passwordInput.value;
          const errorMessageElement = document.getElementById('delete-account-error');

          if (!password) {
            showNotification('Password is required to confirm deletion.', 'error');
            showFieldError(passwordInput);

            if (confirmDeleteBtn._resetConfirmState) {
              confirmDeleteBtn._resetConfirmState();
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
              if (typeof showNotification === 'function') {
                showNotification('Your account has been deleted. Redirecting to homepage...', 'info', 2000);
              }
              setTimeout(function () {
                window.location.href = '/';
              }, 2000);
            } else {
              showNotification(data.error || 'An error occurred. Please try again.', 'error');
              if (data.error && data.error.toLowerCase().includes('password')) {
                showNotification('Incorrect password. Please try again.', 'error');
                showFieldError(passwordInput);
              }
              if (confirmDeleteBtn._resetConfirmState) {
                confirmDeleteBtn._resetConfirmState();
              }
            }
          } catch (error) {
            console.error('Error:', error);
            showNotification('Network error. Please try again later.', 'error');
            if (errorMessageElement) {
              errorMessageElement.textContent = 'Network error. Please try again later.';
            }
            if (confirmDeleteBtn._resetConfirmState) {
              confirmDeleteBtn._resetConfirmState();
            }
          }
        },
        {
          confirmText: 'Confirm Delete',
          confirmTitle: 'Click again to permanently delete your account',
          originalText: 'Delete Account',
          originalTitle: 'Delete your account',
          timeout: 5000,
          stopPropagation: true,
          event: e,
        }
      );
    });
  }
}

// Make authentication functions available globally
window.initAuthForms = initAuthForms;
window.initSignupForm = initSignupForm;
window.initLoginForm = initLoginForm;
window.initAccountDropdown = initAccountDropdown;
window.initPasswordChangeModal = initPasswordChangeModal;
window.initPasswordToggles = initPasswordToggles;
window.initEmailChangeModal = initEmailChangeModal;
window.initAccountDeletion = initAccountDeletion;
