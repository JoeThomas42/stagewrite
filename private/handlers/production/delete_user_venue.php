<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Ensure user is logged in
$userObj = new User();
if (!$userObj->isLoggedIn()) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

// Check for venue ID in GET or POST
$venueId = null;
if (isset($_GET['id']) && is_numeric($_GET['id'])) {
    $venueId = (int)$_GET['id'];
} elseif (isset($_POST['venue_id']) && is_numeric($_POST['venue_id'])) {
    $venueId = (int)$_POST['venue_id'];
}

if (!$venueId) {
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        // AJAX request
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'Missing or invalid venue ID']);
    } else {
        // Regular request
        header('Location: /profile.php?error=missing_venue_id');
    }
    exit;
}

// Connect to database
$db = Database::getInstance();

try {
    // Begin transaction
    $db->getConnection()->beginTransaction();
    
    // First check if venue belongs to current user
    $venue = $db->fetchOne(
        "SELECT user_venue_id FROM user_venues WHERE user_venue_id = ? AND user_id = ?", 
        [$venueId, $_SESSION['user_id']]
    );
    
    if (!$venue) {
        if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
            // AJAX request
            header('Content-Type: application/json');
            echo json_encode(['success' => false, 'error' => 'Venue not found or access denied']);
        } else {
            // Regular request
            header('Location: /profile.php?error=venue_not_found');
        }
        exit;
    }
    
    // Update any plots using this venue to use no venue
    $db->query(
        "UPDATE saved_plots SET user_venue_id = NULL WHERE user_venue_id = ? AND user_id = ?",
        [$venueId, $_SESSION['user_id']]
    );
    
    // Delete the venue
    $db->query(
        "DELETE FROM user_venues WHERE user_venue_id = ? AND user_id = ?",
        [$venueId, $_SESSION['user_id']]
    );
    
    // Commit transaction
    $db->getConnection()->commit();
    
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        // AJAX request
        header('Content-Type: application/json');
        echo json_encode(['success' => true]);
    } else {
        // Regular request
        header('Location: /profile.php?success=venue_deleted');
    }
    
} catch (Exception $e) {
    // Rollback on error
    if ($db->getConnection()->inTransaction()) {
        $db->getConnection()->rollBack();
    }
    
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        // AJAX request
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    } else {
        // Regular request
        header('Location: /profile.php?error=database_error');
    }
}
?>
