<?php
require_once '../private/bootstrap.php';

// If already logged in, redirect to profile
if (isset($_SESSION['user_id'])) {
  header('Location: profile.php');
  exit;
}

// Include the login template
include PRIVATE_PATH . '/templates/login.php';
