<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Ensure JSON response
header('Content-Type: application/json');

// Check that user is logged in
$currentUser = new User();
if (!$currentUser->isLoggedIn()) {
    http_response_code(401);
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// Check required parameter
if (empty($_POST['element_id']) || !is_numeric($_POST['element_id'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Missing or invalid element ID']);
    exit;
}

$elementId = (int)$_POST['element_id'];
$userId = $_SESSION['user_id'];

// Connect to database
$db = Database::getInstance();

try {
    // Check if the favorite already exists
    $favorite = $db->fetchOne(
        "SELECT favorite_id FROM user_favorites 
         WHERE user_id = ? AND element_id = ?",
        [$userId, $elementId]
    );
    
    if ($favorite) {
        // Favorite exists, remove it
        $db->query(
            "DELETE FROM user_favorites WHERE favorite_id = ?",
            [$favorite['favorite_id']]
        );
        
        echo json_encode([
            'success' => true, 
            'action' => 'removed',
            'message' => 'Removed from favorites'
        ]);
    } else {
        // Favorite doesn't exist, add it
        $db->query(
            "INSERT INTO user_favorites (user_id, element_id) 
             VALUES (?, ?)",
            [$userId, $elementId]
        );
        
        echo json_encode([
            'success' => true, 
            'action' => 'added',
            'message' => 'Added to favorites'
        ]);
    }
} catch (Exception $e) {
    error_log('Error toggling favorite: ' . $e->getMessage());
    http_response_code(500);
    echo json_encode([
        'success' => false, 
        'error' => 'Database error: ' . $e->getMessage()
    ]);
}
