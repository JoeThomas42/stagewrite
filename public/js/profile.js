/**
 * StageWrite Profile Management
 * Handles user profile features including venue management and plot operations
 */

/**
 * Delete a user venue with confirmation
 * @param {string} venueId - ID of the venue to delete
 * @param {string} venueName - Name of the venue for confirmation
 * @param {HTMLElement} rowElement - Reference to the row element to remove on success
 * @returns {Promise<void>}
 */
async function deleteUserVenue(venueId, venueName, rowElement) {
    try {
        // Use POST method
        const response = await fetch('/handlers/delete_user_venue.php', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `id=${venueId}`
        });
        
        if (!response.ok) {
            throw new Error(`Failed to delete venue: ${response.status} ${response.statusText}`);
        }
        
        // Debug: Let's see what we're actually getting back
        const rawText = await response.text();
        console.log('Raw response:', rawText);
        
        // Try to parse manually to see what's happening
        let data;
        try {
            data = JSON.parse(rawText);
        } catch (parseError) {
            console.error('JSON Parse Error:', parseError);
            // Create fallback success response
            data = { success: response.ok };
        }
        
        if (data.success) {
            // Remove venue row from DOM
            rowElement.remove();
            
            // Check if there are no more venues
            const venuesTable = document.getElementById('profile-venues-table');
            if (venuesTable && venuesTable.rows.length <= 1) {
                // Replace with empty state
                const venueSection = document.querySelector('.profile-section:nth-of-type(2)');
                venueSection.innerHTML = `
                    <div class="section-header">
                        <h2>Your Custom Venues</h2>
                        <button id="profile-add-venue-button" class="action-button" title="Add New Venue"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <div class="empty-section">
                        <p>You haven't created any custom venues yet.</p>
                        <button id="profile-add-venue-empty" class="primary-button">Add Custom Venue</button>
                    </div>
                `;
                // Re-initialize venue modal functionality
                initUserVenueModal();
            }
            
            showNotification('Venue deleted successfully!', 'success');
        } else {
            showNotification('Error deleting venue: ' + (data.error || 'Unknown error'), 'error');
        }
    } catch (error) {
        console.error('Error:', error);
        showNotification('An unexpected error occurred: ' + error.message, 'error');
    }
}

/**
* Initialize all profile page functionality
*/
function initProfileFunctionality() {
  // Initialize venue modal
  initUserVenueModal();
  
  // Initialize venue detail modal
  initVenueDetailModal();
  
  // Initialize plot deletion
  initPlotDeletion();
  
  // Initialize plot duplication
  initPlotDuplication();
}

/**
* Initialize user venue modal
* Handles adding and editing custom venues
*/
function initUserVenueModal() {
  const modal = document.getElementById('add-venue-modal');
  if (!modal) return;

  const form = document.getElementById('user-venue-form');
  const addButtons = [
      document.getElementById('profile-add-venue-button'),
      document.getElementById('profile-add-venue-empty')
  ];
  
  // Add venue button click handlers
  addButtons.forEach(button => {
      if (button) {
          button.addEventListener('click', () => {
              // Reset form and set to Add mode
              form.reset();
              document.getElementById('user_venue_id').value = '';
              modal.querySelector('h2').textContent = 'Add Custom Venue';
              openModal(modal);
          });
      }
  });
  
  // Modal close functionality
  const closeBtn = modal.querySelector('.close-button');
  const cancelBtn = modal.querySelector('.cancel-button');
  
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal(modal));
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal(modal));
  
  // Close when clicking outside
  modal.addEventListener('click', (e) => {
      if (e.target === modal) closeModal(modal);
  });
  
  // Form submission
  if (form) {
      form.addEventListener('submit', async (e) => {
          e.preventDefault();
          
          // Create form data object
          const formData = new FormData(form);
          
          // Convert to JSON object
          const jsonData = {};
          formData.forEach((value, key) => {
              // Only include non-empty values
              if (value !== '') {
                  jsonData[key] = value;
              }
          });
          
          try {
              // Send request to server
              const response = await fetch('/handlers/update_user_venue.php', {
                  method: 'POST',
                  headers: {
                      'Content-Type': 'application/json'
                  },
                  body: JSON.stringify(jsonData)
              });
              
              if (!response.ok) {
                  throw new Error('Network response was not ok');
              }
              
              const data = await response.json();
              
              if (data.success) {
                  const venueData = data.venue;
                  const isUpdate = data.is_update;
                  
                  // Show success message
                  showNotification(isUpdate ? 
                      'Venue updated successfully!' : 
                      'Venue added successfully!', 'success');
                  
                  // Instead of reloading the page, update the UI directly
                  if (isUpdate) {
                      // Find and update the existing row
                      updateVenueRow(venueData);
                  } else {
                      // Add a new row
                      addVenueRow(venueData);
                  }
                  
                  // Close modal
                  closeModal(modal);
              } else {
                  showNotification('Error: ' + (data.error || 'Unknown error'), 'error');
              }
          } catch (error) {
              console.error('Error:', error);
              showNotification('An unexpected error occurred', 'error');
          }
      });
  }
}

