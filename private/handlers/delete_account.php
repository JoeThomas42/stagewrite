<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'error' => 'Method not allowed']);
  exit;
}

if (!isset($_SESSION['user_id'])) {
  echo json_encode(['success' => false, 'error' => 'You must be logged in to delete your account']);
  exit;
}

$jsonData = file_get_contents('php://input');
$data = json_decode($jsonData, true);

if (!isset($data['password']) || empty($data['password'])) {
  echo json_encode(['success' => false, 'error' => 'Password is required']);
  exit;
}

$userId = $_SESSION['user_id'];
$password = $data['password'];

$db = Database::getInstance();

try {
  $db->getConnection()->beginTransaction();

  $user = $db->fetchOne(
    "SELECT password_hash FROM users WHERE user_id = ?",
    [$userId]
  );

  if (!$user || !password_verify($password, $user['password_hash'])) {
    echo json_encode(['success' => false, 'error' => 'Incorrect password']);
    exit;
  }

  $db->query("DELETE FROM user_favorites WHERE user_id = ?", [$userId]);

  $db->query("DELETE FROM user_tokens WHERE user_id = ?", [$userId]);

  $db->query("DELETE FROM password_reset_tokens WHERE user_id = ?", [$userId]);

  $db->query("DELETE FROM user_venues WHERE user_id = ?", [$userId]);

  $db->query(
    "DELETE FROM placed_elements WHERE plot_id IN (
      SELECT plot_id FROM saved_plots WHERE user_id = ?
    )",
    [$userId]
  );

  $db->query(
    "DELETE FROM plot_inputs WHERE plot_id IN (
      SELECT plot_id FROM saved_plots WHERE user_id = ?
    )",
    [$userId]
  );

  $db->query("DELETE FROM saved_plots WHERE user_id = ?", [$userId]);

  $result = $db->query("DELETE FROM users WHERE user_id = ?", [$userId]);

  if ($result->rowCount() === 0) {
    throw new Exception('Failed to delete user account');
  }

  $db->getConnection()->commit();

  session_destroy();

  echo json_encode(['success' => true]);
} catch (Exception $e) {
  if ($db->getConnection()->inTransaction()) {
    $db->getConnection()->rollBack();
  }

  error_log('Error deleting account: ' . $e->getMessage());
  echo json_encode(['success' => false, 'error' => 'An unexpected error occurred. Please try again later.']);
}
