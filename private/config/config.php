<?php

// Local Database configuration
$db_host = 'localhost';
$db_name = 'jrtdesig_stagewrite';
$db_user = 'root';
$db_password = '';

// Website Database configuration
// $db_host = 'localhost';
// $db_name = 'jrtdesig_stagewrite';
// $db_user = 'jrtdesig_admin_daddy';
// $db_password = '$u=C=;-u6tAvM=6';

// Other configuration constants
define('DB_HOST', $db_host);
define('DB_NAME', $db_name);
define('DB_USER', $db_user);
define('DB_PASS', $db_password);
define('DB_CHARSET', 'utf8mb4');

// try {
//     $pdo = new PDO("mysql:host=$db_host;dbname=$db_name", $db_user, $db_password);
//     echo "Database connection successful!";
// } catch (PDOException $e) {
//     echo "Database connection failed: " . $e->getMessage();
// }
?>
