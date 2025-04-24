<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Always return JSON
header('Content-Type: application/json');

// Only process POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'error' => 'Method not allowed']);
  exit;
}

// Ensure user is logged in
if (!isset($_SESSION['user_id'])) {
  echo json_encode(['success' => false, 'error' => 'You must be logged in to change your email']);
  exit;
}

// Get JSON data
$jsonData = file_get_contents('php://input');
$data = json_decode($jsonData, true);

// Validate input
if (!isset($data['current_password']) || !isset($data['new_email'])) {
  echo json_encode(['success' => false, 'error' => 'Missing required fields']);
  exit;
}

$userId = $_SESSION['user_id'];
$currentPassword = $data['current_password'];
$newEmail = trim($data['new_email']);

// Validate email format
if (!filter_var($newEmail, FILTER_VALIDATE_EMAIL)) {
  echo json_encode(['success' => false, 'error' => 'Invalid email format']);
  exit;
}

// Database connection
$db = Database::getInstance();

try {
  // Verify current password
  $user = $db->fetchOne(
    "SELECT password_hash, email FROM users WHERE user_id = ?",
    [$userId]
  );

  if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
    echo json_encode(['success' => false, 'error' => 'Current password is incorrect']);
    exit;
  }

  // Check if new email is same as current
  if ($user['email'] === $newEmail) {
    echo json_encode(['success' => false, 'error' => 'New email is the same as current email']);
    exit;
  }

  // Check if email already exists for another user
  $existingUser = $db->fetchOne(
    "SELECT user_id FROM users WHERE email = ? AND user_id != ?",
    [$newEmail, $userId]
  );

  if ($existingUser) {
    echo json_encode(['success' => false, 'error' => 'Email address is already in use']);
    exit;
  }

  // Update the user's email
  $result = $db->query(
    "UPDATE users SET email = ? WHERE user_id = ?",
    [$newEmail, $userId]
  );

  if ($result->rowCount() === 0) {
    throw new Exception('Failed to update email');
  }

  // Return success
  echo json_encode(['success' => true, 'new_email' => $newEmail]);
} catch (Exception $e) {
  error_log('Error in email change: ' . $e->getMessage());
  echo json_encode(['success' => false, 'error' => 'An unexpected error occurred. Please try again later.']);
}
