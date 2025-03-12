<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Ensure JSON response
header('Content-Type: application/json');

// Check that the user is logged in and is a super admin
if (!isset($_SESSION['user_id']) || $_SESSION['role_id'] != 3) {
    http_response_code(403);
    echo json_encode(['error' => 'Unauthorized']);
    exit;
}

// Only allow POST requests for demotion
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

$userId = trim($_POST['user_id']);

try {
    // Verify the user is an admin (role_id = 2)
    $checkStmt = $pdo->prepare("SELECT role_id FROM users WHERE user_id = :user_id");
    $checkStmt->bindParam(':user_id', $userId);
    $checkStmt->execute();
    $user = $checkStmt->fetch(PDO::FETCH_ASSOC);
    
    if (!$user || $user['role_id'] != 2) {
        http_response_code(400);
        echo json_encode(['error' => 'User not found or is not an admin']);
        exit;
    }
    
    // Demote the user to member (role_id = 1)
    $updateStmt = $pdo->prepare("UPDATE users SET role_id = 1 WHERE user_id = :user_id");
    $updateStmt->bindParam(':user_id', $userId);
    $updateStmt->execute();
    
    if ($updateStmt->rowCount() > 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'Failed to demote user']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
