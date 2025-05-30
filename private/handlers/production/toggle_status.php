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

$allowedRoles = ($currentRole == 2) ? [1] : [1, 2];

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
