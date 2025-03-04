<?php

require_once __DIR__ . '/../../bootstrap.php';

// Ensure JSON response
header('Content-Type: application/json');

// Check that the user is logged in and is an admin or super admin
if (!isset($_SESSION['user_id']) || !in_array($_SESSION['role_id'], [2, 3])) {
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

$targetUserId = $_POST['user_id'];
$currentRole = $_SESSION['role_id'];

// Determine which target roles the current user is allowed to modify
if ($currentRole == 2) { 
    // Admin can only toggle members (role_id 1)
    $allowedRoles = [1];
} elseif ($currentRole == 3) {
    // Super admin can toggle members (1) and admins (2)
    $allowedRoles = [1, 2];
} else {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized role']);
    exit;
}

try {
    // Retrieve the current status and role of the target user
    $stmt = $pdo->prepare("SELECT role_id, is_active FROM users WHERE user_id = :user_id");
    $stmt->bindParam(':user_id', $targetUserId);
    $stmt->execute();
    $targetUser = $stmt->fetch(PDO::FETCH_ASSOC);

    if (!$targetUser || !in_array($targetUser['role_id'], $allowedRoles)) {
        http_response_code(403);
        echo json_encode(['error' => 'User not found or modification not allowed']);
        exit;
    }

    // Toggle the status
    $newStatus = $targetUser['is_active'] ? 0 : 1;

    // Update the status of the target user
    $updateStmt = $pdo->prepare("UPDATE users SET is_active = :newStatus WHERE user_id = :user_id");
    $updateStmt->bindParam(':newStatus', $newStatus, PDO::PARAM_INT);
    $updateStmt->bindParam(':user_id', $targetUserId);
    $updateStmt->execute();

    // Return success response with new status
    echo json_encode([
        'success' => true,
        'user_id' => $targetUserId,
        'is_active' => $newStatus,
        'status_text' => $newStatus ? 'Active' : 'Inactive'
    ]);
    
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
