<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Ensure user is logged in
$userObj = new User();
if (!$userObj->isLoggedIn()) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

// Get JSON data
$jsonData = file_get_contents('php://input');
if (!$jsonData) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'No data received']);
    exit;
}

try {
    // Decode JSON data
    $data = json_decode($jsonData, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }
    
    // Validate required data - only venue name is required
    if (empty($data['venue_name'])) {
        throw new Exception('Venue name is required');
    }
    
    // Connect to database
    $db = Database::getInstance();
    
    // Check if this is an update (user_venue_id is present and not empty)
    $isUpdate = !empty($data['user_venue_id']);
    
    // Process width and depth - convert to integers if present, otherwise null
    $stageWidth = !empty($data['stage_width']) ? (int)$data['stage_width'] : null;
    $stageDepth = !empty($data['stage_depth']) ? (int)$data['stage_depth'] : null;
    
    if ($isUpdate) {
        // First verify the venue belongs to this user
        $venue = $db->fetchOne(
            "SELECT user_venue_id FROM user_venues WHERE user_venue_id = ? AND user_id = ?",
            [(int)$data['user_venue_id'], $_SESSION['user_id']]
        );
        
        if (!$venue) {
            throw new Exception('Venue not found or access denied');
        }
        
        // Update existing venue
        $db->query(
            "UPDATE user_venues SET 
                venue_name = ?, 
                venue_street = ?, 
                venue_city = ?, 
                venue_state_id = ?, 
                venue_zip = ?, 
                stage_width = ?, 
                stage_depth = ?
             WHERE user_venue_id = ? AND user_id = ?",
            [
                $data['venue_name'],
                $data['venue_street'] ?? null,
                $data['venue_city'] ?? null,
                !empty($data['venue_state_id']) ? (int)$data['venue_state_id'] : null,
                $data['venue_zip'] ?? null,
                $stageWidth,
                $stageDepth,
                (int)$data['user_venue_id'],
                $_SESSION['user_id']
            ]
        );
        
        // Return the venue ID
        $venueId = (int)$data['user_venue_id'];
    } else {
        // Insert the new user venue with address fields
        $db->query(
            "INSERT INTO user_venues (user_id, venue_name, venue_street, venue_city, venue_state_id, venue_zip, stage_width, stage_depth) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $_SESSION['user_id'],
                $data['venue_name'],
                $data['venue_street'] ?? null,
                $data['venue_city'] ?? null,
                !empty($data['venue_state_id']) ? (int)$data['venue_state_id'] : null,
                $data['venue_zip'] ?? null,
                $stageWidth,
                $stageDepth
            ]
        );
        
        // Get the new venue ID
        $venueId = $db->getConnection()->lastInsertId();
    }
    
    // Get the updated venue details including state abbreviation
    $updatedVenue = $db->fetchOne("
        SELECT uv.*, s.state_abbr, s.state_name 
        FROM user_venues uv
        LEFT JOIN states s ON uv.venue_state_id = s.state_id
        WHERE uv.user_venue_id = ? AND uv.user_id = ?
    ", [$venueId, $_SESSION['user_id']]);
    
    // Return success with the venue data
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true, 
        'venue' => $updatedVenue,
        'is_update' => $isUpdate
    ]);
    
} catch (Exception $e) {
    error_log('Error saving user venue: ' . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
