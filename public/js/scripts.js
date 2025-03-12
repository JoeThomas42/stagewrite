/**
 * Main initialization function
 */
document.addEventListener("DOMContentLoaded", () => {
  // Set up manual scroll restoration
  setupScrollRestoration();
  
  // Initialize main feature areas
  initAuthForms();
  initUserManagement();
  initVenueManagement();  
  initSortableTables();
  initTableFilters();
  initMobileMenu();
  initDropdownMenus();
});

/**
 * Central function to save scroll position before any page reload
 */
function saveScrollPosition() {
  sessionStorage.setItem('scrollPosition', window.pageYOffset);
}

/**
 * Sets up scroll position preservation between page loads
 */
function setupScrollRestoration() {
  // Try to prevent browser's automatic scroll restoration
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }

  // Check if we need to restore scroll position
  if (sessionStorage.getItem('scrollPosition')) {
    // Prevent the flash of content at the top by setting position immediately
    document.documentElement.style.opacity = '0';
    
    // Restore scroll position right away
    window.scrollTo(0, parseInt(sessionStorage.getItem('scrollPosition')));
    
    // Fade the content back in
    setTimeout(function() {
      document.documentElement.style.opacity = '1';
      sessionStorage.removeItem('scrollPosition');
    }, 10);
  }
}

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
        // Redirect to home page
        window.location.href = '/index.php';
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
 * Initializes user management functionality
 * Handles user removal, status toggling, promotion, and demotion
 */
function initUserManagement() {
  initUserRemoval();
  initStatusToggle();
  initUserPromotion();
  initUserDemotion();
}

/**
 * Sets up user removal functionality
 */
function initUserRemoval() {
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
}

/**
 * Sets up user status toggle functionality
 */
function initStatusToggle() {
  document.querySelectorAll('.toggle-status').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      
      const userId = link.getAttribute('data-user-id');
      
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
}

/**
 * Sets up user promotion functionality
 */
