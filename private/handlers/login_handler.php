<?php
// Extremely simple login handler
// No whitespace before opening tag, no closing tag

// Prevent PHP errors from being displayed
ini_set('display_errors', 0);
error_reporting(0);

// Start output buffering to catch any unwanted output
ob_start();

try {
    // Load required files
    require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

    // Always set content type to JSON
    header('Content-Type: application/json');

    // Check request method
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        echo json_encode(['errors' => ['general' => 'Method not allowed']]);
        exit;
    }

    // Basic validation
    $email = isset($_POST['email']) ? trim($_POST['email']) : '';
    $password = isset($_POST['password']) ? $_POST['password'] : '';
    $stayLoggedIn = isset($_POST['stay_logged_in']) && ($_POST['stay_logged_in'] == '1' || $_POST['stay_logged_in'] === 'on');

    // Simple validation
    $errors = [];
    if (empty($email)) $errors['email'] = 'required';
    if (empty($password)) $errors['password'] = 'required';

    // Return validation errors if any
    if (!empty($errors)) {
        echo json_encode(['errors' => $errors]);
        exit;
    }

    // Log attempt (don't include password)
    error_log("Login attempt for: $email");

    // Basic email validation
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['errors' => ['email' => 'invalid']]);
        exit;
    }

    // Try to authenticate
    $userObj = new User();
    $user = $userObj->login($email, $password, $stayLoggedIn);

    if ($user) {
        // Login success
        error_log("Login successful for: $email");
        echo json_encode([
            'success' => true,
            'role_id' => $user['role_id']
        ]);
    } else {
        // Login failed
        error_log("Login failed for: $email");
        echo json_encode(['errors' => ['email' => 'invalid_credentials']]);
    }
} catch (Exception $e) {
    // Log error details for server admin
    error_log("Login exception: " . $e->getMessage());
    
    // Clean any existing output
    ob_clean();
    
    // Return a simple error response
    header('Content-Type: application/json');
    echo json_encode(['errors' => ['general' => 'Server error']]);
}

// In case we reach here, make sure content type is still set
if (ob_get_length()) {
    ob_end_flush();
} else {
    header('Content-Type: application/json');
    echo json_encode(['errors' => ['general' => 'Unknown error']]);
}
