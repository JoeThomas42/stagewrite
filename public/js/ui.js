/**
 * StageWrite UI Module
 * Handles common UI components: dropdowns, mobile menu, tables, and filters
 */

/**
 * Sets up a two-step confirmation for a button
 * @param {HTMLElement} button - The button element
 * @param {Function} confirmAction - The function to execute when confirmed
 * @param {Object} options - Customization options
 * @param {string} options.confirmText - Text to show during confirmation state
 * @param {string} options.confirmTitle - Title/tooltip to show during confirmation state
 * @param {string} options.originalText - Text to revert to after timeout (if not specified, original innerHTML is used)
 * @param {string} options.originalTitle - Title/tooltip to revert to after timeout
 * @param {number} options.timeout - Timeout in milliseconds before reverting (default: 3000)
 * @param {boolean} options.stopPropagation - Whether to stop event propagation (default: false)
 * @param {Event} options.event - The event object if event propagation needs to be stopped
 */
function setupConfirmButton(button, confirmAction, options = {}) {
  // Set default options
  const timeout = options.timeout || 3000;
  const originalText = options.originalText || button.innerHTML;
  const originalTitle = options.originalTitle || button.getAttribute('title') || '';
  
  // Handle event propagation if specified
  if (options.stopPropagation && options.event) {
    options.event.stopPropagation();
  }
  
  if (button.classList.contains('confirming')) {
    // This is the second click (confirmation)
    confirmAction();
    
    // Reset button appearance after action
    button.classList.remove('confirming');
    
    // Restore the original content after a small delay
    setTimeout(() => {
      button.innerHTML = originalText;
      button.setAttribute('title', originalTitle);
    }, 150);
  } else {
    // This is the first click - first add the class then change content
    const originalContent = button.innerHTML;
    
    // Add class first to trigger width transition
    button.classList.add('confirming');
    
    // Change content after a small delay to let width transition start
    setTimeout(() => {
      if (options.confirmText) {
        button.textContent = options.confirmText;
      }
      if (options.confirmTitle) {
        button.setAttribute('title', options.confirmTitle);
      }
    }, 50);
    
    // Reset after a timeout if not clicked
    setTimeout(() => {
      if (button.classList.contains('confirming')) {
        // First remove the class to trigger width transition
        button.classList.remove('confirming');
        
        // After transition starts, restore original content
        setTimeout(() => {
          button.innerHTML = originalContent;
          button.setAttribute('title', originalTitle);
        }, 150);
      }
    }, timeout);
  }
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
 * @param {string} tableType - Type of table (members, admins, venues)
 */
function setupTableFilter(searchId, tableId, tableType) {
  const searchInput = document.getElementById(searchId);
  if (!searchInput) return; // Skip if element doesn't exist on current page
  
  const table = document.getElementById(tableId);
  if (!table) return;
  
  let searchTimer;
  
  // Add event listener for real-time filtering
  searchInput.addEventListener('input', function() {
      const searchTerm = this.value.trim();
      
      // Clear previous timer
      clearTimeout(searchTimer);
      
      // Set a slight delay to prevent too many requests
      searchTimer = setTimeout(function() {
          // Fetch filtered data from server
          fetch(`/handlers/filter_tables.php?table=${tableType}&query=${encodeURIComponent(searchTerm)}`)
              .then(response => response.json())
              .then(data => {
                  if (data.success) {
                      updateTableWithFilteredData(table, data.data, tableType);
                  } else {
                      console.error('Error filtering table:', data.error);
                  }
              })
              .catch(error => {
                  console.error('Error fetching filtered data:', error);
              });
      }, 300);
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

// Helper function to update table with filtered data
function updateTableWithFilteredData(table, data, tableType) {
  // Get the header row (first row)
  const headerRow = table.rows[0];
  const headerCells = headerRow ? headerRow.cells.length : 0;
  
  // Clear all rows except header
  while (table.rows.length > 1) {
      table.deleteRow(1);
  }
  
  // If no results, show message
  if (data.length === 0) {
      const row = table.insertRow();
      const cell = row.insertCell(0);
      cell.colSpan = headerCells;
      cell.className = 'no-results-message';
      cell.textContent = 'No matching results found';
      return;
  }
  
  // Add rows for each data item
  data.forEach(item => {
      const row = table.insertRow();
      
      if (tableType === 'members' || tableType === 'admins') {
          // User row
          addCell(row, item.user_id, 'ID');
          addCell(row, `${item.first_name} ${item.last_name}`, 'Name');
          addCell(row, item.email, 'Email');
          addCell(row, item.is_active ? 'Active' : 'Inactive', 'Status');
          
          // Add actions cell
          const actionsCell = row.insertCell();
          actionsCell.className = 'action-cell';
          actionsCell.setAttribute('data-label', 'Actions');
          
          if (tableType === 'members') {
              actionsCell.innerHTML = createMemberActionsDropdown(item);
          } else {
              actionsCell.innerHTML = createAdminActionsDropdown(item);
          }
      } else if (tableType === 'venues') {
          // Venue row
          addCell(row, item.venue_id, 'ID');
          addCell(row, item.venue_name, 'Name');
          addCell(row, item.venue_city || '—', 'City');
          addCell(row, item.state_abbr || '—', 'State');
          
          // Add actions cell
          const actionsCell = row.insertCell();
          actionsCell.className = 'action-cell';
          actionsCell.setAttribute('data-label', 'Actions');
          actionsCell.innerHTML = createVenueActionsDropdown(item);
      }
  });
  
  // Re-initialize dropdown menus and action buttons
  initDropdownMenus();
  initUserRemoval();
  initStatusToggle();
  initUserPromotion();
  initUserDemotion();
  initVenueRemoval();
  initVenueEditModal();
}

// Helper function to add a cell to a row
function addCell(row, content, label) {
  const cell = row.insertCell();
  cell.textContent = content;
  cell.setAttribute('data-label', label);
  return cell;
}

// Helper functions to create action dropdowns
function createMemberActionsDropdown(user) {
  return `
      <div class="dropdown">
          <button class="dropdown-toggle">Actions <span class="dropdown-arrow">▼</span></button>
          <div class="dropdown-menu">
              <a href="#" class="toggle-status" data-user-id="${user.user_id}" data-status="${user.is_active}">Toggle Status</a>
              <a href="#" class="remove-user" data-user-id="${user.user_id}" data-user-name="${user.first_name} ${user.last_name}">Remove</a>
          </div>
      </div>
  `;
}

function createAdminActionsDropdown(user) {
  return `
      <div class="dropdown">
          <button class="dropdown-toggle">Actions <span class="dropdown-arrow">▼</span></button>
          <div class="dropdown-menu">
              <a href="#" class="toggle-status" data-user-id="${user.user_id}" data-status="${user.is_active}">Toggle Status</a>
              <a href="#" class="demote-user" data-user-id="${user.user_id}" data-user-name="${user.first_name} ${user.last_name}">Demote to Member</a>
              <a href="#" class="remove-user" data-user-id="${user.user_id}" data-user-name="${user.first_name} ${user.last_name}">Remove</a>
          </div>
      </div>
  `;
}

function createVenueActionsDropdown(venue) {
  if (venue.venue_id == 1) {
      return `
          <div class="dropdown">
              <button class="dropdown-toggle">Actions <span class="dropdown-arrow">▼</span></button>
              <div class="dropdown-menu">
                  <span class="disabled-action">Default Venue (Cannot Edit)</span>
              </div>
          </div>
      `;
  } else {
      return `
          <div class="dropdown">
              <button class="dropdown-toggle">Actions <span class="dropdown-arrow">▼</span></button>
              <div class="dropdown-menu">
                  <a href="#" class="edit-venue" data-venue-id="${venue.venue_id}">Edit</a>
                  <a href="#" class="remove-venue" data-venue-id="${venue.venue_id}" data-venue-name="${venue.venue_name}">Delete</a>
              </div>
          </div>
      `;
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

/**
 * Initializes table interactions including pagination
 */
function initTableInteractions() {
  // Set up pagination links to preserve scroll position
  document.querySelectorAll('.pagination-link:not(.disabled)').forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Store current scroll position before navigating
      sessionStorage.setItem('scrollPosition', window.pageYOffset);
      
      // Show loading overlay
      const overlay = document.createElement('div');
      overlay.className = 'sort-loading-overlay';
      document.body.appendChild(overlay);
      
      // Get the destination URL
      const destinationUrl = this.getAttribute('href');
      
      // Add a small delay to ensure the overlay is visible
      setTimeout(function() {
        // Continue with navigation to the pagination URL
        window.location.href = destinationUrl;
      }, 50);
    });
  });
}

// ---------------------------- Custom Dropdown Menus -----------------------------------

/**
 * Initialize custom dropdowns by replacing all select elements with custom dropdown menus
 */
function initCustomDropdowns() {
  // Find all select elements to convert
  const selects = document.querySelectorAll('select:not(.no-custom)');
  
  selects.forEach(select => {
    createCustomDropdown(select);
  });
  
  // Close all dropdowns when clicking outside
  document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-dropdown')) {
      closeAllDropdowns();
    }
  });
  
  // Handle keyboard navigation
  document.addEventListener('keydown', handleDropdownKeyboard);
}

