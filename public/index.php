<?php
require_once '../private/bootstrap.php';

// Check if user is already logged in
if (isset($_SESSION['user_id'])) {
    header('Location: profile.php');
    exit;
}

// Include the login template
require_once PRIVATE_PATH . '/templates/login.php';
