<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Always return JSON
header('Content-Type: application/json');

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
  echo json_encode(['success' => false, 'error' => 'Not logged in']);
  exit;
}

// Get user ID from session
$userId = $_SESSION['user_id'];

// Database connection
$db = Database::getInstance();

try {
  // Get user info
  $user = $db->fetchOne(
    "SELECT email FROM users WHERE user_id = ?",
    [$userId]
  );

  if (!$user) {
    echo json_encode(['success' => false, 'error' => 'User not found']);
    exit;
  }

  // Return user info
  echo json_encode([
    'success' => true,
    'email' => $user['email']
  ]);
} catch (Exception $e) {
  error_log('Error getting user info: ' . $e->getMessage());
  echo json_encode(['success' => false, 'error' => 'Database error']);
}
