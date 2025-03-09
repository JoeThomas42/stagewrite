<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Ensure user is an admin or super admin
if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role_id'], [2, 3])) {
    header('Content-Type: application/json');
    echo json_encode(['error' => 'Unauthorized access']);
    exit;
}

header('Content-Type: application/json');

// GET request to retrieve venue data
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get') {
    if (!isset($_GET['venue_id']) || empty($_GET['venue_id'])) {
        echo json_encode(['error' => 'Missing venue ID']);
        exit;
    }
    
    $venueId = filter_var($_GET['venue_id'], FILTER_VALIDATE_INT);
    if (!$venueId) {
        echo json_encode(['error' => 'Invalid venue ID']);
        exit;
    }
    
    try {
        $stmt = $pdo->prepare("SELECT * FROM venues WHERE venue_id = :venue_id");
        $stmt->bindParam(':venue_id', $venueId, PDO::PARAM_INT);
        $stmt->execute();
        $venue = $stmt->fetch(PDO::FETCH_ASSOC);
        
        if ($venue) {
            echo json_encode(['success' => true, 'venue' => $venue]);
        } else {
            echo json_encode(['error' => 'Venue not found']);
        }
    } catch (PDOException $e) {
        echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
    }
}

// POST request to update venue
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update') {
    // Validate required fields
    $errors = [];
    
    if (empty($_POST['venue_id'])) {
        $errors['venue_id'] = 'Venue ID is required';
    }
    
    if (empty($_POST['venue_name'])) {
        $errors['venue_name'] = 'Venue name is required';
    }
    
    if (empty($_POST['stage_width'])) {
        $errors['stage_width'] = 'Stage width is required';
    } else if (!filter_var($_POST['stage_width'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 200]])) {
        $errors['stage_width'] = 'Stage width must be between 1 and 200';
    }
    
    if (empty($_POST['stage_depth'])) {
        $errors['stage_depth'] = 'Stage depth is required';
    } else if (!filter_var($_POST['stage_depth'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 200]])) {
        $errors['stage_depth'] = 'Stage depth must be between 1 and 200';
    }
    
    // ZIP code validation if provided
    if (!empty($_POST['venue_zip']) && !preg_match('/^\d{5}$/', $_POST['venue_zip'])) {
        $errors['venue_zip'] = 'ZIP code must be 5 digits';
    }
    
    if (!empty($errors)) {
        echo json_encode(['success' => false, 'errors' => $errors]);
        exit;
    }
    
    // Sanitize inputs
    $venueId = filter_var($_POST['venue_id'], FILTER_VALIDATE_INT);
    $venueName = htmlspecialchars(trim($_POST['venue_name']));
    $venueStreet = htmlspecialchars(trim($_POST['venue_street'] ?? ''));
    $venueCity = htmlspecialchars(trim($_POST['venue_city'] ?? ''));
    // Fix the variable name to match what's used in the SQL binding
    $venueStateId = !empty($_POST['venue_state_id']) ? filter_var($_POST['venue_state_id'], FILTER_VALIDATE_INT) : null;
    $venueZip = !empty($_POST['venue_zip']) ? htmlspecialchars(trim($_POST['venue_zip'])) : null;
    $stageWidth = filter_var($_POST['stage_width'], FILTER_VALIDATE_INT);
    $stageDepth = filter_var($_POST['stage_depth'], FILTER_VALIDATE_INT);
    
    try {
        $stmt = $pdo->prepare(
            "UPDATE venues SET 
                venue_name = :venue_name,
                venue_street = :venue_street,
                venue_city = :venue_city,
                venue_state_id = :venue_state_id,
                venue_zip = :venue_zip,
                stage_width = :stage_width,
                stage_depth = :stage_depth
             WHERE venue_id = :venue_id"
        );
        
        $stmt->bindParam(':venue_id', $venueId, PDO::PARAM_INT);
        $stmt->bindParam(':venue_name', $venueName);
        $stmt->bindParam(':venue_street', $venueStreet);
        $stmt->bindParam(':venue_city', $venueCity);
        $stmt->bindParam(':venue_state_id', $venueStateId, $venueStateId ? PDO::PARAM_INT : PDO::PARAM_NULL);
        $stmt->bindParam(':venue_zip', $venueZip);
        $stmt->bindParam(':stage_width', $stageWidth, PDO::PARAM_INT);
        $stmt->bindParam(':stage_depth', $stageDepth, PDO::PARAM_INT);
        
        $stmt->execute();
        
        echo json_encode(['success' => true]);
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}

// POST request to delete venue
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'delete') {
    if (empty($_POST['venue_id'])) {
        echo json_encode(['success' => false, 'error' => 'Missing venue ID']);
        exit;
    }
    
    $venueId = filter_var($_POST['venue_id'], FILTER_VALIDATE_INT);
    if (!$venueId) {
        echo json_encode(['success' => false, 'error' => 'Invalid venue ID']);
        exit;
    }
    
    try {
        // First check if this venue is used in any saved plots
        $checkStmt = $pdo->prepare("SELECT COUNT(*) FROM saved_plots WHERE venue_id = :venue_id");
        $checkStmt->bindParam(':venue_id', $venueId, PDO::PARAM_INT);
        $checkStmt->execute();
        $usageCount = $checkStmt->fetchColumn();
        
        if ($usageCount > 0) {
            // Update saved plots to use the default venue (ID 1)
            $updateStmt = $pdo->prepare("UPDATE saved_plots SET venue_id = 1 WHERE venue_id = :venue_id");
            $updateStmt->bindParam(':venue_id', $venueId, PDO::PARAM_INT);
            $updateStmt->execute();
        }
        
        // Now delete the venue
        $stmt = $pdo->prepare("DELETE FROM venues WHERE venue_id = :venue_id");
        $stmt->bindParam(':venue_id', $venueId, PDO::PARAM_INT);
        $stmt->execute();
        
        if ($stmt->rowCount() > 0) {
            echo json_encode(['success' => true]);
        } else {
            echo json_encode(['success' => false, 'error' => 'Venue not found']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
    }
}
