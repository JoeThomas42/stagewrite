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

/**
 * Add city autocomplete with support for any state format
 */
function initCityAutocomplete() {
  const cityInput = document.getElementById('venue_city');
  const stateSelect = document.getElementById('venue_state_id');
  
  if (!cityInput || !stateSelect) {
    console.log('City autocomplete: Missing required elements');
    return;
  }
  
  // Disable browser's native autocomplete
  cityInput.setAttribute('autocomplete', 'new-city'); // Using a non-standard value
  cityInput.setAttribute('aria-autocomplete', 'list');
  
  // Create a container for autocomplete suggestions
  const autoCompleteContainer = document.createElement('div');
  autoCompleteContainer.className = 'autocomplete-items custom-dropdown-menu';
  autoCompleteContainer.style.display = 'none';
  
  // Make sure parent has position relative
  cityInput.parentNode.style.position = 'relative';
  cityInput.parentNode.appendChild(autoCompleteContainer);
  
  // Store fetched cities for each state to avoid repeated API calls
  const stateCitiesCache = {};
  
  // Map of state names to abbreviations
  const stateAbbreviations = {
    "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
    "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
    "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
    "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
    "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO",
    "montana": "MT", "nebraska": "NE", "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ",
    "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH",
    "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
    "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT",
    "virginia": "VA", "washington": "WA", "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
    "district of columbia": "DC"
  };
  
  /**
   * Get state abbreviation from state name
   */
  function getStateAbbr(stateText) {
    const lowerText = stateText.toLowerCase();
    for (const stateName in stateAbbreviations) {
      if (lowerText.includes(stateName)) {
        return stateAbbreviations[stateName];
      }
    }
    return null;
  }
  
  // Enhanced mock data with major cities for common states (abbreviated for space)
  const mockCityData = {
    "AL": ["Birmingham", "Montgomery", "Mobile", "Huntsville", "Tuscaloosa"],
    "AK": ["Anchorage", "Fairbanks", "Juneau", "Sitka", "Ketchikan"],
    "AZ": ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Glendale", "Gilbert", "Tempe"],
    "AR": ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro"],
    "CA": ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach"],
    // ...more states would be included in your implementation
  };
  
  // Handle state selection change
  stateSelect.addEventListener('change', function() {
    cityInput.value = ''; // Clear city when state changes
    autoCompleteContainer.style.display = 'none';
    
    // Get state abbreviation
    const stateId = this.value;
    if (!stateId) return;
    
    const stateOption = this.options[this.selectedIndex];
    const stateText = stateOption.textContent;
    
    // Get state abbreviation with more flexible matching
    const stateAbbr = getStateAbbr(stateText);
    
    if (!stateAbbr) return;
    
    // If we already have cities for this state in cache, don't fetch again
    if (!stateCitiesCache[stateAbbr]) {
      // Use mock data directly
      useMockDataForState(stateAbbr);
    }
  });
  
  // Use mock data for a state
  function useMockDataForState(stateAbbr) {
    if (mockCityData[stateAbbr]) {
      stateCitiesCache[stateAbbr] = mockCityData[stateAbbr];
    } else {
      // Generate generic placeholder cities
      stateCitiesCache[stateAbbr] = [
        `${stateAbbr} City`, `${stateAbbr} Town`, `North ${stateAbbr}`, 
        `South ${stateAbbr}`, `East ${stateAbbr}`, `West ${stateAbbr}`
      ];
    }
  }
  
  // Handle input in city field
  cityInput.addEventListener('input', function() {
    const stateId = stateSelect.value;
    if (!stateId) return;
    
    const stateOption = stateSelect.options[stateSelect.selectedIndex];
    const stateText = stateOption.textContent;
    const stateAbbr = getStateAbbr(stateText);
    
    if (!stateAbbr || !stateCitiesCache[stateAbbr]) return;
    
    const userInput = this.value.trim().toLowerCase();
    
    // Show matching cities on input
    displayMatchingCities(userInput, stateAbbr);
  });
  
  // Display matching cities based on user input
  function displayMatchingCities(userInput, stateAbbr) {
    // Filter cities based on user input
    let matchingCities;
    if (!userInput) {
      // If input is empty, show top cities (up to 8)
      matchingCities = stateCitiesCache[stateAbbr].slice(0, 8);
    } else {
      matchingCities = stateCitiesCache[stateAbbr].filter(city => 
        city.toLowerCase().includes(userInput)
      );
    }
    
    // Display matching cities
    if (matchingCities.length > 0) {
      autoCompleteContainer.innerHTML = '';
      matchingCities.forEach(city => {
        const item = document.createElement('div');
        item.className = 'autocomplete-item';
        item.textContent = city;
        item.addEventListener('click', function() {
          cityInput.value = city;
          autoCompleteContainer.style.display = 'none';
        });
        autoCompleteContainer.appendChild(item);
      });
      
      // Block browser downward auto-fill position before showing
      autoCompleteContainer.style.display = 'block';
    } else {
      autoCompleteContainer.style.display = 'none';
    }
  }
  
  // Show suggestions when clicking in the field
  cityInput.addEventListener('click', function() {
    const stateId = stateSelect.value;
    if (!stateId) return;
    
    const stateOption = stateSelect.options[stateSelect.selectedIndex];
    const stateText = stateOption.textContent;
    const stateAbbr = getStateAbbr(stateText);
    
    if (!stateAbbr || !stateCitiesCache[stateAbbr]) return;
    
    // Show suggestions based on any existing input
    const userInput = this.value.trim().toLowerCase();
    displayMatchingCities(userInput, stateAbbr);
  });
  
  // Hide autocomplete when clicking outside
  document.addEventListener('click', function(e) {
    if (e.target !== cityInput) {
      autoCompleteContainer.style.display = 'none';
    }
  });
}

