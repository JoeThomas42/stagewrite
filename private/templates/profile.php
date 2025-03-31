<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    header('Location: /');
    exit;
}

// Get user information from session
$user_id = $_SESSION['user_id'];
$user = [
    'user_id'     => $user_id,
    'first_name'  => $_SESSION['first_name'],
    'last_name'   => $_SESSION['last_name'],
    'role_id'     => $_SESSION['role_id']
];

// Get database instance
$db = Database::getInstance();

// Set page title for header
$current_page = "Profile";
include PRIVATE_PATH . '/templates/header.php';

// Load user's saved plots
$plots = $db->fetchAll("
    SELECT 
        sp.plot_id, sp.plot_name, sp.event_date_start, sp.event_date_end,
        CASE 
            WHEN sp.venue_id IS NOT NULL THEN v.venue_name
            WHEN sp.user_venue_id IS NOT NULL THEN uv.venue_name
            ELSE 'Unknown Venue'
        END as venue_name,
        CASE 
            WHEN sp.user_venue_id IS NOT NULL THEN CONCAT('user_', sp.user_venue_id)
            ELSE CAST(sp.venue_id AS CHAR)
        END as effective_venue_id,
        CASE 
            WHEN sp.user_venue_id IS NOT NULL THEN 1
            ELSE 0
        END as is_user_venue
    FROM saved_plots sp
    LEFT JOIN venues v ON sp.venue_id = v.venue_id
    LEFT JOIN user_venues uv ON sp.user_venue_id = uv.user_venue_id AND uv.user_id = sp.user_id
    WHERE sp.user_id = ?
    ORDER BY sp.event_date_start DESC
", [$user_id]);

// Load user's custom venues
$userVenues = $db->fetchAll("
    SELECT uv.user_venue_id, uv.venue_name, uv.venue_street, uv.venue_city, 
           s.state_name, s.state_abbr, uv.venue_zip, uv.stage_width, uv.stage_depth
    FROM user_venues uv
    LEFT JOIN states s ON uv.venue_state_id = s.state_id
    WHERE uv.user_id = ?
    ORDER BY uv.venue_name
", [$user_id]);

?>

<div class="profile-container">
    <div class="profile-header">
        <h2>Your Profile</h2>
        <div class="notification-area"></div>
        <div class="user-info">
            <div class="user-name"><?= htmlspecialchars($user['first_name']) ?> <?= htmlspecialchars($user['last_name']) ?></div>
        </div>
    </div>

    <!-- Saved Plots Section -->
    <div class="profile-section">
        <div class="section-header">
            <h2>Your Saved Plots</h2>
        </div>
        
        <?php if (empty($plots)): ?>
            <div class="empty-section">
                <p>You don't have any saved plots yet. Start by creating a new plot!</p>
                <a href="/index.php" class="primary-button">Create Plot</a>
            </div>
        <?php else: ?>
            <div class="plots-grid">
                <?php foreach ($plots as $plot): ?>
                    <div class="plot-card">
                        <div class="plot-card-header">
                            <h3><?= htmlspecialchars($plot['plot_name']) ?></h3>
                            <div class="dropdown">
                                <button class="dropdown-toggle small-button"><i class="fa-solid fa-ellipsis-vertical"></i></button>
                                <div class="dropdown-menu">
                                    <a href="/index.php?load=<?= $plot['plot_id'] ?>" class="load-plot">Open Plot</a>
                                    <a href="#" class="duplicate-plot" data-plot-id="<?= $plot['plot_id'] ?>">Duplicate</a>
                                    <a href="#" class="remove-plot" data-plot-id="<?= $plot['plot_id'] ?>" data-plot-name="<?= htmlspecialchars($plot['plot_name']) ?>">Delete</a>
                                </div>
                            </div>
                        </div>
                        <div class="plot-card-details">
                            <div class="detail-item">
                                <span class="detail-label">Venue:</span>
                                <span class="detail-value"><?= htmlspecialchars($plot['venue_name']) ?></span>
                            </div>
                            <?php if (!empty($plot['event_date_start'])): ?>
                                <div class="detail-item">
                                    <span class="detail-label">Date:</span>
                                    <span class="detail-value">
                                        <?= date('M j, Y', strtotime($plot['event_date_start'])) ?>
                                        <?php if (!empty($plot['event_date_end']) && $plot['event_date_end'] != $plot['event_date_start']): ?>
                                            - <?= date('M j, Y', strtotime($plot['event_date_end'])) ?>
                                        <?php endif; ?>
                                    </span>
                                </div>
                            <?php endif; ?>
                        </div>
                        <div class="plot-card-actions">
                            <a href="/index.php?load=<?= $plot['plot_id'] ?>" class="primary-button">Open Plot</a>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>

    <!-- Custom Venues Section -->
    <div class="profile-section">
        <div class="section-header">
            <h2>Your Custom Venues</h2>
            <button id="profile-add-venue-button" class="action-button" title="Add New Venue"><i class="fa-solid fa-plus"></i></button>
        </div>
        
        <?php if (empty($userVenues)): ?>
            <div class="empty-section">
                <p>You haven't created any custom venues yet.</p>
                <button id="profile-add-venue-empty" class="primary-button">Add Custom Venue</button>
            </div>
        <?php else: ?>
            <div class="venues-table-container">
                <table id="profile-venues-table">
                    <tr>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Stage Dimensions</th>
                        <th>Actions</th>
                    </tr>
                    <?php foreach ($userVenues as $venue): ?>
                        <tr>
                            <td data-label="Name"><?= htmlspecialchars($venue['venue_name']) ?></td>
                            <td data-label="Location">
                                <?php
                                $location = [];
                                if (!empty($venue['venue_city'])) $location[] = htmlspecialchars($venue['venue_city']);
                                if (!empty($venue['state_abbr'])) $location[] = htmlspecialchars($venue['state_abbr']);
                                echo !empty($location) ? implode(', ', $location) : '—';
                                ?>
                            </td>
                            <td data-label="Stage Dimensions">
                                <?php
                                if (!empty($venue['stage_width']) && !empty($venue['stage_depth'])) {
                                    echo htmlspecialchars($venue['stage_width']) . "' × " . htmlspecialchars($venue['stage_depth']) . "'";
                                } else {
                                    echo '—';
                                }
                                ?>
                            </td>
                            <td data-label="Actions" class="action-cell">
                                <div class="dropdown">
                                    <button class="dropdown-toggle">Actions <span class="dropdown-arrow">▼</span></button>
                                    <div class="dropdown-menu">
                                        <a href="#" class="edit-user-venue" data-venue-id="<?= $venue['user_venue_id'] ?>">Edit</a>
                                        <a href="#" class="remove-user-venue" data-venue-id="<?= $venue['user_venue_id'] ?>" data-venue-name="<?= htmlspecialchars($venue['venue_name']) ?>">Delete</a>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    <?php endforeach; ?>
                </table>
            </div>
        <?php endif; ?>
    </div>
    <div class="notification-area"></div>
</div>

<!-- Add/Edit User Venue Modal -->
<div id="add-venue-modal" class="modal hidden">
    <div class="modal-content">
        <span class="close-button">&times;</span>
        <h2>Add Custom Venue</h2>
        <form id="user-venue-form">
            <input type="hidden" id="user_venue_id" name="user_venue_id">
            
            <div class="form-group">
                <label for="venue_name">Venue Name:</label>
                <input type="text" id="venue_name" name="venue_name" maxlength="100" required>
            </div>
            
            <div class="form-group">
                <label for="venue_street">Street Address:</label>
                <input type="text" id="venue_street" name="venue_street" maxlength="100">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="venue_state_id">State:</label>
                    <select id="venue_state_id" name="venue_state_id">
                        <option value="" selected disabled>Select State</option>
                        <?php
                        $states = $db->fetchAll("SELECT state_id, state_name, state_abbr FROM states ORDER BY state_name");
                        foreach ($states as $state) {
                            echo "<option value='{$state['state_id']}'>{$state['state_name']}</option>";
                        }
                        ?>
                    </select>
                </div>

                <div class="form-group">
                    <label for="venue_city">City:</label>
                    <input type="text" id="venue_city" name="venue_city" maxlength="100">
                </div>
                
                <div class="form-group">
                    <label for="venue_zip">ZIP:</label>
                    <input type="text" id="venue_zip" name="venue_zip" maxlength="5">
                </div>
            </div>
            
            <div class="input-dimensions">
                <div class="form-group">
                    <label for="stage_width">Stage Width (feet):</label>
                    <input type="number" id="stage_width" name="stage_width" min="1" max="200" step="1">
                </div>
                
                <div class="form-group">
                    <label for="stage_depth">Stage Depth (feet):</label>
                    <input type="number" id="stage_depth" name="stage_depth" min="1" max="200" step="1">
                </div>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="save-button">Save Venue</button>
                <button type="button" class="cancel-button">Cancel</button>
            </div>
        </form>
    </div>
</div>

<!-- JavaScript for user profile functionality -->
<script>
document.addEventListener('DOMContentLoaded', function() {
    initProfileFunctionality();
});

function initProfileFunctionality() {
    // Initialize venue modal
    initUserVenueModal();
    
    // Initialize plot deletion
    initPlotDeletion();
    
    // Initialize plot duplication
    initPlotDuplication();
}

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
    
    // Edit venue click handlers
    document.querySelectorAll('.edit-user-venue').forEach(link => {
        link.addEventListener('click', async (e) => {
            e.preventDefault();
            
            const venueId = link.getAttribute('data-venue-id');
            
            try {
                // Fetch venue data using public handler
                const response = await fetch(`/handlers/get_user_venue.php?id=${venueId}`);
                const data = await response.json();
                
                if (data.success) {
                    // Populate form with venue data
                    document.getElementById('user_venue_id').value = data.venue.user_venue_id;
                    document.getElementById('venue_name').value = data.venue.venue_name || '';
                    document.getElementById('venue_street').value = data.venue.venue_street || '';
                    document.getElementById('venue_city').value = data.venue.venue_city || '';
                    document.getElementById('venue_state_id').value = data.venue.venue_state_id || '';
                    document.getElementById('venue_zip').value = data.venue.venue_zip || '';
                    document.getElementById('stage_width').value = data.venue.stage_width || '';
                    document.getElementById('stage_depth').value = data.venue.stage_depth || '';
                    
                    // Update modal title
                    modal.querySelector('h2').textContent = 'Edit Custom Venue';
                    
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
    
    // Remove venue click handlers
    document.querySelectorAll('.remove-user-venue').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const venueId = link.getAttribute('data-venue-id');
            const venueName = link.getAttribute('data-venue-name');
            
            if (confirm(`Are you sure you want to delete "${venueName}"?\nThis action cannot be undone.`)) {
                // Use public handler for deletion
                fetch(`/handlers/delete_user_venue.php?id=${venueId}`)
                    .then(response => response.json())
                    .then(data => {
                        if (data.success) {
                            // Remove venue row from DOM
                            const venueRow = link.closest('tr');
                            if (venueRow) {
                                venueRow.remove();
                                
                                // Check if there are no more venues
                                const venuesTable = document.querySelector('#profile-venues-table');
                                if (venuesTable && venuesTable.rows.length <= 1) {
                                    // Replace with empty state
                                    const venueSection = document.querySelector('.profile-section:nth-of-type(2)');
                                    venueSection.innerHTML = `
                                        <div class="section-header">
                                            <h2>Your Custom Venues</h2>
                                            <button id="profile-add-venue-button" class="action-button"><i class="fa-solid fa-plus"></i> Add Venue</button>
                                        </div>
                                        <div class="empty-section">
                                            <p>You haven't created any custom venues yet.</p>
                                            <button id="profile-add-venue-empty" class="primary-button">Add Custom Venue</button>
                                        </div>
                                    `;
                                    // Re-initialize venue modal functionality
                                    initUserVenueModal();
                                }
                            }
                            
                            showNotification('Venue deleted successfully!', 'success');
                        } else {
                            showNotification('Error deleting venue: ' + (data.error || 'Unknown error'), 'error');
                        }
                    })
                    .catch(error => {
                        console.error('Error:', error);
                        showNotification('An unexpected error occurred', 'error');
                    });
            }
        });
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
        
        // Get form data
        const formData = new FormData(form);
        const venueId = formData.get('user_venue_id');
        const isEdit = !!venueId && venueId.trim() !== '';
        
        // Convert to JSON object
        const jsonData = {};
        formData.forEach((value, key) => {
            jsonData[key] = value;
        });
        
        console.log('Form data being sent:', jsonData);
        console.log('Is edit mode?', isEdit, 'Venue ID:', venueId);
        
        try {
            // Send request to server using public handler
            const response = await fetch('/handlers/save_user_venue.php', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(jsonData)
            });
            
            const data = await response.json();
            
            if (data.success) {
                // Show success message
                showNotification(isEdit ? 'Venue updated successfully!' : 'Venue added successfully!', 'success');
                
                // Close modal and reload page
                closeModal(modal);
                window.location.reload();
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

function initPlotDeletion() {
    document.querySelectorAll('.remove-plot').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const plotId = link.getAttribute('data-plot-id');
            const plotName = link.getAttribute('data-plot-name');
            
            if (confirm(`Are you sure you want to delete "${plotName}"?\nThis action cannot be undone.`)) {
                fetch('/handlers/delete_plot.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded'
                    },
                    body: `plot_id=${encodeURIComponent(plotId)}`
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        // Remove plot card from DOM
                        const plotCard = link.closest('.plot-card');
                        if (plotCard) {
                            plotCard.remove();
                            
                            // Check if there are no more plots
                            const plotsGrid = document.querySelector('.plots-grid');
                            if (plotsGrid && plotsGrid.children.length === 0) {
                                // Replace with empty state
                                const plotSection = document.querySelector('.profile-section');
                                plotSection.innerHTML = `
                                    <div class="section-header">
                                        <h2>Your Saved Plots</h2>
                                        <a href="/index.php" class="action-button"><i class="fa-solid fa-plus"></i> Create New Plot</a>
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
                })
                .catch(error => {
                    console.error('Error:', error);
                    showNotification('An unexpected error occurred', 'error');
                });
            }
        });
    });
}

function initPlotDuplication() {
    // Implement plot duplication if needed
    document.querySelectorAll('.duplicate-plot').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const plotId = link.getAttribute('data-plot-id');
            
            // For now, just redirect to create page with plotId parameter
            // In the future, implement an actual duplication endpoint
            window.location.href = `/index.php?duplicate=${plotId}`;
        });
    });
}
</script>

<?php
include PRIVATE_PATH . '/templates/footer.php';
?>
