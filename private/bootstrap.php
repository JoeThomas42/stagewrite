<?php
// Define base paths
define('BASE_PATH', dirname(__DIR__));
define('PRIVATE_PATH', BASE_PATH . '/private');
define('PUBLIC_PATH', BASE_PATH . '/public');
define('HANDLERS_PATH', PRIVATE_PATH . '/handlers');

// Define web root paths for URLs
define('WEB_ROOT', '');
define('CSS_PATH', WEB_ROOT . '/css');
define('JS_PATH', WEB_ROOT . '/js');
define('HANDLERS_URL', WEB_ROOT . '/handlers');

// Include necessary files
require_once PRIVATE_PATH . '/config/config.php';

// Create a database connection
try {
    $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch (PDOException $e) {
    die("Database connection failed: " . $e->getMessage());
}

// Include additional files after DB connection
require_once PRIVATE_PATH . '/includes/functions.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
