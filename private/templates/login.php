<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// If already logged in, redirect to index
if (isset($_SESSION['user_id'])) {
  header('Location: /index.php');
  exit;
}

// Redirect to index page (modal will be available there)
header('Location: /index.php');
exit;
