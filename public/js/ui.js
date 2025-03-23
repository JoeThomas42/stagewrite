/**
 * StageWrite UI Module
 * Handles common UI components: dropdowns, mobile menu, tables, and filters
 */

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

/**
 * Add grid to stage for better positioning
 */
function initStageGrid() {
  const stage = document.getElementById('stage');
  if (!stage) return;
  
  // Check if grid toggle already exists
  if (stage.querySelector('.grid-toggle')) return;
  
  // Create grid toggle button
  const gridToggle = document.createElement('button');
  gridToggle.className = 'grid-toggle';
  gridToggle.innerHTML = '<i class="fa-solid fa-border-all"></i>';
  gridToggle.title = 'Toggle Grid';
  gridToggle.style.position = 'absolute';
  gridToggle.style.top = '5px';
  gridToggle.style.left = '5px';
  gridToggle.style.zIndex = '2';
  gridToggle.style.backgroundColor = 'rgba(82, 108, 129, 0.7)';
  gridToggle.style.border = 'none';
  gridToggle.style.borderRadius = '3px';
  gridToggle.style.color = 'white';
  gridToggle.style.cursor = 'pointer';
  gridToggle.style.fontSize = '12px';
  gridToggle.style.padding = '3px 6px';
  
  // Create grid overlay
  const gridOverlay = document.createElement('div');
  gridOverlay.className = 'grid-overlay';
  gridOverlay.style.position = 'absolute';
  gridOverlay.style.top = '0';
  gridOverlay.style.left = '0';
  gridOverlay.style.width = '100%';
  gridOverlay.style.height = '100%';
  gridOverlay.style.backgroundImage = 'linear-gradient(to right, rgba(82, 108, 129, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(82, 108, 129, 0.1) 1px, transparent 1px)';
  gridOverlay.style.backgroundSize = '50px 50px';
  gridOverlay.style.pointerEvents = 'none';
  gridOverlay.style.zIndex = '1';
  gridOverlay.style.opacity = '0';
  gridOverlay.style.transition = 'opacity 0.3s ease';
  
  stage.appendChild(gridToggle);
  stage.appendChild(gridOverlay);
  
  // Add toggle functionality
  let gridVisible = false;
  gridToggle.addEventListener('click', () => {
    gridVisible = !gridVisible;
    gridOverlay.style.opacity = gridVisible ? '1' : '0';
    gridToggle.style.backgroundColor = gridVisible ? 'rgba(82, 108, 129, 0.9)' : 'rgba(82, 108, 129, 0.7)';
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
  optionElement.className = 'custom-dropdown-option';
  if (isInGroup) {
    optionElement.classList.add('optgroup-option');
  }
  optionElement.setAttribute('data-value', option.value);
  optionElement.textContent = option.textContent;
  optionElement.setAttribute('tabindex', '-1');
  
  if (option.disabled) {
    optionElement.classList.add('disabled');
  }
  
  if (option.selected) {
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


// ------------------ Make UI functions available globally ---------------------
window.initDropdownMenus = initDropdownMenus;
window.initMobileMenu = initMobileMenu;
window.initSortableTables = initSortableTables;
window.initTableFilters = initTableFilters;
window.setupTableFilter = setupTableFilter;
window.filterTable = filterTable;
window.initTableInteractions = initTableInteractions;
window.initStageGrid = initStageGrid;
window.initCustomDropdowns = initCustomDropdowns;
