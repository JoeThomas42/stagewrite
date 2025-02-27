<?php
require_once '../../private/bootstrap.php';

// This file handles the signup directly
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $firstName = $_POST['first_name'];
    $lastName = $_POST['last_name'];
    $email = $_POST['email'];
    $password = $_POST['password'];
    $confirmPassword = $_POST['confirm_password'];
    $roleId = 1; // Default role ID

    if ($password !== $confirmPassword) {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'passwords_mismatch']);
        exit;
    }

    $stmt = $pdo->prepare("SELECT email FROM users WHERE email = :email");
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        // Return JSON response
        header('Content-Type: application/json');
        echo json_encode(['error' => 'email_exists']);
        exit;
    }

    $passwordHash = password_hash($password, PASSWORD_BCRYPT);
    $stmt = $pdo->prepare(
        "INSERT INTO users (user_id, first_name, last_name, email, password_hash, role_id, created_at, is_active) 
         VALUES (UUID(), :first_name, :last_name, :email, :password_hash, :role_id, NOW(), 1)"
    );
    $stmt->bindParam(':first_name', $firstName);
    $stmt->bindParam(':last_name', $lastName);
    $stmt->bindParam(':email', $email);
    $stmt->bindParam(':password_hash', $passwordHash);
    $stmt->bindParam(':role_id', $roleId);

    if ($stmt->execute()) {
        // Get the newly created user
        $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email");
        $stmt->bindParam(':email', $email);
        $stmt->execute();
        $user = $stmt->fetch(PDO::FETCH_ASSOC);
        
        // Set session variables
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['first_name'] = $user['first_name'];
        $_SESSION['last_name'] = $user['last_name'];
        $_SESSION['role_id'] = $user['role_id'];
        
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'redirect' => '/profile.php']);
    } else {
        header('Content-Type: application/json');
        echo json_encode(['error' => 'database_error']);
    }
    exit;
}
