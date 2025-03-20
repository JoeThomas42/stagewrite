/**
 * StageWrite Venue Management Module
 * Handles venue creation, editing, and removal
 */

/**
 * Initializes venue management functionality
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
  
  // Close modal functions
  function closeVenueModal() {
    closeModal(modal);
    editForm.reset();
    originalVenueData = {}; // Clear original data
    saveButton.disabled = false; // Reset button state
  }
  
  if (closeBtn) closeBtn.addEventListener('click', closeVenueModal);
  if (cancelBtn) cancelBtn.addEventListener('click', closeVenueModal);
  
  // Close when clicking outside the modal
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeVenueModal();
  });
  
  // Handle form submission
  if (editForm) {
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
          closeVenueModal();
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
      openModal(modal);
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
 * Initialize the "Add Venue" modal and functionality for user venues
 */
function initAddVenueModal() {
  const addVenueButton = document.getElementById('add-venue-button');
  const addVenueModal = document.getElementById('add-venue-modal');
  
  if (!addVenueButton || !addVenueModal) return;
  
  // Open modal when button is clicked
  addVenueButton.addEventListener('click', () => {
    openModal(addVenueModal);
  });
  
  // Get form elements
  const venueForm = document.getElementById('add-venue-form');
  
  // Close button functionality
  const closeBtn = addVenueModal.querySelector('.close-button');
  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal(addVenueModal));
  }
  
  // Cancel button functionality
  const cancelBtn = addVenueModal.querySelector('.cancel-button');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => closeModal(addVenueModal));
  }
  
  // Close when clicking outside the modal
  addVenueModal.addEventListener('click', (e) => {
    if (e.target === addVenueModal) closeModal(addVenueModal);
  });
  
  // Handle form submission
  if (venueForm) {
    venueForm.addEventListener('submit', (e) => {
      e.preventDefault();
      
      // Get form values
      const venueName = document.getElementById('venue_name').value.trim();
      const stageWidth = document.getElementById('stage_width').value.trim();
      const stageDepth = document.getElementById('stage_depth').value.trim();
      const venueStreet = document.getElementById('venue_street').value.trim();
      const venueCity = document.getElementById('venue_city').value.trim();
      const venueStateId = document.getElementById('venue_state_id').value;
      const venueZip = document.getElementById('venue_zip').value.trim();
      
      // Validate required fields - only venue name is required
      if (!venueName) {
        alert('The venue must have a name.');
        return;
      }
      
      // Create venue data - use empty values when appropriate to allow nulls in database
      const venueData = {
        venue_name: venueName,
        venue_street: venueStreet || null,
        venue_city: venueCity || null,
        venue_state_id: venueStateId || null,
        venue_zip: venueZip || null,
        stage_width: stageWidth ? parseInt(stageWidth) : null,
        stage_depth: stageDepth ? parseInt(stageDepth) : null
      };
      
      // Send to server
      fetch('/handlers/save_user_venue.php', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(venueData)
      })
      .then(response => response.json())
      .then(data => {
        if (data.success) {
          // Add new venue to dropdown
          const venueSelect = document.getElementById('venue_select');
          if (venueSelect) {
            const userVenueGroup = venueSelect.querySelector('optgroup[label="My Venues"]');
            
            if (!userVenueGroup) {
              // Create the optgroup if it doesn't exist
              const newGroup = document.createElement('optgroup');
              newGroup.label = "My Venues";
              
              // Create and add the new option
              const newOption = document.createElement('option');
              newOption.value = `user_${data.venue.user_venue_id}`;
              newOption.textContent = data.venue.venue_name;
              
              newGroup.appendChild(newOption);
              venueSelect.appendChild(newGroup);
            } else {
              // Add to existing group
              const newOption = document.createElement('option');
              newOption.value = `user_${data.venue.user_venue_id}`;
              newOption.textContent = data.venue.venue_name;
              userVenueGroup.appendChild(newOption);
            }
            
            // Select the new venue
            venueSelect.value = `user_${data.venue.user_venue_id}`;
            
            // Trigger change event to update stage dimensions
            const changeEvent = new Event('change');
            venueSelect.dispatchEvent(changeEvent);
          }
          
          // Reset form and close modal
          venueForm.reset();
          closeModal(addVenueModal);
          
          // Show success message
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
      .catch(error => {
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


// ---------------------- Make venue management functions available globally -----------------------
window.initVenueManagement = initVenueManagement;
window.initVenueEditModal = initVenueEditModal;
window.initVenueRemoval = initVenueRemoval;
window.initAddVenueModal = initAddVenueModal;
