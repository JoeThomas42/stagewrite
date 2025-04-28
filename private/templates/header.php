<?php

/**
 * Site header template
 * @package StageWrite
 */
?>
<!DOCTYPE html>
<html lang="en">

<head>
  <meta charset="UTF-8">

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

  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>StageWrite - <?= htmlspecialchars($current_page) ?></title>

  <link rel="preconnect" href="https://kit.fontawesome.com">
  <link rel="preconnect" href="https://ka-f.fontawesome.com" crossorigin>
  <link rel="preconnect" href="https://www.google.com">
  <link rel="preconnect" href="https://www.gstatic.com" crossorigin>
  <link rel="stylesheet" href="<?= CSS_PATH ?>/main.css">

  <script src="https://kit.fontawesome.com/6a66a6b74c.js" crossorigin="anonymous" defer></script>
  <script src="<?= JS_PATH ?>/main.js" defer></script>
  <script src="https://www.google.com/recaptcha/api.js" async defer></script>
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
            <div class="dropdown account-dropdown">
              <button class="dropdown-toggle account-toggle" aria-label="Account options">
                <i class="fas fa-user-circle"></i>
              </button>
              <div class="dropdown-menu account-menu">
                <div class="account-greeting">
                  <p>Hello, <?php echo htmlspecialchars($_SESSION['first_name']); ?>!</p>
                  <a id="logout-button" href="<?= HANDLERS_URL ?>/logout_handler.php">Logout</a>
                </div>
                <a href="#" id="change-password-link">Change Password</a>
                <a href="#" id="change-email-link">Change Email</a>
                <a href="#" id="delete-account-link">Delete Account</a>
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

    <!-- 404 Notification script -->
    <?php if (isset($_SESSION['show_not_found_notification']) && $_SESSION['show_not_found_notification']): ?>
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          if (typeof showNotification === 'function') {
            showNotification('Page not found! Returned home!', 'warning', 5000);
          } else {
            setTimeout(function checkNotification() {
              if (typeof showNotification === 'function') {
                showNotification('Page not found! Returned home!', 'warning', 5000);
              } else if (typeof window.showNotification === 'function') {
                window.showNotification('Page not found! Returned home!', 'warning', 5000);
              } else {
                setTimeout(checkNotification, 100);
              }
            }, 100);
          }
        });
      </script>
      <?php
      unset($_SESSION['show_not_found_notification']);
      ?>
    <?php endif; ?>
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
              <div class="password-field-container">
                <input type="password" id="password" name="password" required>
                <button type="button" class="password-toggle" aria-label="Toggle password visibility">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>

            <div class="forgot-password-link">
              <a href="#" id="forgot-password-link">Forgot Password?</a>
            </div>

            <div class="checkbox-group">
              <input type="checkbox" id="stay_logged_in" name="stay_logged_in" value="1">
              <label for="stay_logged_in" class="checkbox-label">Stay logged in</label>
            </div>

            <!-- reCaptcha -->
            <div class="g-recaptcha" data-theme="dark" data-sitekey="<?php echo RECAPTCHA_SITE_KEY; ?>"></div>
            <div id="login-recaptcha-error" class="field-error" style="display: none;">Please complete the CAPTCHA.</div>

            <button type="submit">Login</button>
          </form>
          <p>Don't have an account? <a href="#" id="switch-to-signup">Create one</a></p>
        </div>

        <!-- Forgot Password Form - initially hidden -->
        <div id="forgot-password-form" class="form hidden">
          <h2>Reset Password</h2>
          <p>Enter your email address and we'll send you a link to reset your password if this account exists.</p>
          <form id="reset-request-form">
            <div>
              <label for="reset_email">Email:</label>
              <input type="email" id="reset_email" name="email" required>
            </div>
            <div class="form-actions">
              <button type="submit">Send Reset Link</button>
              <button type="button" id="back-to-login">Back to Login</button>
            </div>
          </form>
          <div class="reset-message hidden">
            <div class="success-message hidden">
              <p>Password reset link sent! Please check your email.</p>
            </div>
            <div class="error-message hidden">
              <p>Error: <span id="reset-error-text"></span></p>
            </div>
            <button type="button" id="reset-back-to-login" class="primary-button">Back to Login</button>
          </div>
        </div>

        <!-- Signup Form - initially hidden -->
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
              <div class="password-field-container">
                <input type="password" id="password_signup" name="password" required>
                <button type="button" class="password-toggle" aria-label="Toggle password visibility">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
              <small class="password-requirements">
                Minimum 8 characters, including at least one number
              </small>
            </div>

            <div>
              <label for="confirm_password">Confirm Password:</label>
              <div class="password-field-container">
                <input type="password" id="confirm_password" name="confirm_password" required>
                <button type="button" class="password-toggle" aria-label="Toggle password visibility">
                  <i class="fas fa-eye"></i>
                </button>
              </div>
            </div>

            <!-- reCaptcha -->
            <div class="g-recaptcha" data-theme="dark" data-sitekey="<?php echo RECAPTCHA_SITE_KEY; ?>"></div>
            <div id="recaptcha-error" class="field-error" style="display: none;">Please complete the CAPTCHA.</div>

            <button type="submit">Sign Up</button>
          </form>
          <p>Already have an account? <a href="#" id="switch-to-login">Login</a></p>
        </div>
      </div>
    </div>
  </div>

  <!-- Password Change Modal -->
  <div id="password-change-modal" class="modal hidden">
    <div class="modal-content">
      <span class="close-button">&times;</span>
      <h2>Change Password</h2>
      <form id="password-change-form">
        <div>
          <label for="current_password">Current Password:</label>
          <div class="password-field-container">
            <input type="password" id="current_password" name="current_password" required>
            <button type="button" class="password-toggle" aria-label="Toggle password visibility">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>

        <div>
          <label for="new_password">New Password:</label>
          <div class="password-field-container">
            <input type="password" id="new_password" name="new_password" required>
            <button type="button" class="password-toggle" aria-label="Toggle password visibility">
              <i class="fas fa-eye"></i>
            </button>
          </div>
          <small class="password-requirements">
            Minimum 8 characters, including at least one number
          </small>
        </div>

        <div>
          <label for="confirm_new_password">Confirm New Password:</label>
          <div class="password-field-container">
            <input type="password" id="confirm_new_password" name="confirm_new_password" required>
            <button type="button" class="password-toggle" aria-label="Toggle password visibility">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>

        <div id="password-change-error" class="error-message hidden"></div>

        <div class="form-actions">
          <button type="submit" class="save-button">Change Password</button>
          <button type="button" class="cancel-button">Cancel</button>
        </div>
      </form>
      <div class="password-change-success hidden">
        <p>Your password has been changed successfully!</p>
        <button type="button" class="primary-button" id="close-success-btn">Close</button>
      </div>
      <div class="modal-notification-area"></div>
    </div>
  </div>

  <!-- Email Change Modal -->
  <div id="email-change-modal" class="modal hidden">
    <div class="modal-content">
      <span class="close-button">&times;</span>
      <h2>Change Email</h2>
      <form id="email-change-form">
        <div>
          <label for="current_password_email">Current Password:</label>
          <div class="password-field-container">
            <input type="password" id="current_password_email" name="current_password" required>
            <button type="button" class="password-toggle" aria-label="Toggle password visibility">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>

        <div>
          <label for="current_email">Current Email:</label>
          <input type="email" id="current_email" name="current_email" readonly>
        </div>

        <div>
          <label for="new_email">New Email:</label>
          <input type="email" id="new_email" name="new_email" required>
        </div>

        <div id="email-change-error" class="error-message hidden"></div>

        <div class="form-actions">
          <button type="submit" class="save-button">Change Email</button>
          <button type="button" class="cancel-button">Cancel</button>
        </div>
      </form>
      <div class="email-change-success hidden">
        <p>Your email has been changed successfully!</p>
        <button type="button" class="primary-button" id="close-email-success-btn">Close</button>
      </div>
      <div class="modal-notification-area"></div>
    </div>
  </div>

  <!-- Account Deletion Modal -->
  <div id="delete-account-modal" class="modal hidden">
    <div class="modal-content">
      <span class="close-button">&times;</span>
      <h2>Delete Account</h2>
      <div class="warning-message">
        <p><strong>Warning:</strong> This action cannot be undone. All your data will be permanently deleted.</p>
      </div>
      <form id="delete-account-form">
        <div>
          <label for="delete_account_password">Enter your password to confirm:</label>
          <div class="password-field-container">
            <input type="password" id="delete_account_password" name="password" required>
            <button type="button" class="password-toggle" aria-label="Toggle password visibility">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>

        <div id="delete-account-error" class="error-message hidden"></div>

        <div class="form-actions">
          <button type="submit" id="confirm-delete-btn" class="delete-button">Delete Account</button>
          <button type="button" class="cancel-button">Cancel</button>
        </div>
      </form>
      <div class="modal-notification-area"></div>
    </div>
  </div>

  <div id="page-wrapper">
    <div id="notification-area" class="notification-area pinned"></div>
