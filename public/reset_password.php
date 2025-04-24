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
          <input type="password" id="new_password" name="new_password" required>
          <small class="password-requirements">
            Minimum 8 characters, including at least one number
          </small>
        </div>

        <div class="form-group">
          <label for="confirm_new_password">Confirm New Password:</label>
          <input type="password" id="confirm_new_password" name="confirm_new_password" required>
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

<!-- Include the external JavaScript file -->
<script src="<?= JS_PATH ?>/password-reset.js"></script>

<?php include PRIVATE_PATH . '/templates/footer.php'; ?>
