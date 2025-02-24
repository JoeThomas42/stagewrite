<?php
// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Include external configuration
require_once 'config.php';

try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $firstName = $_POST['first_name'];
    $lastName = $_POST['last_name'];
    $email = $_POST['email'];
    $password = $_POST['password'];
    $confirmPassword = $_POST['confirm_password'];
    $roleId = 1; // Default role ID

    if ($password !== $confirmPassword) {
        echo "Passwords do not match.";
        exit;
    }

    $stmt = $pdo->prepare("SELECT email FROM users WHERE email = :email");
    $stmt->bindParam(':email', $email);
    $stmt->execute();

    if ($stmt->rowCount() > 0) {
        // Return JSON response instead of plain text
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
        header('Location: /stagewrite/php/profile.php');
    } else {
        echo "An error occurred. Please try again.";
    }
}
?>

