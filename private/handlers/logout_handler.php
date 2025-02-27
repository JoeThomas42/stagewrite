<?php
require_once '../../private/bootstrap.php';

session_start();
session_destroy();
header('Location: ../index.php');
exit;
