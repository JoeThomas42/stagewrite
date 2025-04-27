/**
 * StageWrite Venue Management Module
 * Handles venue creation, editing, and removal
 */

/**
 * Initializes venue management functionality
 */
function initVenueManagement() {
  document.addEventListener('click', function (e) {
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
  initAddVenueModal();
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

  let originalVenueData = {};

  /**
   * Checks if the venue edit form has been modified compared to the original data.
   * Enables/disables the save button accordingly.
   */
  function checkFormChanges() {
    if (Object.keys(originalVenueData).length === 0) {
      saveButton.disabled = false;
      return;
    }

    const currentVenue = {
      venue_name: document.getElementById('venue_name').value,
      venue_street: document.getElementById('venue_street').value,
      venue_city: document.getElementById('venue_city').value,
      venue_state_id: document.getElementById('venue_state_id').value,
      venue_zip: document.getElementById('venue_zip').value,
      stage_width: document.getElementById('stage_width').value,
      stage_depth: document.getElementById('stage_depth').value,
    };

    let hasChanges = false;
    Object.keys(currentVenue).forEach((key) => {
      if (currentVenue[key] != originalVenueData[key]) {
        hasChanges = true;
      }
    });

    saveButton.disabled = !hasChanges;
  }

  /**
   * Adds 'input' and 'change' event listeners to all form fields
   * to detect modifications.
   */
  function addChangeListeners() {
    const formInputs = editForm.querySelectorAll('input, select');
    formInputs.forEach((input) => {
      input.addEventListener('input', checkFormChanges);
      input.addEventListener('change', checkFormChanges);
    });
  }

  document.querySelectorAll('.edit-venue').forEach((link) => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      document.querySelector('#venue-edit-modal h2').textContent = 'Edit Venue';
      const venueId = link.getAttribute('data-venue-id');

      try {
        const response = await fetch(`/handlers/venue_handler.php?action=get&venue_id=${venueId}`);
        const data = await response.json();

        if (data.success) {
          document.getElementById('venue_id').value = data.venue.venue_id;
          document.getElementById('venue_name').value = data.venue.venue_name || '';
          document.getElementById('venue_street').value = data.venue.venue_street || '';
          document.getElementById('venue_city').value = data.venue.venue_city || '';
          document.getElementById('venue_state_id').value = data.venue.venue_state_id || '';
          document.getElementById('venue_zip').value = data.venue.venue_zip || '';
          document.getElementById('stage_width').value = data.venue.stage_width || '';
          document.getElementById('stage_depth').value = data.venue.stage_depth || '';

          originalVenueData = {
            venue_name: data.venue.venue_name || '',
            venue_street: data.venue.venue_street || '',
            venue_city: data.venue.venue_city || '',
            venue_state_id: data.venue.venue_state_id || '',
            venue_zip: data.venue.venue_zip || '',
            stage_width: data.venue.stage_width || '',
            stage_depth: data.venue.stage_depth || '',
          };

          saveButton.disabled = true;
          addChangeListeners();
          openModal(modal);
        } else {
          alert('Error loading venue information');
        }
      } catch (error) {
        console.error('Error:', error);
        alert('An unexpected error occurred');
      }
    });
  });

  /**
   * Closes the venue edit modal, resets the form, and clears stored original data.
   */
  function closeVenueModal() {
    closeModal(modal);
    editForm.reset();
    originalVenueData = {};
    saveButton.disabled = false;
  }

  if (closeBtn) closeBtn.addEventListener('click', closeVenueModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeVenueModal);

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeVenueModal();
  });

  if (editForm) {
    editForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      if (saveButton.disabled) {
        return;
      }

      saveScrollPosition();

      const errorElements = editForm.querySelectorAll('.field-error');
      errorElements.forEach((el) => el.remove());

      const formData = new FormData(editForm);
      formData.append('action', 'update');

      try {
        const response = await fetch('/handlers/venue_handler.php', {
          method: 'POST',
          body: formData,
        });

        const data = await response.json();

        if (data.success) {
          closeVenueModal();
          window.location.reload();
        } else if (data.errors) {
          for (const [field, message] of Object.entries(data.errors)) {
            const inputField = document.getElementById(field);
            if (inputField) {
              const errorSpan = document.createElement('span');
              errorSpan.className = 'field-error';
              errorSpan.textContent = message;
              errorSpan.style.display = 'block';

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

  const addVenueButton = document.getElementById('add-venue-button');
  if (addVenueButton) {
    addVenueButton.addEventListener('click', () => {
      editForm.reset();
      document.getElementById('venue_id').value = '';

      const stateDropdown = document.getElementById('venue_state_id');
      stateDropdown.selectedIndex = 0;

      document.querySelector('#venue-edit-modal h2').textContent = 'Add New Venue';

      originalVenueData = {};
      saveButton.disabled = false;

      addChangeListeners();
      openModal(modal);
    });
  }
}

/**
 * Sets up venue removal functionality
 */
function initVenueRemoval() {
  document.querySelectorAll('.remove-venue').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const venueName = link.getAttribute('data-venue-name');
      if (confirm(`Are you sure you want to delete ${venueName}?\nThis action cannot be undone!`)) {
        const venueId = link.getAttribute('data-venue-id');
        fetch('/handlers/venue_handler.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: `action=delete&venue_id=${encodeURIComponent(venueId)}`,
        })
          .then((response) => response.json())
          .then((data) => {
            if (data.success) {
              link.closest('tr').remove();
            } else {
              alert(data.error || 'An error occurred while trying to delete the venue');
            }
          })
          .catch((err) => {
            console.error('Error:', err);
            alert('An unexpected error occurred');
          });
      }
    });
  });
}

