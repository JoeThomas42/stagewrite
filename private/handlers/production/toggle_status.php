<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Ensure JSON response
header('Content-Type: application/json');

// Check that the user is logged in and is an admin or super admin
$currentUser = new User();
if (!$currentUser->hasRole([2, 3])) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Only allow POST requests for toggling status
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Invalid request method']);
    exit;
}

// Check for required parameter
if (empty($_POST['user_id'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing user ID']);
    exit;
}

$targetUserId = trim($_POST['user_id']);
$currentRole = $_SESSION['role_id'];

// Determine which target roles the current user is allowed to modify
$allowedRoles = ($currentRole == 2) ? [1] : [1, 2]; // Admin or Super Admin

try {
    $userManager = new User();
    $result = $userManager->toggleUserStatus($targetUserId, $allowedRoles);
    
    if ($result) {
        echo json_encode($result);
    } else {
        http_response_code(403);
        echo json_encode(['error' => 'User not found or modification not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
