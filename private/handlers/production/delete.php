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

$memberId = $_POST['user_id'];

// Determine allowed roles based on current user's role
$currentRole = $_SESSION['role_id'];
if ($currentRole == 2) {
    // Admin can only remove members (role_id 1)
    $allowedRoles = [1];
} elseif ($currentRole == 3) {
    // Super admin can remove members (1) and admins (2), but not other super admins (3)
    $allowedRoles = [1, 2];
}

try {
    // Build the query with allowed roles
    $inQuery = implode(',', array_fill(0, count($allowedRoles), '?'));
    $sql = "DELETE FROM users WHERE user_id = ? AND role_id IN ($inQuery)";
    $stmt = $pdo->prepare($sql);
    
    // Execute with memberId followed by allowed roles
    $params = array_merge([$memberId], $allowedRoles);
    $stmt->execute($params);

    if ($stmt->rowCount() > 0) {
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['error' => 'No user found or deletion not allowed']);
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