/**
 * Initialize the "Add Venue" modal and functionality for user venues
 */
function initAddVenueModal() {
  const addVenueButton = document.getElementById('add-venue-button');
  const addVenueModal = document.getElementById('add-venue-modal');

  if (!addVenueButton || !addVenueModal) return;

  addVenueButton.addEventListener('click', () => {
    openModal(addVenueModal);
  });

  const venueForm = document.getElementById('add-venue-form');

  const closeBtn = addVenueModal.querySelector('.close-button');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal(addVenueModal));
  }

  const cancelBtn = addVenueModal.querySelector('.cancel-button');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => closeModal(addVenueModal));
  }

  addVenueModal.addEventListener('click', (e) => {
    if (e.target === addVenueModal) closeModal(addVenueModal);
  });

  if (venueForm) {
    venueForm.addEventListener('submit', (e) => {
      e.preventDefault();

      const venueName = document.getElementById('venue_name').value.trim();
      const stageWidth = document.getElementById('stage_width').value.trim();
      const stageDepth = document.getElementById('stage_depth').value.trim();
      const venueStreet = document.getElementById('venue_street').value.trim();
      const venueCity = document.getElementById('venue_city').value.trim();
      const venueStateId = document.getElementById('venue_state_id').value;
      const venueZip = document.getElementById('venue_zip').value.trim();

      if (!venueName) {
        alert('The venue must have a name.');
        return;
      }

      const venueData = {
        venue_name: venueName,
        venue_street: venueStreet || null,
        venue_city: venueCity || null,
        venue_state_id: venueStateId || null,
        venue_zip: venueZip || null,
        stage_width: stageWidth ? parseInt(stageWidth) : null,
        stage_depth: stageDepth ? parseInt(stageDepth) : null,
      };

      fetch('/handlers/save_user_venue.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(venueData),
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.success) {
            const venueSelect = document.getElementById('venue_select');
            if (venueSelect) {
              const userVenueGroup = venueSelect.querySelector('optgroup[label="My Venues"]');

              if (!userVenueGroup) {
                const newGroup = document.createElement('optgroup');
                newGroup.label = 'My Venues';

                const newOption = document.createElement('option');
                newOption.value = `user_${data.venue.user_venue_id}`;
                newOption.textContent = data.venue.venue_name;

                newGroup.appendChild(newOption);
                venueSelect.appendChild(newGroup);
              } else {
                const newOption = document.createElement('option');
                newOption.value = `user_${data.venue.user_venue_id}`;
                newOption.textContent = data.venue.venue_name;
                userVenueGroup.appendChild(newOption);
              }

              venueSelect.value = `user_${data.venue.user_venue_id}`;

              refreshCustomDropdowns();

              const changeEvent = new Event('change');
              venueSelect.dispatchEvent(changeEvent);
            }

            venueForm.reset();
            closeModal(addVenueModal);

            if (typeof showNotification === 'function') {
              showNotification('Custom venue added!', 'success');
            } else {
              alert('Custom venue added!');
            }
          } else {
            if (typeof showNotification === 'function') {
              showNotification('Error adding venue: ' + (data.error || 'Unknown error'), 'error');
            } else {
              alert('Error adding venue: ' + (data.error || 'Unknown error'));
            }
          }
        })
        .catch((error) => {
          console.error('Error saving venue:', error);
          if (typeof showNotification === 'function') {
            showNotification('Error saving venue. Please try again.', 'error');
          } else {
            alert('Error saving venue. Please try again.');
          }
        });
    });
  }
}

