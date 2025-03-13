<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Check if venue ID is provided
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Invalid venue ID']);
    exit;
}

$venueId = (int)$_GET['id'];
$db = Database::getInstance();

try {
    // Fetch venue details
    $venue = $db->fetchOne("
        SELECT venue_id, venue_name, venue_street, venue_city, 
               venue_state_id, venue_zip, stage_width, stage_depth 
        FROM venues
        WHERE venue_id = ?
    ", [$venueId]);

    if (!$venue) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'Venue not found']);
        exit;
    }

    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'venue' => $venue]);

} catch (Exception $e) {
    error_log('Error fetching venue: ' . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
