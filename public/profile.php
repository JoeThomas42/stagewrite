<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Check if user is logged in

if (!isset($_SESSION['user_id'])) {
    header('Location: /');
    exit;
}

// Get user information from session
$user_id = $_SESSION['user_id'];
$user = [
    'user_id'     => $user_id,
    'first_name'  => $_SESSION['first_name'],
    'last_name'   => $_SESSION['last_name'],
    'role_id'     => $_SESSION['role_id']
];

// Include the profile template
include PRIVATE_PATH . '/templates/profile.php';
