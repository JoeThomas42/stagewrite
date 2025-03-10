document.addEventListener("DOMContentLoaded", () => {
  // SECTION: Login/Signup Form Functionality
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
          // Redirect to home page
          window.location.href = '/index.php';
        }
      } catch (error) {
        console.error('Error:', error);
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

  // SECTION: User Management Functionality
  // User removal functionality
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
  
  // User status toggle functionality
  document.querySelectorAll('.toggle-status').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      
      const userId = link.getAttribute('data-user-id');
      const currentStatus = link.getAttribute('data-status');
      // const newStatus = currentStatus === '1' ? 0 : 1;
      
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

  // User promotion functionality
  document.querySelectorAll('.promote-user').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const userName = link.getAttribute('data-user-name');
      if (confirm(`Are you sure you want to promote ${userName} to Admin?\nThis will give them administrative privileges.`)) {
        const userId = link.getAttribute('data-user-id');
        fetch('/handlers/promote_user.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `user_id=${encodeURIComponent(userId)}`
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Remove the row from the members table (it will need to be in admins table)
            alert(`${userName} has been promoted to Admin successfully.`);
            window.location.reload(); // Reload to update both tables
          } else {
            alert(data.error || 'An error occurred while trying to promote the user');
          }
        })
        .catch(err => {
          console.error('Error:', err);
          alert('An unexpected error occurred');
        });
      }
    });
  });

  // User demotion functionality
  document.querySelectorAll('.demote-user').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const userName = link.getAttribute('data-user-name');
      if (confirm(`Are you sure you want to demote ${userName} to Member?\nThis will remove their administrative privileges.`)) {
        const userId = link.getAttribute('data-user-id');
        fetch('/handlers/demote_user.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `user_id=${encodeURIComponent(userId)}`
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Show success message and reload to update both tables
            alert(`${userName} has been demoted to Member successfully.`);
            window.location.reload();
          } else {
            alert(data.error || 'An error occurred while trying to demote the user');
          }
        })
        .catch(err => {
          console.error('Error:', err);
          alert('An unexpected error occurred');
        });
      }
    });
  });

  // SECTION: Venue Management Functionality
  // Venue Edit Modal Functionality
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('edit-venue')) {
      const venueId = e.target.getAttribute('data-venue-id');
      
      // Prevent editing venue ID 1
      if (venueId == 1) {
        alert('The default venue cannot be edited.');
        e.preventDefault();
        return;
      }
    }
  });
  
  const modal = document.getElementById('venue-edit-modal');
  if (modal) {
    const closeBtn = modal.querySelector('.close-button');
    const cancelBtn = modal.querySelector('.cancel-button');
    const editForm = document.getElementById('venue-edit-form');
    
    // Show modal when Edit button is clicked
    document.querySelectorAll('.edit-venue').forEach(link => {
      link.addEventListener('click', async (e) => {
        e.preventDefault();
        document.querySelector('#venue-edit-modal h2').textContent = 'Edit Venue';
        const venueId = link.getAttribute('data-venue-id');
        
        try {
          // Fetch venue data
          const response = await fetch(`/handlers/venue_handler.php?action=get&venue_id=${venueId}`);
          const data = await response.json();
          
          if (data.success) {
            // Populate form with venue data
            document.getElementById('venue_id').value = data.venue.venue_id;
            document.getElementById('venue_name').value = data.venue.venue_name || '';
            document.getElementById('venue_street').value = data.venue.venue_street || '';
            document.getElementById('venue_city').value = data.venue.venue_city || '';
            document.getElementById('venue_state_id').value = data.venue.venue_state_id || '';
            document.getElementById('venue_zip').value = data.venue.venue_zip || '';
            document.getElementById('stage_width').value = data.venue.stage_width || '';
            document.getElementById('stage_depth').value = data.venue.stage_depth || '';
            
            // Show modal
            modal.classList.remove('hidden');
            modal.classList.add('visible');
          } else {
            alert('Error loading venue information');
          }
        } catch (error) {
          console.error('Error:', error);
          alert('An unexpected error occurred');
        }
      });
    });
    
    // Close modal functions
    function closeModal() {
      modal.classList.add('hidden');
      modal.classList.remove('visible');
      editForm.reset();
    }
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Close when clicking outside the modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal();
    });
    
    // Handle form submission
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Clear any previous error messages
      const errorElements = editForm.querySelectorAll('.field-error');
      errorElements.forEach(el => el.remove());
      
      const formData = new FormData(editForm);
      formData.append('action', 'update');
      
      try {
        const response = await fetch('/handlers/venue_handler.php', {
          method: 'POST',
          body: formData
        });
        
        const data = await response.json();
        
        if (data.success) {
          // Close modal and refresh page to show updated data
          closeModal();
          window.location.reload();
        } else if (data.errors) {
          // Display field-specific errors
          for (const [field, message] of Object.entries(data.errors)) {
            const inputField = document.getElementById(field);
            if (inputField) {
              // Create error message element
              const errorSpan = document.createElement('span');
              errorSpan.className = 'field-error';
              errorSpan.textContent = message;
              errorSpan.style.color = 'red';
              errorSpan.style.fontSize = '12px';
              errorSpan.style.display = 'block';
              errorSpan.style.marginTop = '-10px';
              errorSpan.style.marginBottom = '10px';
              
              inputField.parentNode.insertBefore(errorSpan, inputField.nextSibling);
            }
          }
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An unexpected error occurred');
      }
    });
  }

  // Add New Venue button click handler
  if (document.getElementById('add-venue-button')) {
    document.getElementById('add-venue-button').addEventListener('click', () => {
      // Clear the form for a new venue
      const form = document.getElementById('venue-edit-form');
      form.reset();
      document.getElementById('venue_id').value = '';
      
      // Reset the state dropdown to the default "Select State" option
      const stateDropdown = document.getElementById('venue_state_id');
      stateDropdown.selectedIndex = 0;
      
      // Update modal title
      document.querySelector('#venue-edit-modal h2').textContent = 'Add New Venue';
      
      // Add save button if not present (or just show the form)
      const modal = document.getElementById('venue-edit-modal');
      modal.classList.remove('hidden');
      modal.classList.add('visible');
    });
  }

  // Venue removal functionality
  document.querySelectorAll('.remove-venue').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const venueName = link.getAttribute('data-venue-name');
      if (confirm(`Are you sure you want to delete ${venueName}?\nThis action cannot be undone!`)) {
        const venueId = link.getAttribute('data-venue-id');
        fetch('/handlers/venue_handler.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `action=delete&venue_id=${encodeURIComponent(venueId)}`
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Remove the row from the table
            link.closest('tr').remove();
          } else {
            alert(data.error || 'An error occurred while trying to delete the venue');
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

// Dropdown menu functionality
document.addEventListener('click', function(e) {
  // Toggle dropdown when clicking dropdown toggle button
  if (e.target.classList.contains('dropdown-toggle') || 
      e.target.parentNode.classList.contains('dropdown-toggle')) {
    
    // Close all other dropdowns first
    document.querySelectorAll('.dropdown-menu.active').forEach(menu => {
      if (!menu.closest('.dropdown').contains(e.target)) {
        menu.classList.remove('active');
      }
    });
    
    // Toggle clicked dropdown
    const dropdown = e.target.closest('.dropdown');
    const menu = dropdown.querySelector('.dropdown-menu');
    menu.classList.toggle('active');
    
    e.preventDefault();
    e.stopPropagation();
  }
  
  // Close all dropdowns when clicking outside
  else if (!e.target.closest('.dropdown')) {
    document.querySelectorAll('.dropdown-menu.active').forEach(menu => {
      menu.classList.remove('active');
    });
  }
});

// Make dropdowns work with keyboard navigation
document.querySelectorAll('.dropdown-toggle').forEach(button => {
  button.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      const menu = this.nextElementSibling;
      menu.classList.toggle('active');
      
      if (menu.classList.contains('active')) {
        const firstLink = menu.querySelector('a');
        if (firstLink) firstLink.focus();
      }
      
      e.preventDefault();
    }
  });
});

// Mobile menu functionality
document.addEventListener('DOMContentLoaded', function() {
  const mobileToggle = document.querySelector('.mobile-menu-toggle');
  const navContainer = document.getElementById('nav-container');
  
  if (mobileToggle && navContainer) {
    mobileToggle.addEventListener('click', function() {
      this.classList.toggle('active');
      navContainer.classList.toggle('active');
      
      // Toggle body scroll when menu is open
      document.body.classList.toggle('menu-open');
      
      // Set aria-expanded attribute for accessibility
      const isExpanded = navContainer.classList.contains('active');
      this.setAttribute('aria-expanded', isExpanded);
    });
    
    // Close mobile menu when clicking links
    const navLinks = navContainer.querySelectorAll('a');
    navLinks.forEach(link => {
      link.addEventListener('click', function() {
        mobileToggle.classList.remove('active');
        navContainer.classList.remove('active');
        document.body.classList.remove('menu-open');
      });
    });
  }
});