/**
 * Create a custom dropdown for a select element
 * @param {HTMLSelectElement} select - The select element to replace
 */
function createCustomDropdown(select) {
  // Create custom dropdown container
  const dropdown = document.createElement('div');
  dropdown.className = 'custom-dropdown';
  dropdown.setAttribute('tabindex', '0');
  dropdown.setAttribute('data-id', select.id || generateUniqueId());
  
  // Create dropdown header
  const header = document.createElement('div');
  header.className = 'custom-dropdown-header';
  
  // Create selected option display
  const selectedOption = document.createElement('div');
  selectedOption.className = 'selected-option';
  
  // Create dropdown arrow
  const arrow = document.createElement('span');
  arrow.className = 'custom-dropdown-arrow';
  arrow.innerHTML = '▼';
  
  header.appendChild(selectedOption);
  header.appendChild(arrow);
  dropdown.appendChild(header);
  
  // Create dropdown menu
  const menu = document.createElement('div');
  menu.className = 'custom-dropdown-menu';
  dropdown.appendChild(menu);
  
  // Hide original select
  select.style.display = 'none';
  select.setAttribute('aria-hidden', 'true');
  
  // Insert custom dropdown next to the original select
  select.parentNode.insertBefore(dropdown, select);
  
  // Move the original select inside our custom dropdown (hidden)
  dropdown.appendChild(select);
  
  // Populate the dropdown menu
  populateDropdownMenu(dropdown, select);
  
  // Set initial selected option
  updateSelectedOption(dropdown, select);
  
  // Add event listeners
  addDropdownEventListeners(dropdown, select);
}

