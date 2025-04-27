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
  const timeout = options.timeout || 3000;
  const originalText = options.originalText || button.innerHTML;
  const originalTitle = options.originalTitle || button.getAttribute('title') || '';

  if (options.stopPropagation && options.event) {
    options.event.stopPropagation();
  }

  if (button.classList.contains('confirming')) {
    confirmAction();
    button.classList.remove('confirming');

    setTimeout(() => {
      button.innerHTML = originalText;
      button.setAttribute('title', originalTitle);
    }, 150);
  } else {
    const originalContent = button.innerHTML;
    button.classList.add('confirming');

    setTimeout(() => {
      if (options.confirmText) {
        button.textContent = options.confirmText;
      }
      if (options.confirmTitle) {
        button.setAttribute('title', options.confirmTitle);
      }
    }, 50);

    setTimeout(() => {
      if (button.classList.contains('confirming')) {
        button.classList.remove('confirming');

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
  document.addEventListener('click', function (e) {
    if (e.target.classList.contains('dropdown-toggle') || e.target.parentNode.classList.contains('dropdown-toggle')) {
      document.querySelectorAll('.dropdown-menu.active').forEach((menu) => {
        if (!menu.closest('.dropdown').contains(e.target)) {
          menu.classList.remove('active');
        }
      });

      const dropdown = e.target.closest('.dropdown');
      const menu = dropdown.querySelector('.dropdown-menu');
      menu.classList.toggle('active');

      e.preventDefault();
      e.stopPropagation();
    } else if (!e.target.closest('.dropdown')) {
      document.querySelectorAll('.dropdown-menu.active').forEach((menu) => {
        menu.classList.remove('active');
      });
    }
  });

  document.querySelectorAll('.dropdown-toggle').forEach((button) => {
    button.addEventListener('keydown', function (e) {
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
    mobileToggle.addEventListener('click', function () {
      this.classList.toggle('active');
      navContainer.classList.toggle('active');
      document.body.classList.toggle('menu-open');

      const isExpanded = navContainer.classList.contains('active');
      this.setAttribute('aria-expanded', isExpanded);
    });

    const navLinks = navContainer.querySelectorAll('a');
    navLinks.forEach((link) => {
      link.addEventListener('click', function () {
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

  sortableHeaders.forEach((header) => {
    header.addEventListener('click', function (e) {
      sessionStorage.setItem('scrollPosition', window.pageYOffset);

      const overlay = document.createElement('div');
      overlay.className = 'sort-loading-overlay';
      document.body.appendChild(overlay);

      const column = this.getAttribute('data-column');
      const url = new URL(window.location);
      const currentSort = url.searchParams.get('sort');
      const currentOrder = url.searchParams.get('order');

      if (currentSort === column && currentOrder === 'asc') {
        url.searchParams.set('sort', column);
        url.searchParams.set('order', 'desc');
      } else if (currentSort === column && currentOrder === 'desc') {
        url.searchParams.delete('sort');
        url.searchParams.delete('order');
      } else {
        url.searchParams.set('sort', column);
        url.searchParams.set('order', 'asc');
      }

      setTimeout(function () {
        window.location = url.toString();
      }, 50);
    });
  });
}

/**
 * Initializes table filters for searching via AJAX
 */
function initTableFilters() {
  setupTableFilter('admin-search', 'admins-table', 'admins', [1, 2]);
  setupTableFilter('member-search', 'members-table', 'members', [1, 2]);
  setupTableFilter('venue-search', 'venues-table', 'venues', [1, 2, 3]);
}

/**
 * Sets up filtering functionality for a specific table via AJAX
 * @param {string} searchId - The ID of the search input field
 * @param {string} tableId - The ID of the table to filter
 * @param {string} tableType - Type of table (members, admins, venues) used for API endpoint
 * @param {Array<number>} columnIndexes - Array of column indexes to search within (Note: currently unused as search is backend)
 */
function setupTableFilter(searchId, tableId, tableType, columnIndexes) {
  const searchInput = document.getElementById(searchId);
  if (!searchInput) return;

  const table = document.getElementById(tableId);
  if (!table) return;

  let searchTimer;

  searchInput.addEventListener('input', function () {
    const searchTerm = this.value.trim();
    clearTimeout(searchTimer);

    searchTimer = setTimeout(function () {
      fetch(`/handlers/filter_tables.php?table=${tableType}&query=${encodeURIComponent(searchTerm)}`)
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            updateTableWithFilteredData(table, data.data, tableType);
          } else {
            console.error('Error filtering table:', data.error);
          }
        })
        .catch((error) => {
          console.error('Error fetching filtered data:', error);
        });
    }, 300);
  });

  const clearIcon = searchInput.parentNode.querySelector('.clear-icon');
  if (clearIcon) {
    clearIcon.addEventListener('click', function () {
      searchInput.value = '';
      searchInput.dispatchEvent(new Event('input'));
      searchInput.focus();
    });
  }
}

/**
 * Updates the table body with new data received from the server after filtering.
 * Clears existing rows (except header) and populates with new data or a "no results" message.
 * Re-initializes necessary event listeners for the new rows.
 * @param {HTMLTableElement} table - The table element to update.
 * @param {Array<Object>} data - Array of data objects to populate the table with.
 * @param {string} tableType - The type of table ('members', 'admins', 'venues') to determine row structure.
 */
function updateTableWithFilteredData(table, data, tableType) {
  const headerRow = table.rows[0];
  const headerCells = headerRow ? headerRow.cells.length : 0;

  while (table.rows.length > 1) {
    table.deleteRow(1);
  }

  if (data.length === 0) {
    const row = table.insertRow();
    const cell = row.insertCell(0);
    cell.colSpan = headerCells;
    cell.className = 'no-results-message';
    cell.textContent = 'No matching results found';
    return;
  }

  data.forEach((item) => {
    const row = table.insertRow();

    if (tableType === 'members' || tableType === 'admins') {
      addCell(row, item.user_id, 'ID');
      addCell(row, `${item.first_name} ${item.last_name}`, 'Name');
      addCell(row, item.email, 'Email');
      addCell(row, item.is_active ? 'Active' : 'Inactive', 'Status');

      const actionsCell = row.insertCell();
      actionsCell.className = 'action-cell';
      actionsCell.setAttribute('data-label', 'Actions');

      if (tableType === 'members') {
        actionsCell.innerHTML = createMemberActionsDropdown(item);
      } else {
        actionsCell.innerHTML = createAdminActionsDropdown(item);
      }
    } else if (tableType === 'venues') {
      addCell(row, item.venue_id, 'ID');
      addCell(row, item.venue_name, 'Name');
      addCell(row, item.venue_city || '—', 'City');
      addCell(row, item.state_abbr || '—', 'State');

      const actionsCell = row.insertCell();
      actionsCell.className = 'action-cell';
      actionsCell.setAttribute('data-label', 'Actions');
      actionsCell.innerHTML = createVenueActionsDropdown(item);
    }
  });

  initDropdownMenus();
  initUserRemoval();
  initStatusToggle();
  initUserPromotion();
  initUserDemotion();
  initVenueRemoval();
  initVenueEditModal();
}

/**
 * Helper function to add a table cell (<td>) to a table row (<tr>).
 * Sets the cell's text content and a 'data-label' attribute for responsive tables.
 * @param {HTMLTableRowElement} row - The table row to add the cell to.
 * @param {string|number} content - The text content for the cell.
 * @param {string} label - The data label for the cell (used as a pseudo-header in responsive views).
 * @returns {HTMLTableCellElement} The newly created table cell element.
 */
function addCell(row, content, label) {
  const cell = row.insertCell();
  cell.textContent = content;
  cell.setAttribute('data-label', label);
  return cell;
}

/**
 * Creates the HTML string for the actions dropdown menu for a member row.
 * @param {Object} user - The user object containing member data (user_id, first_name, last_name, is_active).
 * @returns {string} HTML string representing the dropdown menu.
 */
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

/**
 * Creates the HTML string for the actions dropdown menu for an admin row.
 * @param {Object} user - The user object containing admin data (user_id, first_name, last_name, is_active).
 * @returns {string} HTML string representing the dropdown menu.
 */
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

/**
 * Creates the HTML string for the actions dropdown menu for a venue row.
 * Disables actions for the default venue (ID 1).
 * @param {Object} venue - The venue object containing venue data (venue_id, venue_name).
 * @returns {string} HTML string representing the dropdown menu.
 */
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
 * Filters table rows based on search query (Client-side implementation, potentially unused if AJAX filtering is active)
 * @param {string} searchQuery - The text to search for
 * @param {Array<HTMLElement>} rows - Array of table rows to filter
 * @param {Array<number>} columnIndexes - Array of column indexes to search within
 * @param {HTMLElement} table - The table element
 */
function filterTable(searchQuery, rows, columnIndexes, table) {
  searchQuery = searchQuery.toLowerCase().trim();

  if (searchQuery === '') {
    rows.forEach((row) => (row.style.display = ''));
    const noResultsMsg = table.querySelector('.no-results-message');
    if (noResultsMsg) {
      noResultsMsg.remove();
    }
    return;
  }

  let visibleCount = 0;
  rows.forEach((row) => {
    let match = false;
    columnIndexes.forEach((index) => {
      const cell = row.cells[index];
      if (cell) {
        const text = cell.textContent.toLowerCase();
        if (text.includes(searchQuery)) {
          match = true;
        }
      }
    });

    row.style.display = match ? '' : 'none';
    if (match) visibleCount++;
  });

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
 * Initializes table interactions including pagination links.
 * Ensures scroll position is preserved and a loading overlay is shown during navigation.
 */
function initTableInteractions() {
  document.querySelectorAll('.pagination-link:not(.disabled)').forEach((link) => {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      sessionStorage.setItem('scrollPosition', window.pageYOffset);

      const overlay = document.createElement('div');
      overlay.className = 'sort-loading-overlay';
      document.body.appendChild(overlay);

      const destinationUrl = this.getAttribute('href');
      setTimeout(function () {
        window.location.href = destinationUrl;
      }, 50);
    });
  });
}

/**
 * Initialize custom dropdowns by replacing all select elements with custom dropdown menus
 */
function initCustomDropdowns() {
  const selects = document.querySelectorAll('select:not(.no-custom)');
  selects.forEach((select) => {
    createCustomDropdown(select);
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.custom-dropdown')) {
      closeAllDropdowns();
    }
  });

  document.addEventListener('keydown', handleDropdownKeyboard);
}

/**
 * Create a custom dropdown for a select element
 * @param {HTMLSelectElement} select - The select element to replace
 */
function createCustomDropdown(select) {
  const dropdown = document.createElement('div');
  dropdown.className = 'custom-dropdown';
  dropdown.setAttribute('tabindex', '0');
  dropdown.setAttribute('data-id', select.id || generateUniqueId());

  const header = document.createElement('div');
  header.className = 'custom-dropdown-header';

  const selectedOption = document.createElement('div');
  selectedOption.className = 'selected-option';

  const arrow = document.createElement('span');
  arrow.className = 'custom-dropdown-arrow';
  arrow.innerHTML = '▼';

  header.appendChild(selectedOption);
  header.appendChild(arrow);
  dropdown.appendChild(header);

  const menu = document.createElement('div');
  menu.className = 'custom-dropdown-menu';
  dropdown.appendChild(menu);

  select.style.display = 'none';
  select.setAttribute('aria-hidden', 'true');
  select.parentNode.insertBefore(dropdown, select);
  dropdown.appendChild(select);

  populateDropdownMenu(dropdown, select);
  updateSelectedOption(dropdown, select);
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

  if (optgroups.length > 0) {
    Array.from(select.children).forEach((child) => {
      if (child.tagName === 'OPTGROUP') {
        const optgroupElement = document.createElement('div');
        optgroupElement.className = 'custom-dropdown-optgroup';
        optgroupElement.textContent = child.label;
        menu.appendChild(optgroupElement);

        Array.from(child.children).forEach((option) => {
          const optionElement = createOptionElement(option, true);
          menu.appendChild(optionElement);
        });
      } else if (child.tagName === 'OPTION') {
        const optionElement = createOptionElement(child, false);
        menu.appendChild(optionElement);
      }
    });
  } else {
    options.forEach((option) => {
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

  if (option.classList.length > 0) {
    option.classList.forEach((cls) => {
      if (cls !== 'custom-dropdown-option') {
        optionElement.classList.add(cls);
      }
    });
  }

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

  const menuOptions = dropdown.querySelectorAll('.custom-dropdown-option');
  menuOptions.forEach((option) => {
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
  dropdown.querySelector('.custom-dropdown-header').addEventListener('click', () => {
    toggleDropdown(dropdown);
  });

  const menuOptions = dropdown.querySelectorAll('.custom-dropdown-option');
  menuOptions.forEach((option) => {
    option.addEventListener('click', (e) => {
      if (option.classList.contains('disabled')) {
        e.stopPropagation();
        return;
      }

      selectOption(dropdown, select, option.getAttribute('data-value'));
      closeDropdown(dropdown);

      const event = new Event('change', { bubbles: true });
      select.dispatchEvent(event);
    });
  });

  dropdown.addEventListener('focus', () => {
    dropdown.classList.add('focus');
  });

  dropdown.addEventListener('blur', () => {
    dropdown.classList.remove('focus');
  });

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
        index = 0;
      }
      break;
    case 'ArrowUp':
      e.preventDefault();
      if (index > 0) {
        index--;
      } else {
        index = options.length - 1;
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
      return;
  }

  if (options[index]) {
    options[index].focus();
    options[index].scrollIntoView({ block: 'nearest' });

    selectOption(openDropdown, select, options[index].getAttribute('data-value'));

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
  closeAllDropdowns();

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
  dropdown.focus();
}

/**
 * Close all open dropdowns
 */
function closeAllDropdowns() {
  document.querySelectorAll('.custom-dropdown.open').forEach((openDropdown) => {
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
  select.value = value;
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
 * Initializes custom styled number inputs with up/down arrows.
 * Attaches click listeners to the form group containing the number input.
 */
function initCustomNumberInputs() {
  document.querySelectorAll('.input-dimensions .form-group').forEach((group) => {
    const input = group.querySelector('input[type="number"]');
    if (!input) return;

    group.addEventListener('click', function (e) {
      const rect = this.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      // Check coordinates to simulate arrow clicks
      if (x >= rect.width - 25 && y >= 30 && y <= 45) {
        // Up arrow area
        const currentValue = Number(input.value) || 0;
        const step = Number(input.step) || 1;
        const max = input.max ? Number(input.max) : Infinity;
        input.value = Math.min(currentValue + step, max);
        input.dispatchEvent(new Event('change', { bubbles: true }));
      } else if (x >= rect.width - 25 && y >= 45 && y <= 60) {
        // Down arrow area
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
 * Initializes tooltips for elements with a `title` attribute.
 * Replaces the default browser tooltip with a custom styled one.
 * Skips elements with specific classes or IDs known not to need enhancement.
 */
function initTooltips() {
  document.querySelectorAll('[title]').forEach((element) => {
    if (element.classList.contains('tooltip-enhanced') || element.classList.contains('close-button') || element.classList.contains('delete-plot-btn') || element.classList.contains('flip-btn') || element.classList.contains('plot-card-snapshot') || element.id.includes('delete-action-btn') || element.classList.contains('modal-close-button')) {
      return;
    }

    element.classList.add('tooltip-enhanced');
    const title = element.getAttribute('title');
    if (!title) return;

    element.dataset.tooltip = title;
    element.removeAttribute('title');

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

    document.body.appendChild(tooltip);

    element.addEventListener('mouseenter', (e) => {
      tooltip.style.opacity = '1';
      positionTooltip(tooltip, element);
    });

    element.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });

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
 * Position tooltip relative to element, attempting to place it above
 * and adjusting if it would go off-screen.
 * @param {HTMLElement} tooltip - The tooltip element
 * @param {HTMLElement} element - The element to position relative to
 */
function positionTooltip(tooltip, element) {
  const rect = element.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();

  let top = rect.top - tooltipRect.height - 5;
  let left = rect.left + rect.width / 2 - tooltipRect.width / 2;

  if (top < 5) {
    top = rect.bottom + 5;
  }

  if (left < 5) {
    left = 5;
  } else if (left + tooltipRect.width > window.innerWidth - 5) {
    left = window.innerWidth - tooltipRect.width - 5;
  }

  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
}

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
