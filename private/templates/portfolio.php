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
$current_page = "Portfolio";
include PRIVATE_PATH . '/templates/header.php';

// Load user's saved plots - now including snapshot_filename
$plots = $db->fetchAll("
    SELECT 
        sp.plot_id, sp.plot_name, sp.event_date_start, sp.event_date_end,
        sp.snapshot_filename,
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
    ORDER BY sp.updated_at DESC
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

<div class="portfolio-container">
    <div class="portfolio-header">
        <h2>Your Portfolio</h2>
        <div class="user-info">
            <div class="user-name"><?= htmlspecialchars($user['first_name']) ?> <?= htmlspecialchars($user['last_name']) ?></div>
        </div>
    </div>

    <!-- Saved Plots Section -->
    <div class="portfolio-section">
        <div class="section-header">
            <h2>Your Saved Plots</h2>
        </div>
        
        <?php if (empty($plots)): ?>
            <div class="empty-section">
                <p>You don't have any saved plots yet. Start by creating a new plot!</p>
                <button class="primary-button"><a href="/index.php">Create Plot</a></button>
            </div>
        <?php else: ?>
            <div class="plots-grid">
                <?php foreach ($plots as $plot): ?>
                    <div class="plot-card">
                        <div class="plot-card-header">
                            <h3><?= htmlspecialchars($plot['plot_name']) ?></h3>
                        </div>
                        <div class="plot-card-content">
                            <div class="plot-card-details">
                                <div class="detail-item">
                                    <span class="detail-label">Venue:</span><br>
                                    <span class="detail-value"><?= htmlspecialchars($plot['venue_name']) ?></span>
                                </div>
                                <?php if (!empty($plot['event_date_start'])): ?>
                                    <div class="detail-item">
                                        <span class="detail-label">Date:</span><br>
                                        <span class="detail-value">
                                            <?= date('M j, Y', strtotime($plot['event_date_start'])) ?>
                                            <?php if (!empty($plot['event_date_end']) && $plot['event_date_end'] != $plot['event_date_start']): ?>
                                                - <?= date('M j, Y', strtotime($plot['event_date_end'])) ?>
                                            <?php endif; ?>
                                        </span>
                                    </div>
                                <?php endif; ?>
                            </div>
                            <?php if (!empty($plot['snapshot_filename'])): 
                                $snapshotUrl = "/handlers/get_snapshot.php?filename=" . urlencode($plot['snapshot_filename']) . "&v=" . ($plot['snapshot_version'] ?? time());
                            ?>
                                <div class="plot-card-snapshot snapshot-trigger" 
                                    data-snapshot-src="<?= $snapshotUrl ?>" 
                                    title="Click to enlarge snapshot">
                                    <img src="<?= $snapshotUrl ?>" 
                                        alt="Preview of <?= htmlspecialchars($plot['plot_name']) ?>" 
                                        class="plot-snapshot" />
                                </div>
                            <?php endif; ?>
                        </div>
                        <div class="plot-card-actions">
                            <button class="open-plot-btn"
                              data-plot-id="<?= $plot['plot_id'] ?>">
                              Open Plot</button>
                            <button class="share-plot-btn action-button"
                              data-plot-id="<?= $plot['plot_id'] ?>" data-plot-name="<?= htmlspecialchars($plot['plot_name']) ?>" title="Print / Share">
                              <i class="fa-solid fa-share-from-square"></i></button>
                            <button class="delete-plot-btn"
                              data-plot-id="<?= $plot['plot_id'] ?>" data-plot-name="<?= htmlspecialchars($plot['plot_name']) ?>" title="Delete plot">
                              <i class="fa-solid fa-delete-left"></i></button>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
    </div>

    <!-- Custom Venues Section -->
    <div class="portfolio-section">
        <div class="section-header">
            <h2>Your Custom Venues
                <span> - Click on a venue to edit or remove</span>
            </h2>
            <button id="portfolio-add-venue-button" class="small-button" title="Add New Venue"><i class="fa-solid fa-plus"></i></button>
        </div>
        
        <?php if (empty($userVenues)): ?>
            <div class="empty-section">
                <p>You haven't created any custom venues yet.</p>
                <button id="portfolio-add-venue-empty" class="primary-button">Add Custom Venue</button>
            </div>
        <?php else: ?>
            <div class="venues-table-container">
                <table id="portfolio-venues-table">
                    <tr>
                        <th class="med-column">Name</th>
                        <th class="lg-column">Address</th>
                        <th class="small-column">Stage Dimensions</th>
                    </tr>
                    <?php foreach ($userVenues as $venue): ?>
                        <tr class="clickable-venue-row" data-venue-id="<?= $venue['user_venue_id'] ?>" data-venue-name="<?= htmlspecialchars($venue['venue_name']) ?>">
                            <td data-label="Name"><?= htmlspecialchars($venue['venue_name']) ?></td>
                            <td data-label="Address">
                                <?php
                                $address = [];
                                if (!empty($venue['venue_street'])) $address[] = htmlspecialchars($venue['venue_street']);
                                if (!empty($venue['venue_city'])) $address[] = htmlspecialchars($venue['venue_city']);
                                if (!empty($venue['state_abbr'])) $address[] = htmlspecialchars($venue['state_abbr']);
                                if (!empty($venue['venue_zip'])) $address[] = htmlspecialchars($venue['venue_zip']);
                                echo !empty($address) ? implode(', ', $address) : '—';
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
                        </tr>
                    <?php endforeach; ?>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>

<!-- Add User Venue Modal -->
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
                    <label for="venue_city">City:</label>
                    <input type="text" id="venue_city" name="venue_city" maxlength="100">
                </div>

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
        <div class="modal-notification-area"></div>
    </div>
</div>

<!-- Venue View/Edit Modal -->
<div id="venue-modal" class="modal hidden">
    <div class="modal-content">
        <span class="close-button">&times;</span>
        <h2>Venue Details</h2>
        <form id="venue-modal-form">
            <input type="hidden" id="modal_venue_id" name="user_venue_id">
            
            <div class="form-group">
                <label for="modal_venue_name">Venue Name:</label>
                <input type="text" id="modal_venue_name" name="venue_name" maxlength="100" required>
            </div>
            
            <div class="form-group">
                <label for="modal_venue_street">Street Address:</label>
                <input type="text" id="modal_venue_street" name="venue_street" maxlength="100">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="modal_venue_city">City:</label>
                    <input type="text" id="modal_venue_city" name="venue_city" maxlength="100">
                </div>
                
                <div class="form-group">
                    <label for="modal_venue_state_id">State:</label>
                    <select id="modal_venue_state_id" name="venue_state_id">
                        <option value="" selected disabled>Select State</option>
                        <?php
                        foreach ($states as $state) {
                            echo "<option value='{$state['state_id']}'>{$state['state_name']}</option>";
                        }
                        ?>
                    </select>
                </div>

                <div class="form-group">
                <label for="modal_venue_zip">ZIP:</label>
                    <input type="text" id="modal_venue_zip" name="venue_zip" maxlength="5">
                </div>
            </div>
            
            <div class="input-dimensions">
                <div class="form-group">
                    <label for="modal_stage_width">Stage Width (feet):</label>
                    <input type="number" id="modal_stage_width" name="stage_width" min="1" max="200" step="1">
                </div>
                
                <div class="form-group">
                    <label for="modal_stage_depth">Stage Depth (feet):</label>
                    <input type="number" id="modal_stage_depth" name="stage_depth" min="1" max="200" step="1">
                </div>
            </div>
            
            <div class="form-actions">
              <button type="submit" class="save-button">Save Changes</button>
              <button type="button" id="venue-delete-button" class="delete-button">Delete</button>
              <button type="button" class="cancel-button">Cancel</button>
            </div>
        </form>
        <div class="modal-notification-area"></div>
    </div>
</div>

<!-- Snapshot Modal -->
<div id="snapshot-modal" class="modal hidden">
    <div class="modal-content snapshot-modal-content">
        <span class="close-button">&times;</span>
        <img id="snapshot-modal-image" src="" alt="Enlarged Plot Snapshot" />
    </div>
</div>

<!-- Print/Share Modal -->
<div id="share-plot-modal" class="modal hidden">
    <div class="modal-content">
        <span class="close-button">&times;</span>
        <h2>Print & Share Options</h2>
        
        <div class="share-options-container">
            <div class="share-option">
                <button id="print-plot-btn" class="share-action-button">
                    <i class="fa-solid fa-print"></i>
                    <span>Print Stage Plot</span>
                </button>
                <p class="option-description">Print a detailed version of your stage plot with elements list and input list.</p>
            </div>
            
            <div class="share-option">
                <button id="pdf-download-btn" class="share-action-button">
                    <i class="fa-solid fa-file-pdf"></i>
                    <span>Download as PDF</span>
                </button>
                <p class="option-description">Download your stage plot as a PDF document.</p>
            </div>
            
            <div class="share-option">
                <button id="email-share-btn" class="share-action-button">
                    <i class="fa-solid fa-envelope"></i>
                    <span>Share via Email</span>
                </button>
                <p class="option-description">Share your stage plot with others via email.</p>
            </div>
        </div>
        
        <!-- Email sharing form, initially hidden -->
        <div id="email-share-form" class="hidden">
            <div class="form-group">
                <label for="share_email">Recipient Email:</label>
                <input type="email" id="share_email" name="share_email" required>
            </div>
            <div class="form-group">
                <label for="share_message">Message (Optional):</label>
                <textarea id="share_message" name="share_message" rows="3"></textarea>
            </div>
            <div class="form-actions">
                <button type="button" id="send-email-btn" class="primary-button">Send</button>
                <button type="button" id="back-to-options-btn" class="secondary-button">Back</button>
                <button type="button" class="cancel-button">Cancel</button>
            </div>
        </div>
        
        <div class="modal-notification-area"></div>
    </div>
</div>

<?php
include PRIVATE_PATH . '/templates/footer.php';
?>