/**
 * Populate dropdown menu with options from the select element
 * @param {HTMLElement} dropdown - The custom dropdown container
 * @param {HTMLSelectElement} select - The original select element
 */
function populateDropdownMenu(dropdown, select) {
  const menu = dropdown.querySelector('.custom-dropdown-menu');
  menu.innerHTML = '';
  
  const options = select.querySelectorAll('option');
  const optgroups = select.querySelectorAll('optgroup');
  
  // If there are optgroups, we need special handling
  if (optgroups.length > 0) {
    Array.from(select.children).forEach(child => {
      if (child.tagName === 'OPTGROUP') {
        // Create optgroup header
        const optgroupElement = document.createElement('div');
        optgroupElement.className = 'custom-dropdown-optgroup';
        optgroupElement.textContent = child.label;
        menu.appendChild(optgroupElement);
        
        // Add options in this group
        Array.from(child.children).forEach(option => {
          const optionElement = createOptionElement(option, true);
          menu.appendChild(optionElement);
        });
      } else if (child.tagName === 'OPTION') {
        // Add option outside groups
        const optionElement = createOptionElement(child, false);
        menu.appendChild(optionElement);
      }
    });
  } else {
    // No optgroups, just add all options
    options.forEach(option => {
      const optionElement = createOptionElement(option, false);
      menu.appendChild(optionElement);
    });
  }
}

/**
 * Create a dropdown option element
 * @param {HTMLOptionElement} option - The original option element
 * @param {boolean} isInGroup - Whether the option is in an optgroup
 * @returns {HTMLElement} The created option element
 */
function createOptionElement(option, isInGroup) {
  const optionElement = document.createElement('div');

  // Start with base class
  optionElement.className = 'custom-dropdown-option'; 
  // Copy all classes from the original option element
  if (option.classList.length > 0) {
      option.classList.forEach(cls => {
          // Avoid adding 'custom-dropdown-option' twice if it somehow exists on source
          if (cls !== 'custom-dropdown-option') {
              optionElement.classList.add(cls);
          }
      });
  }

  if (isInGroup) {
    // Add optgroup-specific class if needed (already handles this)
    optionElement.classList.add('optgroup-option');
  }
  optionElement.setAttribute('data-value', option.value);
  optionElement.textContent = option.textContent;
  optionElement.setAttribute('tabindex', '-1'); // Make focusable programmatically

  if (option.disabled) {
    // Add disabled class (already handles this)
    optionElement.classList.add('disabled');
  }

  if (option.selected) {
    // Add selected class (already handles this)
    optionElement.classList.add('selected');
  }

  return optionElement;
}

/**
 * Update the displayed selected option
 * @param {HTMLElement} dropdown - The custom dropdown container
 * @param {HTMLSelectElement} select - The original select element
 */
