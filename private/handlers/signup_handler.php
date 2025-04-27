<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $errors = [];

  $inputs = array_map('trim', $_POST);

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
  $roleId = 1;

  $recaptchaResponse = $_POST['g-recaptcha-response'] ?? null;
  if (empty($recaptchaResponse)) {
    $errors['recaptcha'] = 'invalid';
    $errors['message'] = 'reCAPTCHA verification failed. Please try again.';
  }

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'invalid';
  }

  if (strlen($password) < 8) {
    $errors['password'] = 'too_short';
  } else if (!preg_match('/[0-9]/', $password)) {
    $errors['password'] = 'no_number';
  } else {
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

  if (empty($errors)) {
    $userObj = new User();

    $userData = [
      'first_name' => $firstName,
      'last_name' => $lastName,
      'email' => $email,
      'password' => $password,
      'role_id' => $roleId
    ];

    $userId = $userObj->register($userData);

    if ($userId) {
      $user = $userObj->login($email, $password);

      if ($user) {
        echo json_encode([
          'success' => true,
          'role_id' => $user['role_id']
        ]);
      } else {
        echo json_encode(['success' => true]);
      }
    } else {
      $db = Database::getInstance();
      $emailExists = $db->fetchOne(
        "SELECT email FROM users WHERE email = ?",
        [$email]
      );

      if ($emailExists) {
        $errors['email'] = 'exists';
      } else {
        $errors['general'] = 'database_error';
      }
      echo json_encode(['errors' => $errors]);
    }
  } else {
    echo json_encode(['errors' => $errors]);
  }
} else {
  http_response_code(405);
  echo json_encode(['error' => 'Invalid request method']);
}