/**
 * Add ZIP code auto-complete with strict state matching
 */
function initZipCodeAutoComplete() {
  const zipInput = document.getElementById('venue_zip');
  const cityInput = document.getElementById('venue_city');
  const stateSelect = document.getElementById('venue_state_id');
  
  if (!zipInput || !cityInput || !stateSelect) return;
  
  // Map of state abbreviations to their IDs in the select
  const stateAbbrToId = {};
  
  // Build state abbreviation mapping
  Array.from(stateSelect.options).forEach(option => {
    if (option.value) {
      // Get state name from option text
      const stateName = option.textContent.toLowerCase();
      
      // Map of state names to abbreviations
      const stateAbbreviations = {
        "alabama": "AL", "alaska": "AK", "arizona": "AZ", "arkansas": "AR", "california": "CA",
        "colorado": "CO", "connecticut": "CT", "delaware": "DE", "florida": "FL", "georgia": "GA",
        "hawaii": "HI", "idaho": "ID", "illinois": "IL", "indiana": "IN", "iowa": "IA",
        "kansas": "KS", "kentucky": "KY", "louisiana": "LA", "maine": "ME", "maryland": "MD",
        "massachusetts": "MA", "michigan": "MI", "minnesota": "MN", "mississippi": "MS", "missouri": "MO",
        "montana": "MT", "nebraska": "NE", "nevada": "NV", "new hampshire": "NH", "new jersey": "NJ",
        "new mexico": "NM", "new york": "NY", "north carolina": "NC", "north dakota": "ND", "ohio": "OH",
        "oklahoma": "OK", "oregon": "OR", "pennsylvania": "PA", "rhode island": "RI", "south carolina": "SC",
        "south dakota": "SD", "tennessee": "TN", "texas": "TX", "utah": "UT", "vermont": "VT",
        "virginia": "VA", "washington": "WA", "west virginia": "WV", "wisconsin": "WI", "wyoming": "WY",
        "district of columbia": "DC"
      };
      
      // Find which abbreviation matches this state name
      for (const name in stateAbbreviations) {
        if (stateName.includes(name)) {
          stateAbbrToId[stateAbbreviations[name]] = option.value;
          break;
        }
      }
    }
  });
  
  // Hard-coded ZIP code to city/state data for common ZIP codes
  const zipCodeData = {
    // New York
    "10001": { city: "New York", state: "NY" },
    "10016": { city: "New York", state: "NY" },
    "10019": { city: "New York", state: "NY" },
    // Los Angeles
    "90001": { city: "Los Angeles", state: "CA" },
    "90007": { city: "Los Angeles", state: "CA" },
    "90015": { city: "Los Angeles", state: "CA" },
    // Chicago
    "60601": { city: "Chicago", state: "IL" },
    "60607": { city: "Chicago", state: "IL" },
    "60614": { city: "Chicago", state: "IL" },
    // Houston
    "77001": { city: "Houston", state: "TX" },
    "77002": { city: "Houston", state: "TX" },
    "77019": { city: "Houston", state: "TX" },
    // Phoenix
    "85001": { city: "Phoenix", state: "AZ" },
    "85004": { city: "Phoenix", state: "AZ" },
    "85013": { city: "Phoenix", state: "AZ" },
    // Philadelphia
    "19102": { city: "Philadelphia", state: "PA" },
    "19103": { city: "Philadelphia", state: "PA" },
    "19106": { city: "Philadelphia", state: "PA" },
    // San Antonio
    "78201": { city: "San Antonio", state: "TX" },
    "78205": { city: "San Antonio", state: "TX" },
    "78210": { city: "San Antonio", state: "TX" },
    // San Diego
    "92101": { city: "San Diego", state: "CA" },
    "92107": { city: "San Diego", state: "CA" },
    "92111": { city: "San Diego", state: "CA" },
    // Dallas
    "75201": { city: "Dallas", state: "TX" },
    "75204": { city: "Dallas", state: "TX" },
    "75207": { city: "Dallas", state: "TX" },
    // San Jose
    "95110": { city: "San Jose", state: "CA" },
    "95112": { city: "San Jose", state: "CA" },
    "95116": { city: "San Jose", state: "CA" },
    // Austin
    "78701": { city: "Austin", state: "TX" },
    "78703": { city: "Austin", state: "TX" },
    "78704": { city: "Austin", state: "TX" },
    // Jacksonville
    "32202": { city: "Jacksonville", state: "FL" },
    "32204": { city: "Jacksonville", state: "FL" },
    "32207": { city: "Jacksonville", state: "FL" },
    // Fort Worth
    "76102": { city: "Fort Worth", state: "TX" },
    "76104": { city: "Fort Worth", state: "TX" },
    "76107": { city: "Fort Worth", state: "TX" },
    // Columbus
    "43201": { city: "Columbus", state: "OH" },
    "43204": { city: "Columbus", state: "OH" },
    "43215": { city: "Columbus", state: "OH" },
    // Charlotte
    "28202": { city: "Charlotte", state: "NC" },
    "28204": { city: "Charlotte", state: "NC" },
    "28207": { city: "Charlotte", state: "NC" },
    // Indianapolis
    "46202": { city: "Indianapolis", state: "IN" },
    "46204": { city: "Indianapolis", state: "IN" },
    "46208": { city: "Indianapolis", state: "IN" },
    // Seattle
    "98101": { city: "Seattle", state: "WA" },
    "98104": { city: "Seattle", state: "WA" },
    "98109": { city: "Seattle", state: "WA" },
    // Denver
    "80202": { city: "Denver", state: "CO" },
    "80204": { city: "Denver", state: "CO" },
    "80206": { city: "Denver", state: "CO" },
    // Boston
    "02108": { city: "Boston", state: "MA" },
    "02110": { city: "Boston", state: "MA" },
    "02116": { city: "Boston", state: "MA" },
    // Atlanta 
    "30303": { city: "Atlanta", state: "GA" },
    "30305": { city: "Atlanta", state: "GA" },
    "30308": { city: "Atlanta", state: "GA" }
  };
  
  zipInput.addEventListener('blur', function() {
    const zipCode = this.value.trim();
    if (zipCode.length !== 5 || !/^\d{5}$/.test(zipCode)) {
      return;
    }
    
    // Try our hardcoded data first
    if (zipCodeData[zipCode]) {
      const data = zipCodeData[zipCode];
      
      // Set city
      cityInput.value = data.city;
      
      // Set state if we have the mapping
      if (data.state && stateAbbrToId[data.state]) {
        stateSelect.value = stateAbbrToId[data.state];
        
        // Trigger change event
        const changeEvent = new Event('change');
        stateSelect.dispatchEvent(changeEvent);
        
        // Update custom dropdown if it exists
        updateCustomDropdown(stateSelect);
      }
      return;
    }
    
    // Fall back to API for other ZIP codes
    fetchZipCodeData(zipCode);
  });
  
  /**
   * Fetch ZIP code data from the API
   */
  async function fetchZipCodeData(zipCode) {
    try {
      const response = await fetch(`https://api.zippopotam.us/us/${zipCode}`);
      
      if (!response.ok) {
        console.log(`ZIP API error: ${response.status}`);
        return;
      }
      
      const data = await response.json();
      
      if (data.places && data.places.length > 0) {
        const place = data.places[0];
        
        // Set city
        cityInput.value = place['place name'];
        
        // Set state if we have the mapping
        const stateAbbr = place['state abbreviation'];
        if (stateAbbr && stateAbbrToId[stateAbbr]) {
          stateSelect.value = stateAbbrToId[stateAbbr];
          
          // Trigger change event
          const changeEvent = new Event('change');
          stateSelect.dispatchEvent(changeEvent);
          
          // Update custom dropdown if it exists
          updateCustomDropdown(stateSelect);
        }
      }
    } catch (error) {
      console.error('Error fetching ZIP code data:', error);
    }
  }
  
  /**
   * Update custom dropdown UI if it exists
   */
  function updateCustomDropdown(selectElement) {
    const customDropdown = selectElement.closest('.custom-dropdown');
    if (!customDropdown) return;
    
    // Get the selected option text
    const selectedOption = selectElement.options[selectElement.selectedIndex];
    if (!selectedOption) return;
    
    // Update the visible selected option text
    const selectedDisplay = customDropdown.querySelector('.selected-option');
    if (selectedDisplay) {
      selectedDisplay.textContent = selectedOption.textContent;
    }
    
    // Update the selected class in the dropdown menu
    const options = customDropdown.querySelectorAll('.custom-dropdown-option');
    options.forEach(option => {
      option.classList.remove('selected');
      if (option.getAttribute('data-value') === selectElement.value) {
        option.classList.add('selected');
      }
    });
  }
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
window.initCityAutocomplete = initCityAutocomplete;
window.initZipCodeAutoComplete = initZipCodeAutoComplete;
