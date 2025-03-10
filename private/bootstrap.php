<?php

// Enable error reporting for debugging
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

// Define base paths
define('BASE_PATH', dirname(__DIR__));
define('PRIVATE_PATH', BASE_PATH . '/private');
define('PUBLIC_PATH', BASE_PATH . '/public');
define('HANDLERS_PATH', PRIVATE_PATH . '/handlers');
define('INCLUDES_PATH', PRIVATE_PATH . '/includes');

// Define web root paths for URLs
define('WEB_ROOT', '');
define('CSS_PATH', WEB_ROOT . '/css');
define('JS_PATH', WEB_ROOT . '/public/js');
define('IMG_PATH', WEB_ROOT . '/public/images');
define('HANDLERS_URL', WEB_ROOT . '/handlers');

// Include necessary files
require_once PRIVATE_PATH . '/config/config.php';
require_once INCLUDES_PATH . '/functions.php';

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
