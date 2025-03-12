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

// Only allow POST requests for deletion
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

// Determine allowed roles based on current user's role
if ($currentRole == 2) {
    // Admin can only remove members (role_id 1)
    $allowedRoles = [1];
} elseif ($currentRole == 3) {
    // Super admin can remove members (1) and admins (2), but not other super admins (3)
    $allowedRoles = [1, 2];
}

try {
    $userManager = new User();
    $success = $userManager->deleteUser($targetUserId, $allowedRoles);
    
    if ($success) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'No user found or deletion not allowed']);
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
