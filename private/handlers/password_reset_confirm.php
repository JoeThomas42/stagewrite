<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'error' => 'Method not allowed']);
  exit;
}

$jsonData = file_get_contents('php://input');
$data = json_decode($jsonData, true);

if (!isset($data['token']) || !isset($data['user_id']) || !isset($data['new_password'])) {
  echo json_encode(['success' => false, 'error' => 'Missing required fields']);
  exit;
}

$token = trim($data['token']);
$userId = trim($data['user_id']);
$newPassword = $data['new_password'];

if (strlen($newPassword) < 8) {
  echo json_encode(['success' => false, 'error' => 'Password must be at least 8 characters']);
  exit;
}

if (!preg_match('/[0-9]/', $newPassword)) {
  echo json_encode(['success' => false, 'error' => 'Password must include at least one number']);
  exit;
}

$db = Database::getInstance();

try {
  $db->getConnection()->beginTransaction();

  $tokenData = $db->fetchOne(
    "SELECT * FROM password_reset_tokens
      WHERE token = ? AND user_id = ? AND expires_at > NOW()",
    [$token, $userId]
  );

  if (!$tokenData) {
    echo json_encode(['success' => false, 'error' => 'Invalid or expired token']);
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

  $db->query(
    "DELETE FROM password_reset_tokens WHERE token = ?",
    [$token]
  );

  $db->getConnection()->commit();

  echo json_encode(['success' => true]);
} catch (Exception $e) {
  if ($db->getConnection()->inTransaction()) {
    $db->getConnection()->rollBack();
  }

  error_log('Error in password reset confirmation: ' . $e->getMessage());
  echo json_encode(['success' => false, 'error' => 'An unexpected error occurred. Please try again later.']);
}
