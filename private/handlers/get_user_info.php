<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

header('Content-Type: application/json');

if (!isset($_SESSION['user_id'])) {
  echo json_encode(['success' => false, 'error' => 'Not logged in']);
  exit;
}

$userId = $_SESSION['user_id'];

$db = Database::getInstance();

try {
  $user = $db->fetchOne(
    "SELECT email FROM users WHERE user_id = ?",
    [$userId]
  );

  if (!$user) {
    echo json_encode(['success' => false, 'error' => 'User not found']);
    exit;
  }

  echo json_encode([
    'success' => true,
    'email' => $user['email']
  ]);
} catch (Exception $e) {
  error_log('Error getting user info: ' . $e->getMessage());
  echo json_encode(['success' => false, 'error' => 'Database error']);
}
