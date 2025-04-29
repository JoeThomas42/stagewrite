<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Check if user is logged in and has admin privileges
if (!isset($_SESSION['user_id']) || ($_SESSION['role_id'] != 2 && $_SESSION['role_id'] != 3)) {
  header('Location: /');
  exit;
}

$current_user_role = $_SESSION['role_id'];
$view_user_id = isset($_GET['user_id']) ? $_GET['user_id'] : null;

if (!$view_user_id) {
  $_SESSION['error_message'] = "No user specified.";
  header('Location: data_management.php');
  exit;
}

$db = Database::getInstance();
$error_message = '';
$success_message = '';
$confirm_action = isset($_POST['confirm_action']) ? $_POST['confirm_action'] : '';
$action_to_confirm = isset($_POST['action_to_confirm']) ? $_POST['action_to_confirm'] : '';

// Check if cancel button was clicked
if (isset($_POST['cancel_action'])) {
  // Clear confirmation variables
  $action_to_confirm = '';
  $confirm_action = '';
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  // First step of confirmation or direct action
  if (isset($_POST['action']) && empty($confirm_action)) {
    $action = $_POST['action'];
    $action_user_id = $_POST['user_id'] ?? null;

    // Store the action for confirmation
    $action_to_confirm = $action;

    // Set confirmation message based on action
    if ($action === 'promote') {
      $confirm_message = "Are you sure you want to promote this user to Admin?";
    } else if ($action === 'demote') {
      $confirm_message = "Are you sure you want to demote this user to Member?";
    } else if ($action === 'delete') {
      $confirm_message = "WARNING: Deleting this user is permanent and cannot be undone. Are you absolutely sure?";
    } else if ($action === 'toggle_status') {
      $user_data = $db->fetchOne("SELECT is_active FROM users WHERE user_id = ?", [$action_user_id]);
      $current_status = $user_data['is_active'] ? 'deactivate' : 'activate';
      $confirm_message = "Are you sure you want to {$current_status} this user?";
    }
  }
  // Second step - user confirmed the action
  else if (!empty($confirm_action) && !empty($action_to_confirm)) {
    $action_user_id = $_POST['user_id'] ?? null;

    if ($action_user_id !== $view_user_id) {
      $error_message = "Action mismatch. Please try again.";
    } else {
      $userManager = new User();
      try {
        switch ($action_to_confirm) {
          case 'promote':
            if ($current_user_role == 3) { // Only Super Admin can promote
              if ($userManager->promoteToAdmin($action_user_id)) {
                $success_message = "User promoted to Admin successfully.";
              } else {
                $error_message = "Failed to promote user. They might already be an admin or an error occurred.";
              }
            } else {
              $error_message = "You do not have permission to promote users.";
            }
            break;
          case 'demote':
            if ($current_user_role == 3) { // Only Super Admin can demote
              if ($userManager->demoteToMember($action_user_id)) {
                $success_message = "User demoted to Member successfully.";
              } else {
                $error_message = "Failed to demote user. They might already be a member or an error occurred.";
              }
            } else {
              $error_message = "You do not have permission to demote users.";
            }
            break;
          case 'delete':
            $allowedRolesToDelete = ($current_user_role == 3) ? [1, 2] : [1]; // Super Admin can delete Admins & Members, Admin can delete Members
            if ($userManager->deleteUser($action_user_id, $allowedRolesToDelete)) {
              $_SESSION['success_message'] = "User deleted successfully.";
              header('Location: data_management.php');
              exit;
            } else {
              $error_message = "Failed to delete user or permission denied.";
            }
            break;
          case 'toggle_status':
            $allowedRolesToToggle = ($current_user_role == 3) ? [1, 2] : [1];
            $result = $userManager->toggleUserStatus($action_user_id, $allowedRolesToToggle);
            if ($result && $result['success']) {
              $newStatusText = $result['is_active'] ? 'activated' : 'deactivated';
              $success_message = "User status successfully {$newStatusText}.";
            } else {
              $error_message = "Failed to toggle user status or permission denied.";
            }
            break;
        }
      } catch (Exception $e) {
        $error_message = "An error occurred: " . $e->getMessage();
        error_log("Error performing action on user $action_user_id: " . $e->getMessage());
      }
      // Clear the confirmation variables after processing
      $action_to_confirm = '';
      $confirm_action = '';
    }
  }
}

$user_data = $db->fetchOne("SELECT u.*, r.role_name FROM users u JOIN user_roles r ON u.role_id = r.role_id WHERE u.user_id = ?", [$view_user_id]);

if (!$user_data) {
  $_SESSION['error_message'] = "User not found.";
  header('Location: data_management.php');
  exit;
}

if ($current_user_role == 2 && $user_data['role_id'] != 1) {
  $_SESSION['error_message'] = "You do not have permission to view this user.";
  header('Location: data_management.php');
  exit;
}

$plot_count = $db->fetchOne("SELECT COUNT(*) as count FROM saved_plots WHERE user_id = ?", [$view_user_id])['count'] ?? 0;
$custom_venue_count = $db->fetchOne("SELECT COUNT(*) as count FROM user_venues WHERE user_id = ?", [$view_user_id])['count'] ?? 0;
$email_log = $db->fetchAll("SELECT subject, sent_at FROM email_log WHERE user_id = ? ORDER BY sent_at DESC LIMIT 10", [$view_user_id]);

