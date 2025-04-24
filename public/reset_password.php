<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

$token = isset($_GET['token']) ? trim($_GET['token']) : '';
$isValidToken = false;
$errorMessage = '';
$userId = '';
$userEmail = '';

// Validate token
if (!empty($token)) {
  $db = Database::getInstance();
  try {
    // Get token data
    $tokenData = $db->fetchOne(
      "SELECT prt.user_id, prt.expires_at, u.email 
        FROM password_reset_tokens prt
        JOIN users u ON prt.user_id = u.user_id
        WHERE prt.token = ? AND prt.expires_at > NOW()",
      [$token]
    );

    if ($tokenData) {
      $isValidToken = true;
      $userId = $tokenData['user_id'];
      $userEmail = $tokenData['email'];
    } else {
      $errorMessage = 'This password reset link is invalid or has expired.';
    }
  } catch (Exception $e) {
    error_log('Error validating reset token: ' . $e->getMessage());
    $errorMessage = 'An error occurred. Please try again later.';
  }
} else {
  $errorMessage = 'No reset token provided.';
}

$current_page = "Reset Password";

include PRIVATE_PATH . '/templates/header.php';
?>

<div class="container reset-password-container">
  <div class="reset-password-card">
    <h2>Reset Your Password</h2>

    <?php if (!$isValidToken): ?>
      <div class="error-message">
        <p><?php echo htmlspecialchars($errorMessage); ?></p>
        <a href="/" class="primary-button">Return to Home</a>
      </div>
    <?php else: ?>
      <form id="password-reset-form">
        <input type="hidden" id="reset_token" name="token" value="<?php echo htmlspecialchars($token); ?>">
        <input type="hidden" id="user_id" name="user_id" value="<?php echo htmlspecialchars($userId); ?>">

        <div class="form-group">
          <label for="user_email">Email:</label>
          <input type="email" id="user_email" value="<?php echo htmlspecialchars($userEmail); ?>" disabled>
        </div>

        <div class="form-group">
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

        <div class="form-group">
          <label for="confirm_new_password">Confirm New Password:</label>
          <div class="password-field-container">
            <input type="password" id="confirm_new_password" name="confirm_new_password" required>
            <button type="button" class="password-toggle" aria-label="Toggle password visibility">
              <i class="fas fa-eye"></i>
            </button>
          </div>
        </div>

        <div id="reset-error" class="error-message hidden"></div>

        <div class="form-actions">
          <button type="submit" id="reset-submit" class="primary-button">Reset Password</button>
        </div>
      </form>

      <div id="reset-success" class="success-message hidden">
        <p>Your password has been reset successfully!</p>
        <a href="/" class="primary-button">Login with New Password</a>
      </div>
    <?php endif; ?>
  </div>
</div>

<!-- Include password toggle CSS -->
<style>
  /* Password field container - for relative positioning */
  .password-field-container {
    position: relative;
    width: 100%;
  }

  /* Password toggle button */
  .password-toggle {
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%);
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    color: var(--color-grey-3);
    font-size: var(--font-size-sm);
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    transition: color var(--transition-fast);
  }

  .password-toggle:hover {
    color: var(--color-primary);
  }

  /* Add right padding to password inputs to prevent text from going under the icon */
  .password-field-container input[type="password"],
  .password-field-container input[type="text"] {
    padding-right: 35px;
  }
</style>

<!-- Include the external JavaScript files -->
<script src="<?= JS_PATH ?>/password-reset.js"></script>
<script>
  // Password toggle functionality
  document.addEventListener('DOMContentLoaded', function() {
    const toggleButtons = document.querySelectorAll('.password-toggle');

    toggleButtons.forEach(button => {
      button.addEventListener('click', function() {
        const container = this.parentNode;
        const passwordField = container.querySelector('input');
        const fieldType = passwordField.getAttribute('type');

        // Toggle between password and text
        if (fieldType === 'password') {
          passwordField.setAttribute('type', 'text');
          this.innerHTML = '<i class="fas fa-eye-slash"></i>';
        } else {
          passwordField.setAttribute('type', 'password');
          this.innerHTML = '<i class="fas fa-eye"></i>';
        }
      });
    });
  });
</script>

<?php include PRIVATE_PATH . '/templates/footer.php'; ?>