function updateSelectedOption(dropdown, select) {
  const selectedOption = dropdown.querySelector('.selected-option');
  const selectedIndex = select.selectedIndex;
  
  if (selectedIndex >= 0) {
    const optionText = select.options[selectedIndex].textContent;
    selectedOption.textContent = optionText;
    selectedOption.classList.remove('placeholder');
  } else {
    selectedOption.textContent = select.getAttribute('placeholder') || 'Select an option';
    selectedOption.classList.add('placeholder');
  }
  
  // Update selected class in menu
  const menuOptions = dropdown.querySelectorAll('.custom-dropdown-option');
  menuOptions.forEach(option => {
    option.classList.remove('selected');
    if (option.getAttribute('data-value') === select.value) {
      option.classList.add('selected');
    }
  });
}

/**
 * Add event listeners to dropdown
 * @param {HTMLElement} dropdown - The custom dropdown container
 * @param {HTMLSelectElement} select - The original select element
 */
function addDropdownEventListeners(dropdown, select) {
  // Toggle dropdown on click
  dropdown.querySelector('.custom-dropdown-header').addEventListener('click', () => {
    toggleDropdown(dropdown);
  });
  
  // Handle option selection
  const menuOptions = dropdown.querySelectorAll('.custom-dropdown-option');
  menuOptions.forEach(option => {
    option.addEventListener('click', (e) => {
      if (option.classList.contains('disabled')) {
        e.stopPropagation();
        return;
      }
      
      selectOption(dropdown, select, option.getAttribute('data-value'));
      closeDropdown(dropdown);
      
      // Trigger change event on the select
      const event = new Event('change', { bubbles: true });
      select.dispatchEvent(event);
    });
  });
  
  // Focus/blur handling for visual feedback
  dropdown.addEventListener('focus', () => {
    dropdown.classList.add('focus');
  });
  
  dropdown.addEventListener('blur', () => {
    dropdown.classList.remove('focus');
  });
  
  // Handle keyboard navigation
  dropdown.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleDropdown(dropdown);
    } else if (e.key === 'Escape') {
      closeDropdown(dropdown);
    }
  });
}

/**
 * Handle keyboard navigation for dropdown menus
 * @param {KeyboardEvent} e - The keyboard event
 */
