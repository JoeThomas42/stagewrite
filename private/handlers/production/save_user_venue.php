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
    
    // Validate numeric fields only if they are provided
    if (!empty($data['stage_width']) && !is_numeric($data['stage_width'])) {
        throw new Exception('Stage width must be a numeric value');
    }
    
    if (!empty($data['stage_depth']) && !is_numeric($data['stage_depth'])) {
        throw new Exception('Stage depth must be a numeric value');
    }

    // Connect to database
    $db = Database::getInstance();
    
    // Process width and depth - convert to integers if present, otherwise null
    $stageWidth = !empty($data['stage_width']) ? (int)$data['stage_width'] : null;
    $stageDepth = !empty($data['stage_depth']) ? (int)$data['stage_depth'] : null;
    
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
    
    // Get state abbreviation if a state ID was provided
    $stateAbbr = null;
    if (!empty($data['venue_state_id'])) {
        $stateInfo = $db->fetchOne("SELECT state_abbr FROM states WHERE state_id = ?", [(int)$data['venue_state_id']]);
        if ($stateInfo) {
            $stateAbbr = $stateInfo['state_abbr'];
        }
    }
    
    // Return success with the new venue data
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true, 
        'venue' => [
            'user_venue_id' => $venueId,
            'venue_name' => $data['venue_name'],
            'venue_street' => $data['venue_street'] ?? null,
            'venue_city' => $data['venue_city'] ?? null,
            'venue_state_id' => !empty($data['venue_state_id']) ? (int)$data['venue_state_id'] : null,
            'state_abbr' => $stateAbbr,
            'venue_zip' => $data['venue_zip'] ?? null,
            'stage_width' => $stageWidth,
            'stage_depth' => $stageDepth
        ]
    ]);
    
} catch (Exception $e) {
    error_log('Error saving user venue: ' . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
