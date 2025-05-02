/**
 * StageWrite portfolio Management
 * Handles user portfolio features including venue management and plot operations
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
    const response = await fetch('/handlers/delete_user_venue.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `id=${venueId}`,
    });

    if (!response.ok) {
      throw new Error(`Failed to delete venue: ${response.status} ${response.statusText}`);
    }

    const rawText = await response.text();
    console.log('Raw response:', rawText);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError);
      data = { success: response.ok };
    }

    if (data.success) {
      rowElement.remove();

      const venuesTable = document.getElementById('portfolio-venues-table');
      if (venuesTable && venuesTable.rows.length <= 1) {
        const venueSection = document.querySelector('.portfolio-section:nth-of-type(2)');
        venueSection.innerHTML = `
                    <div class="section-header">
                        <h2>Your Custom Venues</h2>
                        <button id="portfolio-add-venue-button" class="small-button" title="Add New Venue"><i class="fa-solid fa-plus"></i></button>
                    </div>
                    <div class="empty-section">
                        <p>You haven't created any custom venues yet.</p>
                        <button id="portfolio-add-venue-empty" class="primary-button">Add Custom Venue</button>
                    </div>
                `;
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
 * Initialize all portfolio page functionality
 */
function initProfileFunctionality() {
  initUserVenueModal();
  initVenueDetailModal();
  initPlotDeletion();
  initPlotDuplication();
  initPlotOpening();
  initSnapshotModal();
  initProfileSharePlot();
}

/**
 * Initialize user venue modal
 * Handles adding and editing custom venues
 */
