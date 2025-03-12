<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Use User class for logout
$userObj = new User();
$userObj->logout();

// Redirect to the homepage
header('Location: /');
exit;
