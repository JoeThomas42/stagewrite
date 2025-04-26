<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';
require_once VENDOR_PATH . '/autoload.php'; // Ensure Composer autoload is included

// Always return JSON
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $errors = [];

  // *** START reCAPTCHA Verification ***
  $recaptchaSecret = RECAPTCHA_SECRET_KEY; // Get secret key from config
  $recaptcha = new \ReCaptcha\ReCaptcha($recaptchaSecret);
  $recaptchaResponse = $_POST['g-recaptcha-response'] ?? null;
  $remoteIp = $_SERVER['REMOTE_ADDR'];

  // Verify the reCAPTCHA response
  $resp = $recaptcha->setExpectedHostname($_SERVER['SERVER_NAME']) // Optional: verify hostname
    ->verify($recaptchaResponse, $remoteIp);

  if (!$resp->isSuccess()) {
    // reCAPTCHA verification failed
    echo json_encode(['errors' => ['recaptcha' => 'invalid', 'message' => 'reCAPTCHA verification failed. Please try again.']]);
    exit;
  }
  // *** END reCAPTCHA Verification ***

  // Trim email
  $email = isset($_POST['email']) ? trim($_POST['email']) : '';
  $password = isset($_POST['password']) ? $_POST['password'] : '';

  // Get the stay logged in preference
  $stayLoggedIn = isset($_POST['stay_logged_in']) && ($_POST['stay_logged_in'] == '1' || $_POST['stay_logged_in'] === 'on');

  // Validate required fields
  if (empty($email)) {
    $errors['email'] = 'required';
  }
  if (empty($password)) {
    $errors['password'] = 'required';
  }

  if (!empty($errors)) {
    echo json_encode(['errors' => $errors]);
    exit;
  }

  // Validate email format
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'invalid';
    echo json_encode(['errors' => $errors]);
    exit;
  }

  // Use User class for authentication
  $userObj = new User();
  $user = $userObj->login($email, $password, $stayLoggedIn);

  if ($user) {
    // User class automatically sets session variables
    echo json_encode([
      'success' => true,
      'role_id' => $user['role_id']
    ]);
  } else {
    // Invalid email or password
    $errors['email'] = 'invalid_credentials';
    echo json_encode(['errors' => $errors]);
  }
}