function initUserVenueModal() {
  const modal = document.getElementById('add-venue-modal');
  if (!modal) return;

  const form = document.getElementById('user-venue-form');
  const addButtons = [document.getElementById('portfolio-add-venue-button'), document.getElementById('portfolio-add-venue-empty')];

  addButtons.forEach((button) => {
    if (button) {
      button.addEventListener('click', () => {
        form.reset();
        document.getElementById('user_venue_id').value = '';
        modal.querySelector('h2').textContent = 'Add Custom Venue';
        openModal(modal);
      });
    }
  });

  const closeBtn = modal.querySelector('.close-button');
  const cancelBtn = modal.querySelector('.cancel-button');

  if (closeBtn) closeBtn.addEventListener('click', () => closeModal(modal));
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal(modal));

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);

      const jsonData = {};
      formData.forEach((value, key) => {
        if (value !== '') {
          jsonData[key] = value;
        }
      });

      try {
        const response = await fetch('/handlers/update_user_venue.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(jsonData),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data.success) {
          const venueData = data.venue;
          const isUpdate = data.is_update;

          showNotification(isUpdate ? 'Venue updated successfully!' : 'Venue added successfully!', 'success');

          if (isUpdate) {
            updateVenueRow(venueData);
          } else {
            addVenueRow(venueData);
          }

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

  document.querySelectorAll('.clickable-venue-row').forEach((row) => {
    row.addEventListener('click', async () => {
      const venueId = row.getAttribute('data-venue-id');
      const venueName = row.getAttribute('data-venue-name');

      try {
        const response = await fetch(`/handlers/get_user_venue.php?id=${venueId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch venue data');
        }

        const data = await response.json();

        if (data.success) {
          document.getElementById('modal_venue_id').value = data.venue.user_venue_id;
          document.getElementById('modal_venue_name').value = data.venue.venue_name || '';
          document.getElementById('modal_venue_street').value = data.venue.venue_street || '';
          document.getElementById('modal_venue_city').value = data.venue.venue_city || '';
          document.getElementById('modal_venue_state_id').value = data.venue.venue_state_id || '';
          document.getElementById('modal_venue_zip').value = data.venue.venue_zip || '';
          document.getElementById('modal_stage_width').value = data.venue.stage_width || '';
          document.getElementById('modal_stage_depth').value = data.venue.stage_depth || '';

          modal.querySelector('h2').textContent = 'Venue Details';

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

  if (deleteButton) {
    deleteButton.addEventListener('click', function (e) {
      e.preventDefault();

      const venueId = document.getElementById('modal_venue_id').value;
      const venueName = document.getElementById('modal_venue_name').value;

      const row = document.querySelector(`.clickable-venue-row[data-venue-id="${venueId}"]`);

      setupConfirmButton(
        deleteButton,
        async function () {
          closeModal(modal);
          await deleteUserVenue(venueId, venueName, row);
        },
        {
          confirmText: 'Confirm',
          confirmTitle: 'Click again to permanently delete this venue',
          originalText: 'Delete',
          originalTitle: 'Delete this venue',
          timeout: 3000,
          stopPropagation: true,
          event: e,
        }
      );
    });
  }

  const closeBtn = modal.querySelector('.close-button');
  const cancelBtn = modal.querySelector('.cancel-button');

  if (closeBtn) closeBtn.addEventListener('click', () => closeModal(modal));
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal(modal));

  modal.addEventListener('click', (e) => {
    if (e.target === modal) closeModal(modal);
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const formData = new FormData(form);

      const jsonData = {};
      formData.forEach((value, key) => {
        if (value !== '') {
          jsonData[key] = value;
        }
      });

      try {
        const response = await fetch('/handlers/update_user_venue.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(jsonData),
        });

        if (!response.ok) {
          throw new Error('Network response was not ok');
        }

        const data = await response.json();

        if (data.success) {
          const venueData = data.venue;

          showNotification('Venue updated successfully!', 'success');

          updateVenueRow(venueData);

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
 * @param {string} venue.user_venue_id - The ID of the venue.
 * @param {string} venue.venue_name - The name of the venue.
 * @param {string} [venue.venue_city] - The city of the venue.
 * @param {string} [venue.state_abbr] - The state abbreviation for the venue.
 * @param {string|number} [venue.stage_width] - The stage width.
 * @param {string|number} [venue.stage_depth] - The stage depth.
 */
function updateVenueRow(venue) {
  const venuesTable = document.getElementById('portfolio-venues-table');
  if (!venuesTable) return;

  const rows = venuesTable.querySelectorAll('tr');
  let row = null;

  for (let i = 1; i < rows.length; i++) {
    if (rows[i].getAttribute('data-venue-id') == venue.user_venue_id) {
      row = rows[i];
      break;
    }
  }

  if (!row) return;

  const cells = row.querySelectorAll('td');

  cells[0].textContent = venue.venue_name;

  let location = [];
  if (venue.venue_city) location.push(venue.venue_city);
  if (venue.state_abbr) location.push(venue.state_abbr);
  cells[1].textContent = location.length > 0 ? location.join(', ') : '—';

  if (venue.stage_width && venue.stage_depth) {
    cells[2].textContent = `${venue.stage_width}' × ${venue.stage_depth}'`;
  } else {
    cells[2].textContent = '—';
  }

  row.style.animation = 'highlightRow 2s';
}

/**
 * Add a new venue row to the table
 * @param {Object} venue - The venue data
 * @param {string} venue.user_venue_id - The ID of the venue.
 * @param {string} venue.venue_name - The name of the venue.
 * @param {string} [venue.venue_city] - The city of the venue.
 * @param {string} [venue.state_abbr] - The state abbreviation for the venue.
 * @param {string|number} [venue.stage_width] - The stage width.
 * @param {string|number} [venue.stage_depth] - The stage depth.
 * @param {string} [venue.venue_street] - The street address of the venue.
 * @param {string} [venue.venue_state_id] - The state ID of the venue.
 * @param {string} [venue.venue_zip] - The zip code of the venue.
 */
function addVenueRow(venue) {
  const venuesTable = document.getElementById('portfolio-venues-table');

  const venueSection = document.querySelector('.portfolio-section:nth-of-type(2)');
  const emptySection = venueSection.querySelector('.empty-section');

  if (emptySection) {
    venueSection.innerHTML = `
      <div class="section-header">
        <h2>Your Custom Venues</h2>
        <button id="portfolio-add-venue-button" class="small-button" title="Add New Venue"><i class="fa-solid fa-plus"></i></button>
      </div>
      <div class="venues-table-container">
        <table id="portfolio-venues-table">
          <tr>
            <th>Name</th>
            <th>Location</th>
            <th>Stage Dimensions</th>
          </tr>
        </table>
      </div>
    `;

    const addButton = document.getElementById('portfolio-add-venue-button');
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

  const row = document.createElement('tr');
  row.classList.add('clickable-venue-row');
  row.setAttribute('data-venue-id', venue.user_venue_id);
  row.setAttribute('data-venue-name', venue.venue_name);

  const nameCell = document.createElement('td');
  nameCell.setAttribute('data-label', 'Name');
  nameCell.textContent = venue.venue_name;
  row.appendChild(nameCell);

  const locationCell = document.createElement('td');
  locationCell.setAttribute('data-label', 'Location');
  let location = [];
  if (venue.venue_city) location.push(venue.venue_city);
  if (venue.state_abbr) location.push(venue.state_abbr);
  locationCell.textContent = location.length > 0 ? location.join(', ') : '—';
  row.appendChild(locationCell);

  const dimensionsCell = document.createElement('td');
  dimensionsCell.setAttribute('data-label', 'Stage Dimensions');
  if (venue.stage_width && venue.stage_depth) {
    dimensionsCell.textContent = `${venue.stage_width}' × ${venue.stage_depth}'`;
  } else {
    dimensionsCell.textContent = '—';
  }
  row.appendChild(dimensionsCell);

  venuesTable.appendChild(row);

  row.style.animation = 'highlightRow 2s';

  row.addEventListener('click', async () => {
    const venueId = row.getAttribute('data-venue-id');

    try {
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

        document.getElementById('modal_venue_id').value = data.venue.user_venue_id;
        document.getElementById('modal_venue_name').value = data.venue.venue_name || '';
        document.getElementById('modal_venue_street').value = data.venue.venue_street || '';
        document.getElementById('modal_venue_city').value = data.venue.venue_city || '';
        document.getElementById('modal_venue_state_id').value = data.venue.venue_state_id || '';
        document.getElementById('modal_venue_zip').value = data.venue.venue_zip || '';
        document.getElementById('modal_stage_width').value = data.venue.stage_width || '';
        document.getElementById('modal_stage_depth').value = data.venue.stage_depth || '';

        const modalTitle = modal.querySelector('h2');
        if (modalTitle) modalTitle.textContent = 'Venue Details';

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
 * Adds confirmation logic to delete buttons
 */
function initPlotDeletion() {
  document.querySelectorAll('.delete-plot-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      const plotId = btn.getAttribute('data-plot-id');
      const plotName = btn.getAttribute('data-plot-name');

      setupConfirmButton(
        btn,
        async () => {
          try {
            const response = await fetch('/handlers/delete_plot.php', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: `plot_id=${encodeURIComponent(plotId)}`,
            });

            if (!response.ok) {
              throw new Error('Network response was not ok');
            }

            const data = await response.json();

            if (data.success) {
              const plotCard = btn.closest('.plot-card');
              if (plotCard) {
                plotCard.remove();

                const plotsGrid = document.querySelector('.plots-grid');
                if (plotsGrid && plotsGrid.children.length === 0) {
                  const plotSection = document.querySelector('.portfolio-section:first-of-type');
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
        },
        {
          confirmText: 'Delete',
          confirmTitle: 'This is permanent!',
          originalText: '<i class="fa-solid fa-delete-left"></i>',
          originalTitle: 'Delete plot',
          stopPropagation: true,
          event: e,
        }
      );
    });
  });
}

/**
 * Initialize plot duplication functionality
 * Sets up links to redirect for plot duplication
 */
function initPlotDuplication() {
  document.querySelectorAll('.duplicate-plot').forEach((link) => {
    link.addEventListener('click', (e) => {
      e.preventDefault();

      const plotId = link.getAttribute('data-plot-id');

      window.location.href = `/index.php?duplicate=${plotId}`;
    });
  });
}

/**
 * Initialize plot opening functionality
 * Adds confirmation logic to open buttons
 */
function initPlotOpening() {
  document.querySelectorAll('.open-plot-btn').forEach((btn) => {
    btn.addEventListener('click', (e) => {
      e.preventDefault();

      const plotId = btn.getAttribute('data-plot-id');
      const plotName = btn.getAttribute('data-plot-name');

      setupConfirmButton(
        btn,
        () => {
          window.location.href = `/index.php?load=${plotId}`;
        },
        {
          confirmText: 'Confirm',
          confirmTitle: 'Unsaved changes will be lost!',
          originalText: 'Open Plot',
          originalTitle: 'Open plot',
          stopPropagation: true,
          event: e,
        }
      );
    });
  });
}

/**
 * Initialize snapshot modal functionality
 * Sets up triggers to open a modal displaying a plot snapshot image
 */
function initSnapshotModal() {
  const modal = document.getElementById('snapshot-modal');
  if (!modal) return;

  const modalImage = document.getElementById('snapshot-modal-image');
  const closeBtn = modal.querySelector('.close-button');

  document.querySelectorAll('.snapshot-trigger').forEach((trigger) => {
    trigger.addEventListener('click', () => {
      const snapshotSrc = trigger.getAttribute('data-snapshot-src');
      if (snapshotSrc && modalImage) {
        modalImage.setAttribute('src', snapshotSrc);
        openModal(modal);
      }
    });
  });

  if (closeBtn) {
    closeBtn.addEventListener('click', () => closeModal(modal));
  }

  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal(modal);
    }
  });
}

/**
 * Initialize share plot functionality for the portfolio page
 * Sets up share buttons to fetch plot data and open the share modal
 */
function initProfileSharePlot() {
  const shareButtons = document.querySelectorAll('.share-plot-btn');
  const shareModal = document.getElementById('share-plot-modal');

  if (!shareButtons.length || !shareModal) return;

  shareButtons.forEach((btn) => {
    btn.addEventListener('click', async (e) => {
      e.preventDefault();

      const plotId = btn.getAttribute('data-plot-id');
      const plotName = btn.getAttribute('data-plot-name');

      if (!window.plotState) {
        window.plotState = {};
      }

      showNotification('Loading plot data...', 'info');

      try {
        const response = await fetch(`/handlers/get_plot.php?id=${plotId}`);

        if (!response.ok) {
          throw new Error('Failed to load plot data');
        }

        const data = await response.json();

        if (data.success) {
          window.plotState.currentPlotId = plotId;
          window.plotState.currentPlotName = plotName;
          window.plotState.elements = data.elements || [];
          window.plotState.inputs = data.inputs || [];

          if (data.plot) {
            window.plotState.venueId = data.plot.effective_venue_id;
            window.plotState.venueName = data.plot.venue_name;
            window.plotState.eventStart = data.plot.event_date_start;
            window.plotState.eventEnd = data.plot.event_date_end;
          }

          openModal(shareModal);

          if (typeof initPrintAndShare === 'function') {
            initPrintAndShare(window.plotState);
          }

          showNotification('Plot data loaded successfully', 'success');
        } else {
          showNotification('Error loading plot data: ' + (data.error || 'Unknown error'), 'error');
        }
      } catch (error) {
        console.error('Error fetching plot data:', error);
        showNotification('Error loading plot data. Please try again.', 'error');
      }
    });
  });

  const closeBtn = shareModal.querySelector('.close-button');
  const cancelBtn = shareModal.querySelector('.cancel-button');

  if (closeBtn) closeBtn.addEventListener('click', () => closeModal(shareModal));
  if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal(shareModal));

  shareModal.addEventListener('click', (e) => {
    if (e.target === shareModal) closeModal(shareModal);
  });
}

window.addEventListener('DOMContentLoaded', () => {
  if (document.querySelector('.plots-grid')) {
    setTimeout(() => {
      initProfileSharePlot();

      if (typeof initPrintAndShare === 'function' && window.plotState) {
        initPrintAndShare(window.plotState);
      }
    }, 500);
  }
});

window.initProfileFunctionality = initProfileFunctionality;
window.initUserVenueModal = initUserVenueModal;
window.initVenueDetailModal = initVenueDetailModal;
window.initPlotDeletion = initPlotDeletion;
window.initPlotDuplication = initPlotDuplication;
window.initPlotOpening = initPlotOpening;
window.initSnapshotModal = initSnapshotModal;
window.initProfileSharePlot = initProfileSharePlot;
