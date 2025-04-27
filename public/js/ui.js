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
window.initCustomDropdowns = initCustomDropdowns;
window.initCustomNumberInputs = initCustomNumberInputs;
window.initTooltips = initTooltips;
