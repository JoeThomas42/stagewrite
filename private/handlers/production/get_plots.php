<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Ensure user is logged in
$userObj = new User();
if (!$userObj->isLoggedIn()) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

// Connect to database
$db = Database::getInstance();

// Get user's saved plots with venue information
try {
    $plots = $db->fetchAll("
        SELECT sp.plot_id, sp.plot_name, sp.event_date_start, sp.event_date_end, 
               v.venue_name, v.venue_id
        FROM saved_plots sp
        JOIN venues v ON sp.venue_id = v.venue_id
        WHERE sp.user_id = ?
        ORDER BY sp.event_date_start DESC
    ", [$_SESSION['user_id']]);

    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'plots' => $plots]);
} catch (Exception $e) {
    error_log('Error fetching plots: ' . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