function initUserPromotion() {
  document.querySelectorAll('.promote-user').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const userName = link.getAttribute('data-user-name');
      if (confirm(`Are you sure you want to promote ${userName} to Admin?\nThis will give them administrative privileges.`)) {
        saveScrollPosition();
        
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
            alert(`${userName} has been promoted to Admin successfully.`);
            window.location.reload();
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
}

/**
 * Sets up user demotion functionality
 */
function initUserDemotion() {
  document.querySelectorAll('.demote-user').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      const userName = link.getAttribute('data-user-name');
      if (confirm(`Are you sure you want to demote ${userName} to Member?\nThis will remove their administrative privileges.`)) {
        saveScrollPosition();
        
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
}

/**
 * Initializes venue management functionality
 * Handles venue editing, adding, and removing
 */
function initVenueManagement() {
  // Prevent editing default venue
  document.addEventListener('click', function(e) {
    if (e.target.classList.contains('edit-venue')) {
      const venueId = e.target.getAttribute('data-venue-id');
      
      if (venueId == 1) {
        alert('The default venue cannot be edited.');
        e.preventDefault();
        return;
      }
    }
  });
  
  initVenueEditModal();
  initVenueRemoval();
}

/**
 * Sets up venue edit modal functionality
 */
function initVenueEditModal() {
  const modal = document.getElementById('venue-edit-modal');
  if (!modal) return;
  
  const closeBtn = modal.querySelector('.close-button');
  const cancelBtn = modal.querySelector('.cancel-button');
  const editForm = document.getElementById('venue-edit-form');
  const saveButton = modal.querySelector('.save-button');
  
  // Store original venue data
  let originalVenueData = {};
  
  // Function to check if form has been modified
  function checkFormChanges() {
    // For a new venue (no original data), always enable the save button
    if (Object.keys(originalVenueData).length === 0) {
      saveButton.disabled = false;
      return;
    }
    
    // Compare current form values with original values
    const currentVenue = {
      venue_name: document.getElementById('venue_name').value,
      venue_street: document.getElementById('venue_street').value,
      venue_city: document.getElementById('venue_city').value,
      venue_state_id: document.getElementById('venue_state_id').value,
      venue_zip: document.getElementById('venue_zip').value,
      stage_width: document.getElementById('stage_width').value,
      stage_depth: document.getElementById('stage_depth').value
    };
    
    // Check if any value has changed
    let hasChanges = false;
    Object.keys(currentVenue).forEach(key => {
      if (currentVenue[key] != originalVenueData[key]) {
        hasChanges = true;
      }
    });
    
    // Enable or disable save button based on changes
    saveButton.disabled = !hasChanges;
  }
  
  // Add input event listeners to all form fields
  function addChangeListeners() {
    const formInputs = editForm.querySelectorAll('input, select');
    formInputs.forEach(input => {
      input.addEventListener('input', checkFormChanges);
      input.addEventListener('change', checkFormChanges);
    });
  }
  
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
          
          // Store original data for comparison
          originalVenueData = {
            venue_name: data.venue.venue_name || '',
            venue_street: data.venue.venue_street || '',
            venue_city: data.venue.venue_city || '',
            venue_state_id: data.venue.venue_state_id || '',
            venue_zip: data.venue.venue_zip || '',
            stage_width: data.venue.stage_width || '',
            stage_depth: data.venue.stage_depth || ''
          };
          
          // Initially disable save button since no changes made yet
          saveButton.disabled = true;
          
          // Add change listeners to all form fields
          addChangeListeners();
          
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
    originalVenueData = {}; // Clear original data
    saveButton.disabled = false; // Reset button state
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
    
    // Don't submit if save button is disabled (no changes)
    if (saveButton.disabled) {
      return;
    }
    
    // Save scroll position before potential page reload
    saveScrollPosition();
    
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
  
  // Add New Venue button click handler
  const addVenueButton = document.getElementById('add-venue-button');
  if (addVenueButton) {
    addVenueButton.addEventListener('click', () => {
      // Clear the form for a new venue
      editForm.reset();
      document.getElementById('venue_id').value = '';
      
      // Reset the state dropdown to the default "Select State" option
      const stateDropdown = document.getElementById('venue_state_id');
      stateDropdown.selectedIndex = 0;
      
      // Update modal title
      document.querySelector('#venue-edit-modal h2').textContent = 'Add New Venue';
      
      // Clear original data for new venue (enable save button by default)
      originalVenueData = {};
      saveButton.disabled = false;
      
      // Add change listeners to all form fields
      addChangeListeners();
      
      // Show the form
      modal.classList.remove('hidden');
      modal.classList.add('visible');
    });
  }
}

/**
 * Sets up venue removal functionality
 */
function initVenueRemoval() {
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
}

/**
 * Initializes dropdown menu functionality
 */
function initDropdownMenus() {
  // Toggle dropdown when clicking dropdown toggle button
  document.addEventListener('click', function(e) {
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
}

/**
 * Initializes mobile menu functionality
 */
function initMobileMenu() {
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
}

/**
 * Initializes sortable tables functionality
 */
function initSortableTables() {
  const sortableHeaders = document.querySelectorAll('th.sortable');
  
  sortableHeaders.forEach(header => {
    header.addEventListener('click', function(e) {
      // Store current scroll position before navigating
      sessionStorage.setItem('scrollPosition', window.pageYOffset);
      
      // Show loading overlay
      const overlay = document.createElement('div');
      overlay.className = 'sort-loading-overlay';
      document.body.appendChild(overlay);
      
      const column = this.getAttribute('data-column');
      
      // Get current URL and params
      const url = new URL(window.location);
      const currentSort = url.searchParams.get('sort');
      const currentOrder = url.searchParams.get('order');
      
      // Determine new sort state (3-state toggle)
      if (currentSort === column && currentOrder === 'asc') {
        // First click on this column -> sort descending
        url.searchParams.set('sort', column);
        url.searchParams.set('order', 'desc');
      } else if (currentSort === column && currentOrder === 'desc') {
        // Second click on this column -> reset to default sort
        url.searchParams.delete('sort');
        url.searchParams.delete('order');
      } else {
        // Either first time clicking or coming from reset state -> sort ascending
        url.searchParams.set('sort', column);
        url.searchParams.set('order', 'asc');
      }
      
      // Add a small delay to ensure the overlay is visible
      setTimeout(function() {
        // Navigate to the new URL
        window.location = url.toString();
      }, 50);
    });
  });
}

/**
 * Initializes table filters for searching
 */
function initTableFilters() {
  // Setup filter functionality for each search field
  setupTableFilter('admin-search', 'admins-table', [1, 2]); // Name and Email columns
  setupTableFilter('member-search', 'members-table', [1, 2]); // Name and Email columns
  setupTableFilter('venue-search', 'venues-table', [1, 2, 3]); // Name, City, State columns
}

/**
 * Sets up filtering functionality for a specific table
 * @param {string} searchId - The ID of the search input field
 * @param {string} tableId - The ID of the table to filter
 * @param {Array<number>} columnIndexes - Array of column indexes to search within
 */
function setupTableFilter(searchId, tableId, columnIndexes) {
  const searchInput = document.getElementById(searchId);
  if (!searchInput) return; // Skip if element doesn't exist on current page
  
  const table = document.getElementById(tableId);
  if (!table) return;
  
  // Get all rows except the header
  const rows = Array.from(table.querySelectorAll('tr')).slice(1);
  
  // Add event listener for real-time filtering
  searchInput.addEventListener('input', function() {
    filterTable(this.value, rows, columnIndexes, table);
  });
  
  // Add clear button functionality
  const clearIcon = searchInput.parentNode.querySelector('.clear-icon');
  if (clearIcon) {
    clearIcon.addEventListener('click', function() {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input')); // Trigger filtering
      searchInput.focus();
    });
  }
}

/**
 * Filters table rows based on search query
 * @param {string} searchQuery - The text to search for
 * @param {Array<HTMLElement>} rows - Array of table rows to filter
 * @param {Array<number>} columnIndexes - Array of column indexes to search within
 * @param {HTMLElement} table - The table element
 */
function filterTable(searchQuery, rows, columnIndexes, table) {
  searchQuery = searchQuery.toLowerCase().trim();
  
  // Show all rows if search is empty
  if (searchQuery === '') {
    rows.forEach(row => row.style.display = '');
    
    // Remove any "no results" message
    const noResultsMsg = table.querySelector('.no-results-message');
    if (noResultsMsg) {
      noResultsMsg.remove();
    }
    return;
  }
  
  // Filter rows
  let visibleCount = 0;
  rows.forEach(row => {
    let match = false;
    
    // Check each relevant column
    columnIndexes.forEach(index => {
      const cell = row.cells[index];
      if (cell) {
        const text = cell.textContent.toLowerCase();
        if (text.includes(searchQuery)) {
          match = true;
        }
      }
    });
    
    // Show/hide row based on match
    row.style.display = match ? '' : 'none';
    if (match) visibleCount++;
  });
  
  // Display message if no results found
  let noResultsMsg = table.querySelector('.no-results-message');
  
  if (visibleCount === 0) {
    if (!noResultsMsg) {
      noResultsMsg = document.createElement('tr');
      noResultsMsg.className = 'no-results-message';
      const cell = document.createElement('td');
      cell.colSpan = table.rows[0].cells.length;
      cell.textContent = 'No matching results found';
      cell.style.textAlign = 'center';
      cell.style.padding = '1rem';
      noResultsMsg.appendChild(cell);
      table.appendChild(noResultsMsg);
    }
  } else if (noResultsMsg) {
    noResultsMsg.remove();
  }
}
