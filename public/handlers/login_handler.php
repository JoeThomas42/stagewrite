<?php
require_once '../../private/bootstrap.php';

// This file forwards the request to the actual handler
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'];
    $password = $_POST['password'];

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = :email AND is_active = 1");
    $stmt->bindParam(':email', $email);
    $stmt->execute();
    $user = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($user && password_verify($password, $user['password_hash'])) {
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['first_name'] = $user['first_name'];
        $_SESSION['last_name'] = $user['last_name'];
        $_SESSION['role_id'] = $user['role_id'];
        
        header('Location: /profile.php');
        exit;
    } else {
        echo "Invalid email or password.";
    }
}

require_once PRIVATE_PATH . '/handlers/login_handler.php';
