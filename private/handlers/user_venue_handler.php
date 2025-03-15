<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

$currentUser = new User();
if (!$currentUser->isLoggedIn()) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Unauthorized access']);
    exit;
}

header('Content-Type: application/json');
require_once INCLUDES_PATH . '/VenueManager.php';
$venueManager = new VenueManager();

// POST request to create a venue
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Sanitize inputs
    $venueData = [
        'venue_id' => null, // Always create new venues for this handler
        'venue_name' => htmlspecialchars(trim($_POST['venue_name'] ?? '')),
        'venue_street' => htmlspecialchars(trim($_POST['venue_street'] ?? '')),
        'venue_city' => htmlspecialchars(trim($_POST['venue_city'] ?? '')),
        'venue_state_id' => !empty($_POST['venue_state_id']) ? filter_var($_POST['venue_state_id'], FILTER_VALIDATE_INT) : null,
        'venue_zip' => !empty($_POST['venue_zip']) ? htmlspecialchars(trim($_POST['venue_zip'])) : null,
        'stage_width' => filter_var($_POST['stage_width'] ?? 0, FILTER_VALIDATE_INT),
        'stage_depth' => filter_var($_POST['stage_depth'] ?? 0, FILTER_VALIDATE_INT)
    ];
    
    // Validate venue data
    $errors = $venueManager->validateVenueData($venueData);
    
    if (!empty($errors)) {
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit;
    }
    
    try {
        $success = $venueManager->saveVenue($venueData);
        
        if ($success) {
            // Return the newly created venue info
            $db = Database::getInstance();
            $newVenueId = $db->getConnection()->lastInsertId();
            $newVenue = $db->fetchOne("
                SELECT venue_id, venue_name, venue_street, venue_city, 
                       venue_state_id, venue_zip, stage_width, stage_depth 
                FROM venues
                WHERE venue_id = ?
            ", [$newVenueId]);
            
            echo json_encode(['success' => true, 'venue' => $newVenue]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Failed to save venue']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

// GET request to get venue details
else if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['id'])) {
    $venueId = filter_var($_GET['id'], FILTER_VALIDATE_INT);
    
    if (!$venueId) {
        echo json_encode(['success' => false, 'error' => 'Invalid venue ID']);
        exit;
    }
    
    try {
        $db = Database::getInstance();
        $venue = $db->fetchOne("
            SELECT v.*, s.state_name, s.state_abbr 
            FROM venues v
            LEFT JOIN states s ON v.venue_state_id = s.state_id
            WHERE v.venue_id = ?
        ", [$venueId]);
        
        if ($venue) {
            echo json_encode(['success' => true, 'venue' => $venue]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Venue not found']);
        }
    } catch (Exception $e) {
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}
