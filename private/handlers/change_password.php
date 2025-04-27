<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'error' => 'Method not allowed']);
  exit;
}

if (!isset($_SESSION['user_id'])) {
  echo json_encode(['success' => false, 'error' => 'You must be logged in to change your password']);
  exit;
}

$jsonData = file_get_contents('php://input');
$data = json_decode($jsonData, true);

if (!isset($data['current_password']) || !isset($data['new_password'])) {
  echo json_encode(['success' => false, 'error' => 'Missing required fields']);
  exit;
}

$userId = $_SESSION['user_id'];
$currentPassword = $data['current_password'];
$newPassword = $data['new_password'];

if (strlen($newPassword) < 8) {
  echo json_encode(['success' => false, 'error' => 'New password must be at least 8 characters']);
  exit;
}

if (!preg_match('/[0-9]/', $newPassword)) {
  echo json_encode(['success' => false, 'error' => 'New password must include at least one number']);
  exit;
}

$db = Database::getInstance();

try {
  $user = $db->fetchOne(
    "SELECT password_hash FROM users WHERE user_id = ?",
    [$userId]
  );

  if (!$user || !password_verify($currentPassword, $user['password_hash'])) {
    echo json_encode(['success' => false, 'error' => 'Current password is incorrect']);
    exit;
  }

  $passwordHash = password_hash($newPassword, PASSWORD_BCRYPT);

  $result = $db->query(
    "UPDATE users SET password_hash = ? WHERE user_id = ?",
    [$passwordHash, $userId]
  );

  if ($result->rowCount() === 0) {
    throw new Exception('Failed to update password');
  }

  echo json_encode(['success' => true]);
} catch (Exception $e) {
  error_log('Error in password change: ' . $e->getMessage());
  echo json_encode(['success' => false, 'error' => 'An unexpected error occurred. Please try again later.']);
}
