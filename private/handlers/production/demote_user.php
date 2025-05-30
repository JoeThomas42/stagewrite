<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

header('Content-Type: application/json');

$currentUser = new User();
if (!$currentUser->hasRole(3)) {
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

try {
  $userManager = new User();
  $success = $userManager->demoteToMember($targetUserId);

  if ($success) {
    echo json_encode(['success' => true]);
  } else {
    http_response_code(400);
    echo json_encode(['error' => 'User not found or is not an admin']);
  }
} catch (Exception $e) {
  http_response_code(500);
  echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
}