$current_page = "View User";
include PRIVATE_PATH . '/templates/header.php';
?>

<div class="profile-container view-container">
  <div class="profile-header">
    <h1>View User: <?= htmlspecialchars($user_data['first_name']) ?> <?= htmlspecialchars($user_data['last_name']) ?></h1>
    <a href="data_management.php?target=users"><button class="button back-button">Back to Management</button></a>
  </div>

  <?php if ($error_message): ?>
    <div class="error-message"><?= htmlspecialchars($error_message) ?></div>
  <?php endif; ?>
  <?php if ($success_message): ?>
    <div class="success-message"><?= htmlspecialchars($success_message) ?></div>
  <?php endif; ?>

  <div class="view-section">
    <h2>User Information</h2>
    <table class="view-table">
      <tr>
        <th>User ID:</th>
        <td><?= htmlspecialchars($user_data['user_id']) ?></td>
      </tr>
      <tr>
        <th>First Name:</th>
        <td><?= htmlspecialchars($user_data['first_name']) ?></td>
      </tr>
      <tr>
        <th>Last Name:</th>
        <td><?= htmlspecialchars($user_data['last_name']) ?></td>
      </tr>
      <tr>
        <th>Email:</th>
        <td><?= htmlspecialchars($user_data['email']) ?></td>
      </tr>
      <tr>
        <th>Role:</th>
        <td><?= htmlspecialchars($user_data['role_name']) ?></td>
      </tr>
      <tr>
        <th>Status:</th>
        <td><?= $user_data['is_active'] ? 'Active' : 'Inactive' ?></td>
      </tr>
      <tr>
        <th>Created At:</th>
        <td><?= date('M j, Y g:i A', strtotime($user_data['created_at'])) ?></td>
      </tr>
    </table>
  </div>

  <div class="view-section">
    <h2>Activity</h2>
    <table class="view-table">
      <tr>
        <th>Saved Plots:</th>
        <td><?= $plot_count ?></td>
      </tr>
      <tr>
        <th>Custom Venues:</th>
        <td><?= $custom_venue_count ?></td>
      </tr>
    </table>
  </div>

  <div class="view-section">
    <h2>Recent Email Log (Last 10)</h2>
    <?php if (!empty($email_log)): ?>
      <table class="view-table email-log-table">
        <thead>
          <tr>
            <th>Subject</th>
            <th>Sent At</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($email_log as $log): ?>
            <tr>
              <td><?= htmlspecialchars($log['subject']) ?></td>
              <td><?= date('M j, Y g:i A', strtotime($log['sent_at'])) ?></td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>
    <?php else: ?>
      <p>No recent email activity found.</p>
    <?php endif; ?>
  </div>

  <div class="view-section user-actions-section">
    <h2>Actions</h2>

    <?php if (!empty($action_to_confirm)): ?>
      <!-- Confirmation form -->
      <div class="confirmation-box">
        <p class="confirmation-message"><?= $confirm_message ?></p>
        <form method="POST" action="view_user.php?user_id=<?= urlencode($view_user_id) ?>">
          <input type="hidden" name="user_id" value="<?= htmlspecialchars($view_user_id) ?>">
          <input type="hidden" name="action_to_confirm" value="<?= htmlspecialchars($action_to_confirm) ?>">
          <div class="confirmation-buttons">
            <button type="submit" name="confirm_action" value="yes" class="button danger-button">Confirm</button>
            <button type="submit" name="cancel_action" value="cancel" class="button secondary-button">Cancel</button>
          </div>
        </form>
      </div>
    <?php else: ?>
      <!-- Regular action buttons -->
      <form method="POST" action="view_user.php?user_id=<?= urlencode($view_user_id) ?>">
        <input type="hidden" name="user_id" value="<?= htmlspecialchars($view_user_id) ?>">

        <button type="submit" name="action" value="toggle_status" class="button secondary-button">
          <?= $user_data['is_active'] ? 'Deactivate User' : 'Activate User' ?>
        </button>

        <?php // Promote/Demote only for Super Admin and if target is not Super Admin 
        ?>
        <?php if ($current_user_role == 3 && $user_data['role_id'] != 3): ?>
          <?php if ($user_data['role_id'] == 1): // If Member, show Promote 
          ?>
            <button type="submit" name="action" value="promote" class="button action-button">Promote to Admin</button>
          <?php elseif ($user_data['role_id'] == 2): // If Admin, show Demote 
          ?>
            <button type="submit" name="action" value="demote" class="button warning-button">Demote to Member</button>
          <?php endif; ?>
        <?php endif; ?>

        <?php // Delete only if current user has permission for target role 
        ?>
        <?php if (($current_user_role == 3 && $user_data['role_id'] != 3) || ($current_user_role == 2 && $user_data['role_id'] == 1)): ?>
          <button type="submit" name="action" value="delete" class="button danger-button">Delete User</button>
        <?php endif; ?>
      </form>
    <?php endif; ?>
  </div>
</div>

<?php include PRIVATE_PATH . '/templates/footer.php'; ?>
