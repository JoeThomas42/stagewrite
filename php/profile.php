<?php
// Include external configuration
require_once 'config.php';

session_start();
if (!isset($_SESSION['user_id'])) {
    header('Location: /index.html');
    exit;
}

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Fetch user details
$user_id = $_SESSION['user_id'];
$stmt = $pdo->prepare("SELECT * FROM users WHERE user_id = :user_id");
$stmt->bindParam(':user_id', $user_id);
$stmt->execute();
$user = $stmt->fetch(PDO::FETCH_ASSOC);

if (!$user) {
    echo "User not found.";
    exit;
}

echo "<!DOCTYPE html>";
echo "<html>";
echo "<head>";
echo "<title>StageWrite Profile</title>";
echo "<link rel='stylesheet' href='../css/styles.css'>";
echo "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
echo "</head>";
echo "<body>";
echo "<div class='page-wrapper'>";

// Role-based logic
if ($user['role_id'] == 1) {
    // Member Page
    $savedPlotsStmt = $pdo->prepare("SELECT plot_name FROM saved_plots WHERE user_id = :user_id");
    $savedPlotsStmt->bindParam(':user_id', $user_id);
    $savedPlotsStmt->execute();
    $savedPlots = $savedPlotsStmt->fetchAll(PDO::FETCH_ASSOC);

    echo "<div class='profile-container'>";
    echo "<h1>Welcome, {$user['first_name']}!</h1>";
    echo "<h2>Your Saved Stage Plots:</h2>";
    echo "<ul>";
    foreach ($savedPlots as $plot) {
        echo "<li><a href='#'>{$plot['plot_name']}</a></li>";
    }
    echo "</ul>";
    echo "<a class='logout-link' href='logout.php'>Logout</a>";
    echo "</div>";
    

} elseif ($user['role_id'] == 2) {
    // Admin Page
    echo "<div class='profile-container'>";
    echo "<h1>Welcome, {$user['first_name']} {$user['last_name']}!</h1>";

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
                    <a href='/toggle_status.php?user_id={$member['user_id']}'>Toggle Status</a>
                    <a href='/remove_member.php?user_id={$member['user_id']}'>Remove</a>
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
    echo "<a href='logout.php'>Logout</a>";
    echo "</div>";

} elseif ($user['role_id'] == 3) {
    // Super Admin Page
    echo "<div class='profile-container'>";
    echo "<h1>Welcome, {$user['first_name']} {$user['last_name']}!</h1>";

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
                    <a href='/toggle_status.php?user_id={$admin['user_id']}'>Toggle Status</a>
                    <a href='/remove_admin.php?user_id={$admin['user_id']}'>Remove</a>
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
                    <a href='/toggle_status.php?user_id={$member['user_id']}'>Toggle Status</a>
                    <a href='/remove_member.php?user_id={$member['user_id']}'>Remove</a>
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
    
    // Logout Link
    echo "<a class='logout-link' href='logout.php'>Logout</a>";
    echo "</div>";
    
} else {
    echo "Invalid role.";
}

echo "</div>";
echo "</body>";
echo "</html>";
?>
