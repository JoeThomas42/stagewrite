<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Update the page title based on role
if ($user['role_id'] == 2 || $user['role_id'] == 3) {
    $current_page = "Data Management";
} else {
    $current_page = "Profile";
}
include 'header.php';

// Role-based logic
if ($user['role_id'] == 1) {
    // Member Page
    $savedPlotsStmt = $pdo->prepare("
        SELECT 
            sp.plot_name,
            v.venue_name,
            v.venue_city,
            s.state_name,
            sp.event_date_start,
            sp.event_date_end
        FROM saved_plots sp
        JOIN venues v ON sp.venue_id = v.venue_id
        JOIN states s ON v.venue_state_id = s.state_id
        WHERE sp.user_id = :user_id
        ORDER BY sp.event_date_start DESC  /* Changed from event_start_date */
    ");
    $savedPlotsStmt->bindParam(':user_id', $user_id);
    $savedPlotsStmt->execute();
    $savedPlots = $savedPlotsStmt->fetchAll(PDO::FETCH_ASSOC);

    echo "<div class='profile-container'>";
    
    echo "<h2>Your Saved Stage Plots:</h2>";
    echo "<ul class='plots-list'>";
    foreach ($savedPlots as $plot) {
        $dateDisplay = formatEventDate($plot['event_date_start'], $plot['event_date_end']);
        echo "<li>";
        echo "<a href='#' class='plot-link'>";
        echo "<div class='plot-name'>{$plot['plot_name']}</div>";
        echo "<div class='plot-details'>";
        echo "<span class='venue'>{$plot['venue_name']}</span>";
        echo "<span class='location'>{$plot['venue_city']}, {$plot['state_name']}</span>";
        echo "<span class='date'>$dateDisplay</span>";
        echo "</div>";
        echo "</a>";
        echo "</li>";
    }
    echo "</ul>";
    echo "</div>";

} elseif ($user['role_id'] == 2) {
    // Admin Page
    echo "<div class='profile-container'>";
    
    // Fetch members
    $membersStmt = $pdo->query("SELECT user_id, first_name, last_name, email, is_active FROM users WHERE role_id = 1");
    $members = $membersStmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch venues with state abbreviations
    $venuesStmt = $pdo->query("
        SELECT v.*, s.state_abbr, s.state_name 
        FROM venues v
        LEFT JOIN states s ON v.venue_state_id = s.state_id
    ");
    $venues = $venuesStmt->fetchAll(PDO::FETCH_ASSOC);

    echo "<h2>Manage Members:</h2>";
    echo "<table>";
    echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th><th>Actions</th></tr>";
    foreach ($members as $member) {
        echo "<tr>
                <td>{$member['user_id']}</td>
                <td>{$member['first_name']} {$member['last_name']}</td>
                <td>{$member['email']}</td>
                <td>" . ($member['is_active'] ? "Active" : "Inactive") . "</td>
                <td class='action-links'>
                    <a href='#' class='toggle-status' data-user-id='{$member['user_id']}' data-status='{$member['is_active']}'>Toggle Status</a>
                    <a href='#' class='remove-user' data-user-id='{$member['user_id']}' data-user-name='{$member['first_name']} {$member['last_name']}'>Remove</a>
                </td>
              </tr>";
    }
    echo "</table>";

    echo "<div class='heading-action-row'>";
    echo "<h2>Manage Venues:</h2>";
    echo "<button id='add-venue-button' class='action-button'>+ Add New Venue</button>";
    echo "</div>";
    echo "<table border='1'>";
    echo "<tr><th>ID</th><th>Name</th><th>City</th><th>State</th><th>Actions</th></tr>";
    foreach ($venues as $venue) {
        echo "<tr>
                <td>{$venue['venue_id']}</td>
                <td>{$venue['venue_name']}</td>
                <td>{$venue['venue_city']}</td>
                <td>" . (empty($venue['state_abbr']) ? '—' : htmlspecialchars($venue['state_abbr'])) . "</td>
                <td class='action-links'>
                    <a href='#' class='edit-venue' data-venue-id='{$venue['venue_id']}'>Edit</a>
                    <a href='#' class='remove-venue' data-venue-id='{$venue['venue_id']}' data-venue-name='{$venue['venue_name']}'>Delete</a>
                </td>
              </tr>";
    }
    echo "</table>";
    
    echo "</div>";

} elseif ($user['role_id'] == 3) {
    // Super Admin Page
    echo "<div class='profile-container'>";
    
    // Fetch admins
    $adminsStmt = $pdo->query("SELECT user_id, first_name, last_name, email, is_active FROM users WHERE role_id = 2");
    $admins = $adminsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch members
    $membersStmt = $pdo->query("SELECT user_id, first_name, last_name, email, is_active FROM users WHERE role_id = 1");
    $members = $membersStmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch venues with state abbreviations
    $venuesStmt = $pdo->query("
        SELECT v.*, s.state_abbr, s.state_name 
        FROM venues v
        LEFT JOIN states s ON v.venue_state_id = s.state_id
    ");
    $venues = $venuesStmt->fetchAll(PDO::FETCH_ASSOC);
    
    // Display Admins
    echo "<h2>Manage Admins:</h2>";
    echo "<table>";
    echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th><th>Actions</th></tr>";
    foreach ($admins as $admin) {
        echo "<tr>
                <td>{$admin['user_id']}</td>
                <td>{$admin['first_name']} {$admin['last_name']}</td>
                <td>{$admin['email']}</td>
                <td>" . ($admin['is_active'] ? "Active" : "Inactive") . "</td>
                <td class='action-links'>
                    <a href='#' class='toggle-status' data-user-id='{$admin['user_id']}' data-status='{$admin['is_active']}'>Toggle Status</a>
                    <a href='#' class='demote-user' data-user-id='{$admin['user_id']}' data-user-name='{$admin['first_name']} {$admin['last_name']}'>Demote to Member</a>
                    <a href='#' class='remove-user' data-user-id='{$admin['user_id']}' data-user-name='{$admin['first_name']} {$admin['last_name']}'>Remove</a>
                </td>
              </tr>";
    }
    echo "</table>";
    
    // Display Members
    echo "<h2>Manage Members:</h2>";
    echo "<table>";
    echo "<tr><th>ID</th><th>Name</th><th>Email</th><th>Status</th><th>Actions</th></tr>";
    foreach ($members as $member) {
        echo "<tr>
                <td>{$member['user_id']}</td>
                <td>{$member['first_name']} {$member['last_name']}</td>
                <td>{$member['email']}</td>
                <td>" . ($member['is_active'] ? "Active" : "Inactive") . "</td>
                <td class='action-links'>
                    <a href='#' class='toggle-status' data-user-id='{$member['user_id']}' data-status='{$member['is_active']}'>Toggle Status</a>
                    <a href='#' class='promote-user' data-user-id='{$member['user_id']}' data-user-name='{$member['first_name']} {$member['last_name']}'>Promote to Admin</a>
                    <a href='#' class='remove-user' data-user-id='{$member['user_id']}' data-user-name='{$member['first_name']} {$member['last_name']}'>Remove</a>
                </td>
              </tr>";
    }
    echo "</table>";
    
    // Display Venues
    echo "<div class='heading-action-row'>";
    echo "<h2>Manage Venues:</h2>";
    echo "<button id='add-venue-button' class='action-button'>+ Add New Venue</button>";
    echo "</div>";
    echo "<table>";
    echo "<tr><th>ID</th><th>Name</th><th>City</th><th>State</th><th>Actions</th></tr>";
    foreach ($venues as $venue) {
        echo "<tr>
                <td>{$venue['venue_id']}</td>
                <td>{$venue['venue_name']}</td>
                <td>{$venue['venue_city']}</td>
                <td>" . (empty($venue['state_abbr']) ? '—' : htmlspecialchars($venue['state_abbr'])) . "</td>
                <td class='action-links'>
                    <a href='#' class='edit-venue' data-venue-id='{$venue['venue_id']}'>Edit</a>
                    <a href='#' class='remove-venue' data-venue-id='{$venue['venue_id']}' data-venue-name='{$venue['venue_name']}'>Delete</a>
                </td>
              </tr>";
    }
    echo "</table>";

    echo "</div>";
    
} else {
    echo "Invalid role.";
}

// Venue Edit Modal
if ($user['role_id'] == 2 || $user['role_id'] == 3): ?>
<div id="venue-edit-modal" class="modal hidden">
  <div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Edit Venue</h2>
    <form id="venue-edit-form">
      <input type="hidden" id="venue_id" name="venue_id">
      
      <label for="venue_name">Venue Name:</label>
      <input type="text" id="venue_name" name="venue_name" required>
      
      <label for="venue_street">Street Address:</label>
      <input type="text" id="venue_street" name="venue_street">
      
      <label for="venue_city">City:</label>
      <input type="text" id="venue_city" name="venue_city">
      
      <label for="venue_state_id">State:</label>
      <select id="venue_state_id" name="venue_state_id">
        <option value="" selected disabled>Select State</option>
        <?php
        $statesStmt = $pdo->query("SELECT state_id, state_name FROM states ORDER BY state_name");
        $states = $statesStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($states as $state) {
            echo "<option value='{$state['state_id']}'>{$state['state_name']}</option>";
        }
        ?>
      </select>
      
      <label for="venue_zip">ZIP Code:</label>
      <input type="text" id="venue_zip" name="venue_zip" pattern="[0-9]{5}" title="Five digit zip code">
      
      <label for="stage_width">Stage Width (ft):</label>
      <input type="number" id="stage_width" name="stage_width" min="1" max="200" required>
      
      <label for="stage_depth">Stage Depth (ft):</label>
      <input type="number" id="stage_depth" name="stage_depth" min="1" max="200" required>
      
      <div class="form-actions">
        <button type="submit" class="save-button">Save Changes</button>
        <button type="button" class="cancel-button">Cancel</button>
      </div>
    </form>
  </div>
</div>

<?php 
endif;
require_once 'footer.php';
?>
