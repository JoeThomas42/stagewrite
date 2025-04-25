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
    // You can get specific errors using $resp->getErrorCodes() if needed
    echo json_encode(['errors' => ['recaptcha' => 'invalid', 'message' => 'reCAPTCHA verification failed. Please try again.']]);
    exit;
  }
  // *** END reCAPTCHA Verification ***

  // Trim all inputs first
  $inputs = array_map('trim', $_POST);

  // Validate required fields
  $required_fields = ['first_name', 'last_name', 'email', 'password', 'confirm_password'];
  foreach ($required_fields as $field) {
    if (empty($inputs[$field])) {
      $errors[$field] = 'required';
    }
  }

  $firstName = $inputs['first_name'];
  $lastName = $inputs['last_name'];
  $email = $inputs['email'];
  $password = $inputs['password'];
  $confirmPassword = $inputs['confirm_password'];
  $roleId = 1; // Default role ID

  // Validate email format
  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'invalid';
  }

  // Password validation
  if (strlen($password) < 8) {
    $errors['password'] = 'too_short';
  } else if (!preg_match('/[0-9]/', $password)) {
    $errors['password'] = 'no_number';
  } else {
    // Check for invalid characters
    $allowedChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{};:\'",./<>?|`~';
    for ($i = 0; $i < strlen($password); $i++) {
      $char = $password[$i];
      if (strpos($allowedChars, $char) === false) {
        $errors['password'] = 'invalid_char:' . $char;
        break;
      }
    }
  }

  if ($password !== $confirmPassword) {
    $errors['confirm_password'] = 'mismatch';
  }

  // If validation passes (including reCAPTCHA check above), proceed with registration
  if (empty($errors)) {
    // Use User class for registration
    $userObj = new User();

    // Create user data array
    $userData = [
      'first_name' => $firstName,
      'last_name' => $lastName,
      'email' => $email,
      'password' => $password,
      'role_id' => $roleId
    ];

    $userId = $userObj->register($userData);

    if ($userId) {
      // NEW CODE: Automatically log in the user after successful registration
      $user = $userObj->login($email, $password);

      if ($user) {
        // Return the role_id along with success status
        echo json_encode([
          'success' => true,
          'role_id' => $user['role_id']
        ]);
      } else {
        // Registration successful but auto-login failed
        echo json_encode(['success' => true]);
      }
    } else {
      // Check if the failure was due to existing email
      $db = Database::getInstance(); // Get DB instance here if needed
      $emailExists = $db->fetchOne(
        "SELECT email FROM users WHERE email = ?",
        [$email]
      );

      if ($emailExists) {
        $errors['email'] = 'exists';
      } else {
        $errors['general'] = 'database_error';
      }
      echo json_encode(['errors' => $errors]); // Send back errors if registration failed
    }
  } else {
    // Send back validation errors if any exist (excluding reCAPTCHA error if already handled)
    echo json_encode(['errors' => $errors]);
  }
} else {
  // Handle non-POST requests if necessary
  http_response_code(405); // Method Not Allowed
  echo json_encode(['error' => 'Invalid request method']);
}
