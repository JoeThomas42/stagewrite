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

// Header outside the page wrapper for full width
echo "<header class='header-container'>";
echo "<div class='header-content'>";
echo "<h1>StageWrite</h1>";

// Navigation menu
echo "<div class='nav-container'>";

if (isset($_SESSION['user_id'])) {
    // Show navigation options for logged-in users
    echo "<nav class='main-nav'>";
    echo "<ul>";
    echo "<li><a href='" . WEB_ROOT . "/index.php' class='" . ($current_page === "Home" ? "current-page" : "") . "'>Home</a></li>";
    echo "<li><a href='" . WEB_ROOT . "/profile.php' class='" . ($current_page === "Profile" ? "current-page" : "") . "'>Profile</a></li>";
    echo "</ul>";
    echo "</nav>";
    
    echo "<div class='user-controls'>";
    echo "<span class='welcome-message'>Welcome, " . htmlspecialchars($_SESSION['first_name']) . "!</span>";
    echo "<a class='log-link' href='/logout.php'>Logout</a>";
    echo "</div>";
} else if ($current_page !== "Login") {
    // Show login button for non-logged in users, but only if not already on login page
    echo "<div class='user-controls'>";
    echo "<a class='log-link' href='" . WEB_ROOT . "/login.php'>Login</a>";
    echo "</div>";
}

echo "</div>"; // Close nav-container
echo "</div>"; // Close header-content
echo "</header>"; // Close header-container

// Start page-wrapper after the header
echo "<div class='page-wrapper'>";
