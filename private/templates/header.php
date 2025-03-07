<?php

echo "<!DOCTYPE html>";
echo "<html>";
echo "<head>";
echo "<title>StageWrite - " . htmlspecialchars($current_page) . "</title>";
echo "<link rel='stylesheet' href='" . CSS_PATH . "/styles.css'>";
echo "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
echo "<script src='" . JS_PATH . "/scripts.js' defer></script>";
echo "</head>";
echo "<body>";
echo "<div class='page-wrapper'>";

// Check if the user is logged in and display the greeting and logout link
if (isset($_SESSION['user_id'])) {
    echo "<div class='header-container'>";
    echo "<h1 class='welcome-message'>Welcome, " . htmlspecialchars($_SESSION['first_name']) . "!</h1>";
    echo "<a class='logout-link' href='/logout.php'>Logout</a>";
    echo "</div>";
}
