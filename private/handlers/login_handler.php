<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Always return JSON
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $errors = [];
    
    // Trim email
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    
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

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email AND is_active = 1");
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['first_name'] = $user['first_name'];
        $_SESSION['last_name'] = $user['last_name'];
        $_SESSION['role_id'] = $user['role_id'];
        
        echo json_encode([
            'success' => true,
            'role_id' => $user['role_id']
        ]);
        exit;
    } else {
        // Invalid email or password
        $errors['email'] = 'invalid_credentials';
        echo json_encode(['errors' => $errors]);
        exit;
    }
}
