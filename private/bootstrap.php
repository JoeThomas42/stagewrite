<?php
/**
 * Application initialization
 * @package StageWrite
 */

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
define('TEMPLATES_PATH', PRIVATE_PATH . '/templates');
define('VENDOR_PATH', BASE_PATH . '/vendor');

// Define web root paths for URLs
define('WEB_ROOT', '');
define('CSS_PATH', WEB_ROOT . '/css');
define('JS_PATH', WEB_ROOT . '/js');
define('IMG_PATH', WEB_ROOT . '/images');
define('HANDLERS_URL', WEB_ROOT . '/handlers');

// Include configuration
require_once PRIVATE_PATH . '/config/config.php';

// Define development environment
if (!defined('DEV_ENVIRONMENT')) {
    define('DEV_ENVIRONMENT', false);
}

// Include utility functions
require_once INCLUDES_PATH . '/functions.php';

// Include database class
require_once INCLUDES_PATH . '/Database.php';

// Include User class
require_once INCLUDES_PATH . '/User.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set up error handling
function customErrorHandler($errno, $errstr, $errfile, $errline) {
    $message = "Error [$errno] $errstr - $errfile:$errline";
    error_log($message);
    
    // Only show errors in development environment
    if (defined('DEV_ENVIRONMENT') && DEV_ENVIRONMENT === true) {
        echo "<p class='error-message'>$message</p>";
    }
    return true;
}

// Register error handler
set_error_handler("customErrorHandler");
