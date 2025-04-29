<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  $errors = [];

  $inputs = array_map('trim', $_POST);

  $required_fields = ['first_name', 'last_name', 'email', 'password', 'confirm_password'];
  foreach ($required_fields as $field) {
    if (empty($inputs[$field])) {
      $errors[$field] = 'This field is required.';
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
    $errors['recaptcha'] = 'Please complete the reCAPTCHA.';
    $errors['message'] = 'reCAPTCHA verification failed. Please try again.';
  }

  if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    $errors['email'] = 'Please enter a valid email address.';
  }

  if (strlen($password) < 8) {
    $errors['password'] = 'Must be at least 8 characters long.';
  } else if (!preg_match('/[0-9]/', $password)) {
    $errors['password'] = 'Must contain at least one number.';
  } else {
    $allowedChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+-=[]{};:\'",./<>?|`~';
    for ($i = 0; $i < strlen($password); $i++) {
      $char = $password[$i];
      if (strpos($allowedChars, $char) === false) {
        $errors['password'] = $char . ' cannot be used.';
        break;
      }
    }
  }

  if ($password !== $confirmPassword) {
    $errors['confirm_password'] = 'Passwords do not match.';
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
        $errors['email'] = 'This email is already registered.';
      } else {
        $errors['general'] = 'An error occurred while creating your account. Please try again later.';
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
