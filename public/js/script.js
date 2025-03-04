document.addEventListener("DOMContentLoaded", () => {

  // Toggle between Login and Signup forms
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const switchToSignup = document.getElementById("switch-to-signup");
  const switchToLogin = document.getElementById("switch-to-login");

  switchToSignup.addEventListener("click", e => {
      e.preventDefault();
      loginForm.classList.add("hidden");
      signupForm.classList.remove("hidden");
  });

  switchToLogin.addEventListener("click", e => {
      e.preventDefault();
      signupForm.classList.add("hidden");
      loginForm.classList.remove("hidden");
  });

  // Form validation for Signup
  const signupPassword = document.getElementById("password_signup");
  const confirmPassword = document.getElementById("confirm_password");
  const signupFormElement = signupForm.querySelector("form");

  signupFormElement.addEventListener("submit", e => {
      if (signupPassword.value !== confirmPassword.value) {
          e.preventDefault();
          alert("Passwords do not match!");
      }
  });

  // Prevent empty fields submission
  document.querySelectorAll("form").forEach((form) => {
      form.addEventListener("submit", e => {
          const inputs = form.querySelectorAll("input[required]");
          for (const input of inputs) {
              if (!input.value.trim()) {
                  e.preventDefault();
                  alert("Please fill in all required fields.");
                  return;
              }
          }
      });
  });

  document.querySelector('#signup-form form').addEventListener('submit', async e => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      try {
          const response = await fetch('/handlers/signup_handler.php', {
              method: 'POST',
              body: formData
          });
          
          const data = await response.json();
          
          if (data.error === 'email_exists') {
              const errorDiv = document.createElement('div');
              errorDiv.className = 'error-message';
              errorDiv.textContent = 'This email already has an account associated with it';
              
              // Remove any existing error messages
              const existingError = document.querySelector('.error-message');
              if (existingError) {
                  existingError.remove();
              }
              
              // Insert error message after the submit button
              const submitButton = e.target.querySelector('button[type="submit"]');
              submitButton.parentNode.insertBefore(errorDiv, submitButton.nextSibling);
          } else {
              window.location.href = 'profile.php';
          }
      } catch (error) {
          console.error('Error:', error);
      }
  });
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
      if (confirm('Are you sure you want to remove this user?')) {
        const userId = link.getAttribute('data-user-id');
        fetch('/handlers/delete_user.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `user_id=${encodeURIComponent(userId)}`
        })
        .then(response => response.json())
        .then(data => {
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

