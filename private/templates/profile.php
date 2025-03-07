<?php

$current_page = "Profile";
include 'header.php';
echo "<div class='page-wrapper'>";

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

    // Fetch venues
    $venuesStmt = $pdo->query("SELECT * FROM venues");
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

    echo "<h2>Manage Venues:</h2>";
    echo "<table border='1'>";
    echo "<tr><th>ID</th><th>Name</th><th>City</th><th>State</th><th>Actions</th></tr>";
    foreach ($venues as $venue) {
        echo "<tr>
                <td>{$venue['venue_id']}</td>
                <td>{$venue['venue_name']}</td>
                <td>{$venue['venue_city']}</td>
                <td>{$venue['venue_state_id']}</td>
                <td><a href='/edit_venue.php?venue_id={$venue['venue_id']}'>Edit</a></td>
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

    // Fetch venues
    $venuesStmt = $pdo->query("SELECT * FROM venues");
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
                    <a href='#' class='remove-user' data-user-id='{$member['user_id']}' data-user-name='{$member['first_name']} {$member['last_name']}'>Remove</a>
                </td>
              </tr>";
    }
    echo "</table>";
    
    // Display Venues
    echo "<h2>Manage Venues:</h2>";
    echo "<table>";
    echo "<tr><th>ID</th><th>Name</th><th>City</th><th>State</th><th>Actions</th></tr>";
    foreach ($venues as $venue) {
        echo "<tr>
                <td>{$venue['venue_id']}</td>
                <td>{$venue['venue_name']}</td>
                <td>{$venue['venue_city']}</td>
                <td>{$venue['venue_state_id']}</td>
                <td class='action-links'>
                    <a href='/edit_venue.php?venue_id={$venue['venue_id']}'>Edit</a>
                </td>
              </tr>";
    }
    echo "</table>";

    echo "</div>";
    
} else {
    echo "Invalid role.";
}

echo "</div>";
include 'footer.php';
