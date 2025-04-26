<?php
// Simple diagnostic script to test PHP configuration
// Place this in your public folder and access it through the browser

// Ensure content is sent as plain text
header('Content-Type: text/plain');

// Basic PHP info
echo "PHP DIAGNOSTIC REPORT\n";
echo "===================\n\n";

echo "PHP Version: " . phpversion() . "\n";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "\n";
echo "Document Root: " . $_SERVER['DOCUMENT_ROOT'] . "\n\n";

// Test Bootstrap include
echo "BOOTSTRAP INCLUDE TEST\n";
echo "=====================\n";
try {
    require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';
    echo "Bootstrap loaded successfully\n\n";
} catch (Throwable $e) {
    echo "Error loading bootstrap: " . $e->getMessage() . "\n\n";
}

// Test Database connection
echo "DATABASE CONNECTION TEST\n";
echo "======================\n";
try {
    if (class_exists('Database')) {
        $db = Database::getInstance();
        echo "Database class found and instantiated\n";
        
        $conn = $db->getConnection();
        echo "Database connection successful\n\n";
    } else {
        echo "Database class not found\n\n";
    }
} catch (Throwable $e) {
    echo "Database error: " . $e->getMessage() . "\n\n";
}

// Test User class
echo "USER CLASS TEST\n";
echo "==============\n";
try {
    if (class_exists('User')) {
        $user = new User();
        echo "User class found and instantiated\n";
        echo "isLoggedIn() returns: " . ($user->isLoggedIn() ? 'true' : 'false') . "\n\n";
    } else {
        echo "User class not found\n\n";
    }
} catch (Throwable $e) {
    echo "User class error: " . $e->getMessage() . "\n\n";
}

// Test session
echo "SESSION TEST\n";
echo "===========\n";
echo "Session status: ";
switch (session_status()) {
    case PHP_SESSION_DISABLED:
        echo "Sessions are disabled\n";
        break;
    case PHP_SESSION_NONE:
        echo "Sessions are enabled but no session is active\n";
        break;
    case PHP_SESSION_ACTIVE:
        echo "Session is active\n";
        break;
}
echo "Session variables: " . print_r($_SESSION, true) . "\n\n";

// Test error reporting
echo "ERROR REPORTING TEST\n";
echo "==================\n";
echo "display_errors: " . ini_get('display_errors') . "\n";
echo "error_reporting: " . ini_get('error_reporting') . "\n";
echo "log_errors: " . ini_get('log_errors') . "\n";
echo "error_log path: " . ini_get('error_log') . "\n\n";

// Test file permissions
echo "FILE PERMISSIONS TEST\n";
echo "===================\n";
$loginHandlerPath = $_SERVER['DOCUMENT_ROOT'] . '/private/handlers/login_handler.php';
echo "Login handler path: $loginHandlerPath\n";
echo "File exists: " . (file_exists($loginHandlerPath) ? 'Yes' : 'No') . "\n";
if (file_exists($loginHandlerPath)) {
    echo "File permissions: " . substr(sprintf('%o', fileperms($loginHandlerPath)), -4) . "\n";
    echo "File owner: " . fileowner($loginHandlerPath) . "\n";
    echo "File group: " . filegroup($loginHandlerPath) . "\n";
    echo "Is readable: " . (is_readable($loginHandlerPath) ? 'Yes' : 'No') . "\n";
}

echo "\nDiagnostic complete. Please review for any issues.";
