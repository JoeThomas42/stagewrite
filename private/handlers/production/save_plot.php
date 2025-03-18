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
    
    // Validate required data
    if (empty($data['plot_name']) || empty($data['venue_id']) || 
        !isset($data['elements']) || !is_array($data['elements'])) {
        throw new Exception('Missing required data');
    }
    
    // Begin transaction
    $db->getConnection()->beginTransaction();
    
    // Determine if this is a standard venue or user venue
    $venueId = null;
    $userVenueId = null;
    
    if (strpos($data['venue_id'], 'user_') === 0) {
        // This is a user venue
        $userVenueId = (int)str_replace('user_', '', $data['venue_id']);
    } else {
        // This is a standard venue
        $venueId = (int)$data['venue_id'];
    }
    
    if (!empty($data['plot_id'])) {
        // This is an update to an existing plot
        // First, delete existing placed elements
        $db->query(
            "DELETE FROM placed_elements WHERE plot_id = ?",
            [$data['plot_id']]
        );
        
        // Then update the plot details - now including both venue_id and user_venue_id
        $db->query(
            "UPDATE saved_plots SET 
             plot_name = ?, venue_id = ?, user_venue_id = ?, event_date_start = ?, event_date_end = ?, updated_at = NOW()
             WHERE plot_id = ? AND user_id = ?",
            [
                $data['plot_name'],
                $venueId, // May be null if using user venue
                $userVenueId, // May be null if using standard venue
                !empty($data['event_date_start']) ? $data['event_date_start'] : null,
                !empty($data['event_date_end']) ? $data['event_date_end'] : null,
                $data['plot_id'],
                $_SESSION['user_id']
            ]
        );
        
        // Use the existing plot_id
        $plotId = $data['plot_id'];
    } else {
        // This is a new plot - insert with venue_id or user_venue_id
        $stmt = $db->query(
            "INSERT INTO saved_plots (user_id, plot_name, venue_id, user_venue_id, event_date_start, event_date_end, created_at) 
             VALUES (?, ?, ?, ?, ?, ?, NOW())",
            [
                $_SESSION['user_id'],
                $data['plot_name'],
                $venueId, // May be null if using user venue
                $userVenueId, // May be null if using standard venue
                !empty($data['event_date_start']) ? $data['event_date_start'] : null,
                !empty($data['event_date_end']) ? $data['event_date_end'] : null
            ]
        );
        
        // Get the new plot ID
        $plotId = $db->getConnection()->lastInsertId();
    }
    
    // Insert placed elements
    foreach ($data['elements'] as $element) {
        $db->query(
            "INSERT INTO placed_elements 
             (plot_id, element_id, x_position, y_position, width, height, rotation, flipped, z_index, label, notes) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $plotId,
                $element['element_id'],
                $element['x_position'],
                $element['y_position'],
                $element['width'],
                $element['height'],
                $element['rotation'],
                $element['flipped'],
                $element['z_index'],
                $element['label'] ?? '',
                $element['notes'] ?? ''
            ]
        );
    }
    
    // Commit the transaction
    $db->getConnection()->commit();
    
    // Return success
    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'plot_id' => $plotId]);
    
} catch (Exception $e) {
    // Rollback on error
    if ($db->getConnection()->inTransaction()) {
        $db->getConnection()->rollBack();
    }
    
    error_log('Error saving plot: ' . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