/**
* Initialize venue detail modal
* Handles viewing, editing, and deleting venues via row clicks
*/
function initVenueDetailModal() {
  const modal = document.getElementById('venue-modal');
  if (!modal) return;
  
  const form = document.getElementById('venue-modal-form');
  const deleteButton = document.getElementById('venue-delete-button');
  
  // Set up clickable rows
  document.querySelectorAll('.clickable-venue-row').forEach(row => {
    row.addEventListener('click', async () => {
      const venueId = row.getAttribute('data-venue-id');
      const venueName = row.getAttribute('data-venue-name');
      
      try {
        // Fetch venue data
        const response = await fetch(`/handlers/get_user_venue.php?id=${venueId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch venue data');
        }
        
        const data = await response.json();
        
        if (data.success) {
          // Populate form with venue data
          document.getElementById('modal_venue_id').value = data.venue.user_venue_id;
          document.getElementById('modal_venue_name').value = data.venue.venue_name || '';
          document.getElementById('modal_venue_street').value = data.venue.venue_street || '';
          document.getElementById('modal_venue_city').value = data.venue.venue_city || '';
          document.getElementById('modal_venue_state_id').value = data.venue.venue_state_id || '';
          document.getElementById('modal_venue_zip').value = data.venue.venue_zip || '';
          document.getElementById('modal_stage_width').value = data.venue.stage_width || '';
          document.getElementById('modal_stage_depth').value = data.venue.stage_depth || '';
          
          // Update modal title to show we're viewing/editing
          modal.querySelector('h2').textContent = 'Venue Details';
          
          // Show modal
          openModal(modal);
        } else {
          showNotification('Error loading venue information', 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        showNotification('An unexpected error occurred', 'error');
      }
    });
  });
  
  // Set up delete button with confirmation
  if (deleteButton) {
    deleteButton.addEventListener('click', function(e) {
      e.preventDefault();
      
      const venueId = document.getElementById('modal_venue_id').value;
      const venueName = document.getElementById('modal_venue_name').value;
      
      // Find the row element
      const row = document.querySelector(`.clickable-venue-row[data-venue-id="${venueId}"]`);
      
      // Use the setupConfirmButton function for double-click confirmation
      setupConfirmButton(
        deleteButton,
        async function() {
          // Close the modal first
          closeModal(modal);
          
          // Then delete the venue
          await deleteUserVenue(venueId, venueName, row);
        },
        {
          confirmText: 'Confirm',
          confirmTitle: 'Click again to permanently delete this venue',
          originalText: 'Delete',
          originalTitle: 'Delete this venue',
          timeout: 3000,
          stopPropagation: true,
          event: e
        }
      );
    });
  }
  
  // Modal close functionality
  const closeBtn = modal.querySelector('.close-button');
  const cancelBtn = modal.querySelector('.cancel-button');
  
  if (closeBtn) closeBtn.addEventListener('click', () => closeModal(modal));
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal(modal));
  
  // Close when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });
  
  // Form submission
  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Create form data object
      const formData = new FormData(form);
      
      // Convert to JSON object
      const jsonData = {};
      formData.forEach((value, key) => {
        // Only include non-empty values
        if (value !== '') {
          jsonData[key] = value;
        }
      });
      
      try {
        // Send request to server
        const response = await fetch('/handlers/update_user_venue.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(jsonData)
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.success) {
          const venueData = data.venue;
          
          // Show success message
          showNotification('Venue updated successfully!', 'success');
          
          // Update the row in the table
          updateVenueRow(venueData);
          
          // Close modal
          closeModal(modal);
        } else {
          showNotification('Error: ' + (data.error || 'Unknown error'), 'error');
        }
      } catch (error) {
        console.error('Error:', error);
        showNotification('An unexpected error occurred', 'error');
      }
    });
  }
}

/**
* Update an existing venue row with new data
* @param {Object} venue - The venue data
*/
function updateVenueRow(venue) {
  const venuesTable = document.getElementById('profile-venues-table');
  if (!venuesTable) return;
  
  // Find the row with this venue ID
  const rows = venuesTable.querySelectorAll('tr');
  let row = null;
  
  // Skip the header row (index 0)
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].getAttribute('data-venue-id') == venue.user_venue_id) {
      row = rows[i];
      break;
    }
  }
  
  if (!row) return; // Row not found
  
  // Update the cells
  const cells = row.querySelectorAll('td');
  
  // Name
  cells[0].textContent = venue.venue_name;
  
  // Location
  let location = [];
  if (venue.venue_city) location.push(venue.venue_city);
  if (venue.state_abbr) location.push(venue.state_abbr);
  cells[1].textContent = location.length > 0 ? location.join(', ') : '—';
  
  // Stage dimensions
  if (venue.stage_width && venue.stage_depth) {
    cells[2].textContent = `${venue.stage_width}' × ${venue.stage_depth}'`;
  } else {
    cells[2].textContent = '—';
  }
  
  // Highlight the updated row briefly
  row.style.animation = 'highlightRow 2s';
}

/**
 * Add a new venue row to the table
 * @param {Object} venue - The venue data
 */
function addVenueRow(venue) {
  const venuesTable = document.getElementById('profile-venues-table');

  // Check if we need to convert from empty state to table
  const venueSection = document.querySelector('.profile-section:nth-of-type(2)');
  const emptySection = venueSection.querySelector('.empty-section');

  if (emptySection) {
    // Replace empty section with table
    venueSection.innerHTML = `
      <div class="section-header">
        <h2>Your Custom Venues</h2>
        <button id="profile-add-venue-button" class="action-button" title="Add New Venue"><i class="fa-solid fa-plus"></i></button>
      </div>
      <div class="venues-table-container">
        <table id="profile-venues-table">
          <tr>
            <th>Name</th>
            <th>Location</th>
            <th>Stage Dimensions</th>
          </tr>
        </table>
      </div>
    `;

    // Re-bind the add venue button
    const addButton = document.getElementById('profile-add-venue-button');
    if (addButton) {
      addButton.addEventListener('click', () => {
        const modal = document.getElementById('add-venue-modal');
        const form = document.getElementById('user-venue-form');
        if (form) form.reset();
        if (modal) {
          document.getElementById('user_venue_id').value = '';
          modal.querySelector('h2').textContent = 'Add Custom Venue';
          openModal(modal);
        }
      });
    }
  }

  // Create a new row
  const row = document.createElement('tr');
  row.classList.add('clickable-venue-row');
  row.setAttribute('data-venue-id', venue.user_venue_id);
  row.setAttribute('data-venue-name', venue.venue_name);

  // Name
  const nameCell = document.createElement('td');
  nameCell.setAttribute('data-label', 'Name');
  nameCell.textContent = venue.venue_name;
  row.appendChild(nameCell);

  // Location
  const locationCell = document.createElement('td');
  locationCell.setAttribute('data-label', 'Location');
  let location = [];
  if (venue.venue_city) location.push(venue.venue_city);
  if (venue.state_abbr) location.push(venue.state_abbr);
  locationCell.textContent = location.length > 0 ? location.join(', ') : '—';
  row.appendChild(locationCell);

  // Stage dimensions
  const dimensionsCell = document.createElement('td');
  dimensionsCell.setAttribute('data-label', 'Stage Dimensions');
  if (venue.stage_width && venue.stage_depth) {
    dimensionsCell.textContent = `${venue.stage_width}' × ${venue.stage_depth}'`;
  } else {
    dimensionsCell.textContent = '—';
  }
  row.appendChild(dimensionsCell);

  // Add the row to the table
  venuesTable.appendChild(row);

  // Highlight the new row briefly
  row.style.animation = 'highlightRow 2s';

  // Add click event listener to the new row
  row.addEventListener('click', async () => {
    const venueId = row.getAttribute('data-venue-id');

    try {
      // Fetch venue data
      const response = await fetch(`/handlers/get_user_venue.php?id=${venueId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch venue data');
      }

      const data = await response.json();

      if (data.success) {
        const modal = document.getElementById('venue-modal');
        if (!modal) {
          console.error('Venue modal not found');
          return;
        }

        // Populate form with venue data
        document.getElementById('modal_venue_id').value = data.venue.user_venue_id;
        document.getElementById('modal_venue_name').value = data.venue.venue_name || '';
        document.getElementById('modal_venue_street').value = data.venue.venue_street || '';
        document.getElementById('modal_venue_city').value = data.venue.venue_city || '';
        document.getElementById('modal_venue_state_id').value = data.venue.venue_state_id || '';
        document.getElementById('modal_venue_zip').value = data.venue.venue_zip || '';
        document.getElementById('modal_stage_width').value = data.venue.stage_width || '';
        document.getElementById('modal_stage_depth').value = data.venue.stage_depth || '';

        // Update modal title
        const modalTitle = modal.querySelector('h2');
        if (modalTitle) modalTitle.textContent = 'Venue Details';

        // Show modal
        openModal(modal);
      } else {
        showNotification('Error loading venue information', 'error');
      }
    } catch (error) {
      console.error('Error:', error);
      showNotification('An unexpected error occurred', 'error');
    }
  });
}

/**
* Initialize plot deletion functionality
*/
function initPlotDeletion() {
  document.querySelectorAll('.remove-plot').forEach(link => {
    link.addEventListener('click', async (e) => {
      e.preventDefault();
      
      const plotId = link.getAttribute('data-plot-id');
      const plotName = link.getAttribute('data-plot-name');
      
      if (confirm(`Are you sure you want to delete "${plotName}"?\nThis action cannot be undone.`)) {
        try {
          const response = await fetch('/handlers/delete_plot.php', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: `plot_id=${encodeURIComponent(plotId)}`
          });
          
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          
          const data = await response.json();
          
          if (data.success) {
            // Remove plot card from DOM
            const plotCard = link.closest('.plot-card');
            if (plotCard) {
              plotCard.remove();
              
              // Check if there are no more plots
              const plotsGrid = document.querySelector('.plots-grid');
              if (plotsGrid && plotsGrid.children.length === 0) {
                // Replace with empty state
                const plotSection = document.querySelector('.profile-section:first-of-type');
                plotSection.innerHTML = `
                  <div class="section-header">
                    <h2>Your Saved Plots</h2>
                  </div>
                  <div class="empty-section">
                    <p>You don't have any saved plots yet. Start by creating a new plot!</p>
                    <a href="/index.php" class="primary-button">Create Plot</a>
                  </div>
                `;
              }
            }
            
            showNotification('Plot deleted successfully!', 'success');
          } else {
            showNotification('Error deleting plot: ' + (data.error || 'Unknown error'), 'error');
          }
        } catch (error) {
          console.error('Error:', error);
          showNotification('An unexpected error occurred', 'error');
        }
      }
    });
  });
}

/**
* Initialize plot duplication functionality
*/
function initPlotDuplication() {
  document.querySelectorAll('.duplicate-plot').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      
      const plotId = link.getAttribute('data-plot-id');
      
      // For now, just redirect to create page with plotId parameter for duplication
      window.location.href = `/index.php?duplicate=${plotId}`;
    });
  });
}

window.initProfileFunctionality = initProfileFunctionality;
window.initUserVenueModal = initUserVenueModal;
window.initVenueDetailModal = initVenueDetailModal;
window.initPlotDeletion = initPlotDeletion;
window.initPlotDuplication = initPlotDuplication;
