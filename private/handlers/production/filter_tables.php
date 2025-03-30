<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Check that the user is logged in and has admin permissions
$currentUser = new User();
if (!$currentUser->hasRole([2, 3])) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

// Get the search query and table type
$query = trim($_GET['query'] ?? '');
$tableType = $_GET['table'] ?? '';

// Connect to database
$db = Database::getInstance();

// Validate table type
$validTables = ['members', 'admins', 'venues'];
if (!in_array($tableType, $validTables)) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Invalid table type']);
    exit;
}

try {
    $data = [];
    
    // Define search conditions based on table type
    if ($tableType === 'members') {
        // Search for members
        $searchCondition = '';
        if (!empty($query)) {
            $searchCondition = "AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
            $searchParams = ["%$query%", "%$query%", "%$query%"];
        } else {
            $searchParams = [];
        }
        
        // Get filtered data
        $dataQuery = "SELECT user_id, first_name, last_name, email, is_active 
                     FROM users 
                     WHERE role_id = 1 $searchCondition
                     ORDER BY last_name";
        $data = $db->fetchAll($dataQuery, $searchParams);
    } elseif ($tableType === 'admins') {
        // Search for admins
        $searchCondition = '';
        if (!empty($query)) {
            $searchCondition = "AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
            $searchParams = ["%$query%", "%$query%", "%$query%"];
        } else {
            $searchParams = [];
        }
        
        // Get filtered data
        $dataQuery = "SELECT user_id, first_name, last_name, email, is_active 
                     FROM users 
                     WHERE role_id = 2 $searchCondition
                     ORDER BY last_name";
        $data = $db->fetchAll($dataQuery, $searchParams);
    } elseif ($tableType === 'venues') {
        // Search for venues
        $searchCondition = '';
        if (!empty($query)) {
            $searchCondition = "AND (v.venue_name LIKE ? OR v.venue_city LIKE ? OR s.state_name LIKE ?)";
            $searchParams = ["%$query%", "%$query%", "%$query%"];
        } else {
            $searchParams = [];
        }
        
        // Get filtered data
        $dataQuery = "SELECT v.*, s.state_abbr, s.state_name 
                     FROM venues v
                     LEFT JOIN states s ON v.venue_state_id = s.state_id
                     WHERE 1=1 $searchCondition
                     ORDER BY v.venue_name";
        $data = $db->fetchAll($dataQuery, $searchParams);
    }
    
    // Return results
    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'data' => $data
    ]);
} catch (Exception $e) {
    error_log('Error filtering table: ' . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
