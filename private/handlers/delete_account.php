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
  echo json_encode(['success' => false, 'error' => 'You must be logged in to delete your account']);
  exit;
}

// Get JSON data
$jsonData = file_get_contents('php://input');
$data = json_decode($jsonData, true);

// Validate input
if (!isset($data['password']) || empty($data['password'])) {
  echo json_encode(['success' => false, 'error' => 'Password is required']);
  exit;
}

$userId = $_SESSION['user_id'];
$password = $data['password'];

// Database connection
$db = Database::getInstance();

try {
  // Start transaction to ensure all or nothing is committed
  $db->getConnection()->beginTransaction();

  // Verify password
  $user = $db->fetchOne(
    "SELECT password_hash FROM users WHERE user_id = ?",
    [$userId]
  );

  if (!$user || !password_verify($password, $user['password_hash'])) {
    echo json_encode(['success' => false, 'error' => 'Incorrect password']);
    exit;
  }

  // First delete related data
  // 1. Delete user favorites
  $db->query("DELETE FROM user_favorites WHERE user_id = ?", [$userId]);
  
  // 2. Delete user tokens (remember me tokens)
  $db->query("DELETE FROM user_tokens WHERE user_id = ?", [$userId]);
  
  // 3. Delete password reset tokens
  $db->query("DELETE FROM password_reset_tokens WHERE user_id = ?", [$userId]);
  
  // 4. Delete user venues
  $db->query("DELETE FROM user_venues WHERE user_id = ?", [$userId]);
  
  // 5. Delete placed elements for user's plots
  $db->query(
    "DELETE FROM placed_elements WHERE plot_id IN (
      SELECT plot_id FROM saved_plots WHERE user_id = ?
    )",
    [$userId]
  );
  
  // 6. Delete plot inputs for user's plots
  $db->query(
    "DELETE FROM plot_inputs WHERE plot_id IN (
      SELECT plot_id FROM saved_plots WHERE user_id = ?
    )",
    [$userId]
  );
  
  // 7. Delete saved plots
  $db->query("DELETE FROM saved_plots WHERE user_id = ?", [$userId]);
  
  // 8. Finally delete the user
  $result = $db->query("DELETE FROM users WHERE user_id = ?", [$userId]);

  if ($result->rowCount() === 0) {
    throw new Exception('Failed to delete user account');
  }

  // Commit all changes
  $db->getConnection()->commit();

  // Clear session
  session_destroy();
  
  // Return success
  echo json_encode(['success' => true]);
  
} catch (Exception $e) {
  // Rollback on error
  if ($db->getConnection()->inTransaction()) {
    $db->getConnection()->rollBack();
  }
  
  error_log('Error deleting account: ' . $e->getMessage());
  echo json_encode(['success' => false, 'error' => 'An unexpected error occurred. Please try again later.']);
}
