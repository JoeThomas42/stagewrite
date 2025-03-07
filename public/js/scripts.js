document.addEventListener("DOMContentLoaded", () => {
  // Toggle between Login and Signup forms
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const switchToSignup = document.getElementById("switch-to-signup");
  const switchToLogin = document.getElementById("switch-to-login");

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

  // Helper function to show field errors
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

  // Helper function to clear field errors
  function clearFieldError(field) {
    field.classList.remove('error-input');
    const existingError = field.nextElementSibling;
    if (existingError && existingError.className === 'field-error') {
      existingError.remove();
    }
  }

  // Helper function to clear all form errors
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
  
  // Signup form submission with validation
  const signupFormElement = document.querySelector('#signup-form form');
  if (signupFormElement) {
    signupFormElement.addEventListener('submit', async e => {
      e.preventDefault();
      
      // Clear any existing error messages
      clearAllErrors(signupFormElement);
      
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
            const inputField = document.getElementById(field === 'email' ? 'email_signup' : field);
            
            if (errorType === 'required') {
              showFieldError(inputField, 'Required');
            } else if (field === 'confirm_password' && errorType === 'mismatch') {
              showFieldError(inputField, 'Passwords do not match');
            } else if (field === 'email' && errorType === 'exists') {
              showFieldError(inputField, 'Email already registered');
            } else if (field === 'email' && errorType === 'invalid') {
              showFieldError(inputField, 'Invalid email format');
            }
          }
        } else if (data.error === 'database_error') {
          // Handle general errors
          const errorDiv = document.createElement('div');
          errorDiv.className = 'error-message';
          errorDiv.textContent = 'A database error occurred. Please try again.';
          
          const submitButton = e.target.querySelector('button[type="submit"]');
          submitButton.parentNode.insertBefore(errorDiv, submitButton.nextSibling);
        } else if (data.success) {
          // Redirect on success
          window.location.href = '/profile.php';
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An unexpected error occurred');
      }
    });
  }
  
  // Login form submission with validation
  const loginFormElement = document.querySelector('#login-form form');
  if (loginFormElement) {
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
          // Redirect on success
          window.location.href = '/profile.php';
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An unexpected error occurred');
      }
    });
  }
  
  // Add CSS for error styling
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
});

// User status toggle functionality
document.querySelectorAll('.toggle-status').forEach(link => {
  link.addEventListener('click', e => {
    e.preventDefault();
    
    const userId = link.getAttribute('data-user-id');
    const currentStatus = link.getAttribute('data-status');
    const newStatus = currentStatus === '1' ? 0 : 1;
    
    fetch('/handlers/toggle_status.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: `user_id=${encodeURIComponent(userId)}`
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        // Update the status cell in the table
        const row = link.closest('tr');
        const statusCell = row.querySelector('td:nth-child(4)');
        statusCell.textContent = data.status_text;
        
        // Update the data attribute on the link
        link.setAttribute('data-status', data.is_active);
      } else {
        alert(data.error || 'An error occurred while toggling user status');
      }
    })
    .catch(err => {
      console.error('Error:', err);
      alert('An unexpected error occurred');
    });
  });
});

// User removal functionality
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.remove-user').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const userName = link.getAttribute('data-user-name');
      if (confirm(`Are you sure you want to remove ${userName}?\nThis action cannot be undone.`)) {
        const userId = link.getAttribute('data-user-id');
        fetch('/handlers/delete_user.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `user_id=${encodeURIComponent(userId)}`
        })
        .then(response => response.json())
        .then(data => {''
          if (data.success) {
            // Remove the row from the table
            link.closest('tr').remove();
          } else {
            alert(data.error || 'An error occurred while trying to remove the user');
          }
        })
        .catch(err => {
          console.error('Error:', err);
          alert('An unexpected error occurred');
        });
      }
    });
  });
});
