<?php
ini_set('display_errors', 0);
error_reporting(0);

ob_start();

function debug_log($message)
{
  error_log("[Login Debug] " . $message);
}

try {
  require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

  header('Content-Type: application/json');

  if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['errors' => ['general' => 'Method not allowed']]);
    exit;
  }

  $email = isset($_POST['email']) ? trim($_POST['email']) : '';
  $password = isset($_POST['password']) ? $_POST['password'] : '';

  $stayLoggedIn = false;
  if (isset($_POST['stay_logged_in'])) {
    if ($_POST['stay_logged_in'] === '1' || $_POST['stay_logged_in'] === 'on' || $_POST['stay_logged_in'] === 'true') {
      $stayLoggedIn = true;
      debug_log("Stay logged in requested for: $email");
    }
  }

  $errors = [];
  if (empty($email)) $errors['email'] = 'required';
  if (empty($password)) $errors['password'] = 'required';

  if (!empty($errors)) {
    echo json_encode(['errors' => $errors]);
    exit;
  }

  debug_log("Login attempt for: $email, Stay logged in: " . ($stayLoggedIn ? 'Yes' : 'No'));

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(['errors' => ['email' => 'invalid']]);
    exit;
  }

  $userObj = new User();
  $user = $userObj->login($email, $password, $stayLoggedIn);

  if ($user) {
    debug_log("Login successful for: $email");
    echo json_encode([
      'success' => true,
      'role_id' => $user['role_id']
    ]);
  } else {
    debug_log("Login failed for: $email");
    echo json_encode(['errors' => ['email' => 'invalid_credentials']]);
  }
} catch (Exception $e) {
  debug_log("Login exception: " . $e->getMessage());

  ob_clean();

  header('Content-Type: application/json');
  echo json_encode(['errors' => ['general' => 'Server error']]);
}

if (ob_get_length()) {
  ob_end_flush();
} else {
  header('Content-Type: application/json');
  echo json_encode(['errors' => ['general' => 'Unknown error']]);
}