function handleDropdownKeyboard(e) {
  const openDropdown = document.querySelector('.custom-dropdown.open');
  if (!openDropdown) return;
  
  const select = openDropdown.querySelector('select');
  const options = openDropdown.querySelectorAll('.custom-dropdown-option:not(.disabled)');
  const currentSelected = openDropdown.querySelector('.custom-dropdown-option.selected');
  
  let index = Array.from(options).indexOf(currentSelected);
  
  switch (e.key) {
    case 'ArrowDown':
      e.preventDefault();
      if (index < options.length - 1) {
        index++;
      } else {
        index = 0; // Loop back to top
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (index > 0) {
        index--;
      } else {
        index = options.length - 1; // Loop to bottom
      }
      break;
    case 'Home':
      e.preventDefault();
      index = 0;
      break;
    case 'End':
      e.preventDefault();
      index = options.length - 1;
      break;
    default:
      return; // Exit for other keys
  }
  
  // Focus and scroll to the option
  if (options[index]) {
    options[index].focus();
    options[index].scrollIntoView({ block: 'nearest' });
    
    // Update selection
    selectOption(openDropdown, select, options[index].getAttribute('data-value'));
    
    // Trigger change event on the select
    const event = new Event('change', { bubbles: true });
    select.dispatchEvent(event);
  }
}

/**
 * Toggle dropdown open/closed state
 * @param {HTMLElement} dropdown - The custom dropdown container
 */
function toggleDropdown(dropdown) {
  const isOpen = dropdown.classList.contains('open');
  
  // Close all other dropdowns first
  closeAllDropdowns();
  
  // Toggle this dropdown
  if (isOpen) {
    closeDropdown(dropdown);
  } else {
    openDropdown(dropdown);
  }
}

/**
 * Open a dropdown
 * @param {HTMLElement} dropdown - The custom dropdown container
 */
function openDropdown(dropdown) {
  dropdown.classList.add('open');
  
  // Focus the selected option if any
  const selectedOption = dropdown.querySelector('.custom-dropdown-option.selected');
  if (selectedOption) {
    selectedOption.focus();
    selectedOption.scrollIntoView({ block: 'nearest' });
  }
}

/**
 * Close a dropdown
 * @param {HTMLElement} dropdown - The custom dropdown container
 */
function closeDropdown(dropdown) {
  dropdown.classList.remove('open');
  dropdown.focus(); // Return focus to the dropdown itself
}

/**
 * Close all open dropdowns
 */
function closeAllDropdowns() {
  document.querySelectorAll('.custom-dropdown.open').forEach(openDropdown => {
    closeDropdown(openDropdown);
  });
}

/**
 * Select an option in the dropdown
 * @param {HTMLElement} dropdown - The custom dropdown container
 * @param {HTMLSelectElement} select - The original select element
 * @param {string} value - The value to select
 */
function selectOption(dropdown, select, value) {
  // Update the original select
  select.value = value;
  
  // Update the display
  updateSelectedOption(dropdown, select);
}

/**
 * Generate a unique ID for a dropdown
 * @returns {string} A unique ID
 */
function generateUniqueId() {
  return 'dropdown-' + Math.random().toString(36).substring(2, 10);
}

// Add event listeners to custom number spinners
function initCustomNumberInputs() {
  document.querySelectorAll('.input-dimensions .form-group').forEach(group => {
    const input = group.querySelector('input[type="number"]');
    if (!input) return;
    
    // Up arrow click
    group.addEventListener('click', function(e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Check if click is in the up arrow region
      if (x >= rect.width - 25 && y >= 30 && y <= 45) {
        const currentValue = Number(input.value) || 0;
        const step = Number(input.step) || 1;
        const max = input.max ? Number(input.max) : Infinity;
        input.value = Math.min(currentValue + step, max);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
      // Check if click is in the down arrow region
      else if (x >= rect.width - 25 && y >= 45 && y <= 60) {
        const currentValue = Number(input.value) || 0;
        const step = Number(input.step) || 1;
        const min = input.min ? Number(input.min) : 0;
        input.value = Math.max(currentValue - step, min);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
  });
}

/**
 * Initialize tooltips
 */
function initTooltips() {
  document.querySelectorAll('[title]').forEach(element => {
    // Skip elements that are already enhanced or don't need tooltips
    if (element.classList.contains('tooltip-enhanced') || 
        (element.classList.contains('close-button')) ||
        (element.classList.contains('delete-plot-btn')) ||
        (element.classList.contains('plot-card-snapshot')) ||
        (element.id.includes('delete-action-btn')) ||
        (element.classList.contains('modal-close-button'))) {
      return;
    }
    
    element.classList.add('tooltip-enhanced');
    
    const title = element.getAttribute('title');
    if (!title) return;
    
    // Store original title and remove to prevent default tooltip
    element.dataset.tooltip = title;
    element.removeAttribute('title');
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = title;
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '5px 10px';
    tooltip.style.borderRadius = '3px';
    tooltip.style.fontSize = '12px';
    tooltip.style.zIndex = '9999';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.3s ease';
    
    // Add tooltip to body
    document.body.appendChild(tooltip);
    
    // Show tooltip on hover
    element.addEventListener('mouseenter', (e) => {
      tooltip.style.opacity = '1';
      positionTooltip(tooltip, element);
    });
    
    // Hide tooltip on leave
    element.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
    
    // Update position on scroll and resize
    window.addEventListener('scroll', () => {
      if (tooltip.style.opacity === '1') {
        positionTooltip(tooltip, element);
      }
    });
    
    window.addEventListener('resize', () => {
      if (tooltip.style.opacity === '1') {
        positionTooltip(tooltip, element);
      }
    });
  });
}

/**
 * Position tooltip relative to element
 * @param {HTMLElement} tooltip - The tooltip element
 * @param {HTMLElement} element - The element to position relative to
 */
function positionTooltip(tooltip, element) {
  const rect = element.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  // Position above element by default
  let top = rect.top - tooltipRect.height - 5;
  let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
  
  // If tooltip would be off the top of the screen, position below element
  if (top < 5) {
    top = rect.bottom + 5;
  }
  
  // Adjust horizontal position if needed
  if (left < 5) {
    left = 5;
  } else if (left + tooltipRect.width > window.innerWidth - 5) {
    left = window.innerWidth - tooltipRect.width - 5;
  }
  
  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
}

// ------------------ Make UI functions available globally ---------------------
window.setupConfirmButton = setupConfirmButton;
window.initDropdownMenus = initDropdownMenus;
window.initMobileMenu = initMobileMenu;
window.initSortableTables = initSortableTables;
window.initTableFilters = initTableFilters;
window.setupTableFilter = setupTableFilter;
window.filterTable = filterTable;
window.initTableInteractions = initTableInteractions;
window.initCustomDropdowns = initCustomDropdowns;
window.initCustomNumberInputs = initCustomNumberInputs;
window.initTooltips = initTooltips;
