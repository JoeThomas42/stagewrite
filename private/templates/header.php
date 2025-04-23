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
                <a href="<?= WEB_ROOT ?>/index.php" class="<?= $current_page === 'Plotter' ? 'current-page' : '' ?>">
                  Stage Plotter
                </a>
              </li>
              <li>
                <a href="<?= WEB_ROOT ?>/profile.php" class="<?= $current_page === 'Portfolio' ? 'current-page' : '' ?>">
                  Portfolio
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
            <!-- <span class="welcome-message"> -->
              <?php
              // if ($_SESSION['role_id'] == 2) {
              //   echo 'Hello, Admin ';
              // } elseif ($_SESSION['role_id'] == 3) {
              //   echo 'Hello, Super Admin ';
              // } else {
              //   echo 'Welcome, ';
              // }
              // echo htmlspecialchars($_SESSION['first_name']);
              // echo ($_SESSION['role_id'] >= 2) ? '!' : '';
              ?>
            <!-- </span> -->

            <!-- Account dropdown replacing the logout link -->
            <div class="dropdown account-dropdown">
              <button class="dropdown-toggle account-toggle" aria-label="Account options">
                <i class="fas fa-user-circle"></i>
              </button>
              <div class="dropdown-menu account-menu">
                <div class="account-greeting">
                  Hello, <?php echo htmlspecialchars($_SESSION['first_name']); ?>!
                </div>
                <a href="#" id="change-password-link">Change Password</a>
                <a href="#" id="delete-account-link">Delete Account</a>
                <a href="<?= HANDLERS_URL ?>/logout_handler.php">Logout</a>
              </div>
            </div>

            <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark mode">
              <i class="fas fa-moon"></i>
            </button>
          </div>
        <?php else: ?>
          <!-- Navigation for non-logged-in users -->
          <div class="user-controls">
            <button class="log-link" id="login-modal-btn">Login</button>
            <button id="theme-toggle" class="theme-toggle" aria-label="Toggle dark mode"><i class="fas fa-moon"></i></button>
          </div>
        <?php endif; ?>
      </div>
    </div>
  </header>

  <!-- Login Modal -->
  <div id="login-modal" class="modal hidden">
    <div class="modal-content">
      <span class="close-button">&times;</span>

      <div id="form-wrapper">
        <!-- Login Form -->
        <div id="login-form" class="form">
          <h2>Login</h2>
          <form action="/handlers/login_handler.php" method="POST">
            <div>
              <label for="email">Email:</label>
              <input type="email" id="email" name="email" required>
            </div>

            <div>
              <label for="password">Password:</label>
              <input type="password" id="password" name="password" required>
            </div>

            <button type="submit">Login</button>
          </form>
          <p>Don't have an account? <a href="#" id="switch-to-signup">Create one</a></p>
        </div>

        <!-- Signup Form -->
        <div id="signup-form" class="form hidden">
          <h2>Create Account</h2>
          <form action="/handlers/signup_handler.php" method="POST" novalidate>
            <div>
              <label for="first_name">First Name:</label>
              <input type="text" id="first_name" name="first_name" required>
            </div>

            <div>
              <label for="last_name">Last Name:</label>
              <input type="text" id="last_name" name="last_name" required>
            </div>

            <div>
              <label for="email_signup">Email:</label>
              <input type="email" id="email_signup" name="email" required>
            </div>

            <div>
              <label for="password_signup">Password:</label>
              <input type="password" id="password_signup" name="password" required>
            </div>

            <div>
              <label for="confirm_password">Confirm Password:</label>
              <input type="password" id="confirm_password" name="confirm_password" required>
            </div>

            <button type="submit">Sign Up</button>
          </form>
          <p>Already have an account? <a href="#" id="switch-to-login">Login</a></p>
        </div>
      </div>
    </div>
  </div>

  <div id="page-wrapper">
    <div id="notification-area" class="notification-area pinned"></div>
