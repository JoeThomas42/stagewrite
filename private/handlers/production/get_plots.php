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

// Get user's saved plots with venue information - modified to handle both venue types
try {
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
    ", [$_SESSION['user_id']]);

    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'plots' => $plots]);
} catch (Exception $e) {
    error_log('Error fetching plots: ' . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
