<?php

echo "<!DOCTYPE html>";
echo "<html lang='en'>";
echo "<head>";
echo "<title>StageWrite - " . htmlspecialchars($current_page) . "</title>";
echo "<link rel='stylesheet' href='" . CSS_PATH . "/styles.css'>";
echo "<meta name='viewport' content='width=device-width, initial-scale=1.0'>";
echo "<script src='" . JS_PATH . "/scripts.js' defer></script>";
echo "</head>";

echo "<body>";
echo "<header class='header-container'>";
echo "<div class='header-content'>";
echo "<div class='logo-container'>";
echo "<h1>StageWrite</h1>";
echo "</div>";

// Mobile menu toggle button
echo "<button class='mobile-menu-toggle' aria-label='Toggle navigation menu'>";
echo "<span></span><span></span><span></span>";
echo "</button>";

// Navigation menu
echo "<div class='nav-container' id='nav-container'>";

if (isset($_SESSION['user_id'])) {
    // Show navigation options for logged-in users
    echo "<nav class='main-nav'>";
    echo "<ul>";
    echo "<li><a href='" . WEB_ROOT . "/index.php' class='" . ($current_page === "Home" ? "current-page" : "") . "'>Home</a></li>";
    
    // Change Profile to Data Management for admins/super admins
    if ($_SESSION['role_id'] == 2 || $_SESSION['role_id'] == 3) {
        echo "<li><a href='" . WEB_ROOT . "/profile.php' class='" . ($current_page === "Data Management" ? "current-page" : "") . "'>Data Management</a></li>";
    } else {
        echo "<li><a href='" . WEB_ROOT . "/profile.php' class='" . ($current_page === "Profile" ? "current-page" : "") . "'>Profile</a></li>";
    }
    echo "</ul>";
    echo "</nav>";
    
    echo "<div class='user-controls'>";
    // Customize greeting based on role
    if ($_SESSION['role_id'] == 2) {
        echo "<span class='welcome-message'>Hello, Admin " . htmlspecialchars($_SESSION['first_name']) . "!</span>";
    } else if ($_SESSION['role_id'] == 3) {
        echo "<span class='welcome-message'>Hello, Super Admin " . htmlspecialchars($_SESSION['first_name']) . "!</span>";
    } else {
        echo "<span class='welcome-message'>Welcome, " . htmlspecialchars($_SESSION['first_name']) . "!</span>";
    }
    echo "<a class='log-link' href='" . HANDLERS_URL . "/logout_handler.php'>Logout</a>";
    echo "</div>";
} else if ($current_page !== "Login") {
    // Show login button for non-logged in users
    echo "<div class='user-controls'>";
    echo "<a class='log-link' href='" . WEB_ROOT . "/login.php'>Login</a>";
    echo "</div>";
}

echo "</div>"; // Close nav-container
echo "</div>"; // Close header-content
echo "</header>"; // Close header-container

// Start page-wrapper
echo "<div class='page-wrapper'>";
