<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Always return JSON
header('Content-Type: application/json');

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    echo json_encode(['error' => 'database_error', 'message' => 'Database connection failed']);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $errors = [];
    
    // Trim all inputs first
    $inputs = array_map('trim', $_POST);
    
    // Validate required fields
    $required_fields = ['first_name', 'last_name', 'email', 'password', 'confirm_password'];
    foreach ($required_fields as $field) {
        if (empty($inputs[$field])) {
            $errors[$field] = 'required';
        }
    }
    
    // Use trimmed values
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

    if (!empty($errors)) {
        echo json_encode(['errors' => $errors]);
        exit;
    }

    if ($password !== $confirmPassword) {
        echo json_encode(['errors' => ['confirm_password' => 'mismatch']]);
        exit;
    }

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
        echo json_encode(['success' => true]);
    } else {
        // Check if the failure was due to existing email
        $db = Database::getInstance();
        $emailExists = $db->fetchOne(
            "SELECT email FROM users WHERE email = ?", 
            [$email]
        );
        
        if ($emailExists) {
            echo json_encode(['errors' => ['email' => 'exists']]);
        } else {
            echo json_encode(['errors' => ['general' => 'database_error']]);
        }
    }
}
