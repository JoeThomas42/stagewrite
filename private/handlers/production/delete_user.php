<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

header('Content-Type: application/json');

$currentUser = new User();
if (!$currentUser->hasRole([2, 3])) {
  http_response_code(403);
  echo json_encode(['error' => 'Unauthorized']);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['error' => 'Invalid request method']);
  exit;
}

if (empty($_POST['user_id'])) {
  http_response_code(400);
  echo json_encode(['error' => 'Missing user ID']);
  exit;
}

$targetUserId = trim($_POST['user_id']);
$currentRole = $_SESSION['role_id'];

if ($currentRole == 2) {
  $allowedRoles = [1];
} elseif ($currentRole == 3) {
  $allowedRoles = [1, 2];
}

try {
  $userManager = new User();
  $success = $userManager->deleteUser($targetUserId, $allowedRoles);

  if ($success) {
    echo json_encode(['success' => true]);
  } else {
    $_SESSION['error_message'] = "User deletion failed: No user found or insufficient permissions.";
    echo json_encode(['error' => 'No user found or deletion not allowed']);
  }
} catch (Exception $e) {
  $_SESSION['error_message'] = "Error deleting user: " . $e->getMessage();
  http_response_code(500);
  echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
