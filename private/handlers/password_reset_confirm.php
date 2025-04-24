<?php
// File: private/handlers/password_reset_confirm.php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Always return JSON
header('Content-Type: application/json');

// Only process POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'error' => 'Method not allowed']);
  exit;
}

// Get JSON data
$jsonData = file_get_contents('php://input');
$data = json_decode($jsonData, true);

// Validate input
if (!isset($data['token']) || !isset($data['user_id']) || !isset($data['new_password'])) {
  echo json_encode(['success' => false, 'error' => 'Missing required fields']);
  exit;
}

$token = trim($data['token']);
$userId = trim($data['user_id']);
$newPassword = $data['new_password'];

// Validate password
if (strlen($newPassword) < 8) {
  echo json_encode(['success' => false, 'error' => 'Password must be at least 8 characters']);
  exit;
}

if (!preg_match('/[0-9]/', $newPassword)) {
  echo json_encode(['success' => false, 'error' => 'Password must include at least one number']);
  exit;
}

// Database connection
$db = Database::getInstance();

try {
  // Begin transaction
  $db->getConnection()->beginTransaction();

  // Verify token is valid and not expired
  $tokenData = $db->fetchOne(
    "SELECT * FROM password_reset_tokens 
      WHERE token = ? AND user_id = ? AND expires_at > NOW()",
    [$token, $userId]
  );

  if (!$tokenData) {
    echo json_encode(['success' => false, 'error' => 'Invalid or expired token']);
    exit;
  }

  // Hash the new password
  $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);

  // Update the user's password
  $result = $db->query(
    "UPDATE users SET password_hash = ? WHERE user_id = ?",
    [$passwordHash, $userId]
  );

  if ($result->rowCount() === 0) {
    throw new Exception('Failed to update password');
  }

  // Delete the token to prevent reuse
  $db->query(
    "DELETE FROM password_reset_tokens WHERE token = ?",
    [$token]
  );

  // Commit transaction
  $db->getConnection()->commit();

  // Return success
  echo json_encode(['success' => true]);
} catch (Exception $e) {
  // Rollback transaction on error
  if ($db->getConnection()->inTransaction()) {
    $db->getConnection()->rollBack();
  }

  error_log('Error in password reset confirmation: ' . $e->getMessage());
  echo json_encode(['success' => false, 'error' => 'An unexpected error occurred. Please try again later.']);
}