/**
 * Update custom dropdown UI after adding a new venue
 * @param {HTMLSelectElement} selectElement - The native select element
 * @param {Object} venueData - The venue data from the server
 */
function updateCustomDropdownWithNewVenue(selectElement, venueData) {
  const customDropdown = selectElement.closest('.custom-dropdown');
  if (!customDropdown) return;

  const venueValue = `user_${venueData.user_venue_id}`;
  const venueText = venueData.venue_name;

  const selectedOption = customDropdown.querySelector('.selected-option');
  if (selectedOption) {
    selectedOption.textContent = venueText;
  }

  const dropdownMenu = customDropdown.querySelector('.custom-dropdown-menu');
  if (!dropdownMenu) return;

  let userVenueGroup = dropdownMenu.querySelector('.custom-dropdown-optgroup[data-label="My Venues"]');

  if (!userVenueGroup) {
    userVenueGroup = document.createElement('div');
    userVenueGroup.className = 'custom-dropdown-optgroup';
    userVenueGroup.setAttribute('data-label', 'My Venues');
    userVenueGroup.textContent = 'My Venues';
    dropdownMenu.appendChild(userVenueGroup);
  }

  const newOption = document.createElement('div');
  newOption.className = 'custom-dropdown-option optgroup-option';
  newOption.setAttribute('data-value', venueValue);
  newOption.textContent = venueText;

  newOption.addEventListener('click', () => {
    selectElement.value = venueValue;

    if (selectedOption) {
      selectedOption.textContent = venueText;
    }

    dropdownMenu.querySelectorAll('.custom-dropdown-option').forEach((option) => {
      option.classList.remove('selected');
    });
    newOption.classList.add('selected');

    customDropdown.classList.remove('open');

    const changeEvent = new Event('change');
    selectElement.dispatchEvent(changeEvent);
  });

  insertAfter(newOption, userVenueGroup);

  dropdownMenu.querySelectorAll('.custom-dropdown-option').forEach((option) => {
    option.classList.remove('selected');
  });
  newOption.classList.add('selected');
}

/**
 * Helper function to insert an element after another element
 * @param {HTMLElement} newNode - The node to insert
 * @param {HTMLElement} referenceNode - The node to insert after
 */
function insertAfter(newNode, referenceNode) {
  if (referenceNode.nextSibling) {
    referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling);
  } else {
    referenceNode.parentNode.appendChild(newNode);
  }
}

/**
 * Re-initializes all custom dropdowns on the page
 * Can be called after dynamically adding options to select elements
 */
function refreshCustomDropdowns() {
  document.querySelectorAll('.custom-dropdown').forEach((dropdown) => {
    const select = dropdown.querySelector('select');
    if (select) {
      dropdown.parentNode.insertBefore(select, dropdown);
      dropdown.remove();
    }
  });

  initCustomDropdowns();
}

window.initVenueManagement = initVenueManagement;
window.initVenueEditModal = initVenueEditModal;
window.initVenueRemoval = initVenueRemoval;
window.initAddVenueModal = initAddVenueModal;
window.updateCustomDropdownWithNewVenue = updateCustomDropdownWithNewVenue;
window.insertAfter = insertAfter;
window.refreshCustomDropdowns = refreshCustomDropdowns;
