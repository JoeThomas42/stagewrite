<?php
/**
 * Site header template
 * @package StageWrite
 */
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <title>StageWrite - <?= htmlspecialchars($current_page) ?></title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <script>
        // Immediately apply theme from localStorage
        (function() {
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                document.documentElement.setAttribute('data-theme', savedTheme);
            } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
            }
        })();
    </script>
    <link rel="stylesheet" href="<?= CSS_PATH ?>/main.css">
    <script src="<?= JS_PATH ?>/main.js" defer></script>
    <script src="https://kit.fontawesome.com/6a66a6b74c.js" crossorigin="anonymous"></script>
</head>

<body>
    <header class="header-container">
        <div id="header-content">
            <a href="<?= WEB_ROOT ?>/index.php" class="logo-link">
                <div class="logo-container">
                    <h1>StageWrite</h1>
                </div>
            </a>

            <!-- Mobile menu toggle button -->
            <button class="mobile-menu-toggle" aria-label="Toggle navigation menu">
                <span></span><span></span><span></span>
            </button>

            <!-- Navigation menu -->
            <div id="nav-container">
                <?php if (isset($_SESSION['user_id'])): ?>
                    <!-- Navigation for logged-in users -->
                    <nav id="main-nav">
                        <ul>
                            <li>
                                <a href="<?= WEB_ROOT ?>/index.php" class="<?= $current_page === 'Home' ? 'current-page' : '' ?>">
                                    Home
                                </a>
                            </li>
                            <li>
                                <a href="<?= WEB_ROOT ?>/profile.php" class="<?= $current_page === 'Profile' ? 'current-page' : '' ?>">
                                    Profile
                                </a>
                            </li>
                            <?php if ($_SESSION['role_id'] == 2 || $_SESSION['role_id'] == 3): ?>
                                <li>
                                    <a href="<?= WEB_ROOT ?>/data_management.php" class="<?= $current_page === 'Data Management' ? 'current-page' : '' ?>">
                                        Data Management
                                    </a>
                                </li>
                            <?php endif; ?>
                        </ul>
                    </nav>
                    
                    <div class="user-controls">
                        <span class="welcome-message">
                            <?php 
                            if ($_SESSION['role_id'] == 2) {
                                echo 'Hello, Admin ';
                            } elseif ($_SESSION['role_id'] == 3) {
                                echo 'Hello, Super Admin ';
                            } else {
                                echo 'Welcome, ';
                            }
                            echo htmlspecialchars($_SESSION['first_name']);
                            echo ($_SESSION['role_id'] >= 2) ? '!' : '';
                            ?>
                        </span>
                        <a class="log-link" href="<?= HANDLERS_URL ?>/logout_handler.php">Logout</a>
                        <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark mode"><i class="fas fa-moon"></i></button>
                    </div>
                <?php elseif ($current_page !== "Login"): ?>
                    <!-- Navigation for non-logged-in users -->
                    <div class="user-controls">
                      <a class="log-link" href="<?= WEB_ROOT ?>/login.php">Login</a>
                      <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark mode"><i class="fas fa-moon"></i></button>
                    </div>
                <?php endif; ?>
            </div>
        </div>
    </header>

    <div id="page-wrapper">
