<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Check if user is logged in and has admin privileges
if (!isset($_SESSION['user_id']) || ($_SESSION['role_id'] != 2 && $_SESSION['role_id'] != 3)) {
  header('Location: /');
  exit;
}

$venue_id = isset($_GET['venue_id']) ? (int)$_GET['venue_id'] : null;

$db = Database::getInstance();
$error_message = '';
$success_message = '';
$confirm_action = isset($_POST['confirm_action']) ? $_POST['confirm_action'] : '';
$action_to_confirm = isset($_POST['action_to_confirm']) ? $_POST['action_to_confirm'] : '';

// Check if cancel button was clicked - clear variables
if (isset($_POST['cancel_action'])) {
  // Clear confirmation variables and don't process other post data
  $action_to_confirm = '';
  $confirm_action = '';
}
// Only process other POST data if not canceling
else if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  // First step of confirmation
  if (isset($_POST['action']) && empty($confirm_action)) {
    $action = $_POST['action'];
    $action_venue_id = $_POST['venue_id'] ?? null;

    // Store the action for confirmation
    $action_to_confirm = $action;

    // Set confirmation message based on action
    if ($action === 'delete') {
      if ($action_venue_id == 1) {
        $error_message = "The default venue cannot be deleted.";
        $action_to_confirm = ''; // Reset confirmation since we don't need it
      } else {
        $confirm_message = "Are you sure you want to delete this venue? Associated plots will be reassigned to the default venue. This cannot be undone.";
      }
    }
  }
  // Second step - user confirmed the action
  else if (!empty($confirm_action) && !empty($action_to_confirm)) {
    $action_venue_id = $_POST['venue_id'] ?? null;

    if ($action_venue_id != $venue_id) {
      $error_message = "Action mismatch. Please try again.";
    } else {
      if ($action_venue_id == 1) {
        $error_message = "The default venue cannot be deleted.";
      } else {
        require_once INCLUDES_PATH . '/VenueManager.php';
        $venueManager = new VenueManager();
        try {
          if ($venueManager->deleteVenue($action_venue_id)) {
            $_SESSION['success_message'] = "Venue deleted successfully.";
            header('Location: data_management.php');
            exit;
          } else {
            $error_message = "Failed to delete venue. It might not exist or an error occurred.";
            $_SESSION['error_message'] = $error_message;
          }
        } catch (Exception $e) {
          $error_message = "An error occurred: " . $e->getMessage();
          $_SESSION['error_message'] = $error_message;
          error_log("Error deleting venue $action_venue_id: " . $e->getMessage());
        }
      }
    }
    // Clear the confirmation variables after processing
    $action_to_confirm = '';
    $confirm_action = '';
  }
}

$venue_data = $db->fetchOne("
    SELECT v.*, s.state_name, s.state_abbr
    FROM venues v
    LEFT JOIN states s ON v.venue_state_id = s.state_id
    WHERE v.venue_id = ?
", [$venue_id]);

if (!$venue_data) {
  $_SESSION['error_message'] = "Venue not found.";
  header('Location: data_management.php');
  exit;
}

$current_page = "View Venue";
include PRIVATE_PATH . '/templates/header.php';
?>

<div class="profile-container view-container">
  <div class="profile-header">
    <h1>View Venue: <?= htmlspecialchars($venue_data['venue_name']) ?></h1>
    <a href="data_management.php"><button class="button back-button">Back to Management</button></a>
  </div>

  <?php if ($error_message): ?>
    <div class="error-message"><?= htmlspecialchars($error_message) ?></div>
  <?php endif; ?>
  <?php if ($success_message): ?>
    <div class="success-message"><?= htmlspecialchars($success_message) ?></div>
  <?php endif; ?>

  <div class="view-section">
    <h2>Venue Information</h2>
    <table class="view-table">
      <tr>
        <th>Venue ID:</th>
        <td><?= htmlspecialchars($venue_data['venue_id']) ?></td>
      </tr>
      <tr>
        <th>Name:</th>
        <td><?= htmlspecialchars($venue_data['venue_name']) ?></td>
      </tr>
      <tr>
        <th>Street:</th>
        <td><?= formatEmpty(htmlspecialchars($venue_data['venue_street'])) ?></td>
      </tr>
      <tr>
        <th>City:</th>
        <td><?= formatEmpty(htmlspecialchars($venue_data['venue_city'])) ?></td>
      </tr>
      <tr>
        <th>State:</th>
        <td><?= formatEmpty(htmlspecialchars($venue_data['state_name'])) ?> (<?= formatEmpty(htmlspecialchars($venue_data['state_abbr'])) ?>)</td>
      </tr>
      <tr>
        <th>ZIP Code:</th>
        <td><?= formatEmpty(htmlspecialchars($venue_data['venue_zip'])) ?></td>
      </tr>
      <tr>
        <th>Stage Width:</th>
        <td><?= formatEmpty(htmlspecialchars($venue_data['stage_width'])) ?><?= !empty($venue_data['stage_width']) ? "'" : "" ?></td>
      </tr>
      <tr>
        <th>Stage Depth:</th>
        <td><?= formatEmpty(htmlspecialchars($venue_data['stage_depth'])) ?><?= !empty($venue_data['stage_depth']) ? "'" : "" ?></td>
      </tr>
    </table>
  </div>

  <div class="view-section actions-section">
    <h2>Actions</h2>

    <?php if (!empty($action_to_confirm)): ?>
      <!-- Confirmation form -->
      <div class="confirmation-box">
        <p class="confirmation-message"><?= $confirm_message ?></p>
        <form method="POST" action="view_venue.php?venue_id=<?= urlencode($venue_id) ?>">
          <input type="hidden" name="venue_id" value="<?= htmlspecialchars($venue_id) ?>">
          <input type="hidden" name="action_to_confirm" value="<?= htmlspecialchars($action_to_confirm) ?>">
          <div class="confirmation-buttons">
            <button type="submit" name="confirm_action" value="yes" class="button danger-button">Confirm</button>
            <button type="submit" name="cancel_action" value="cancel" class="button secondary-button">Cancel</button>
          </div>
        </form>
      </div>
    <?php else: ?>
      <!-- Regular action buttons -->
      <div class="action-buttons">
        <a href="edit_venue.php?venue_id=<?= urlencode($venue_id) ?>"><button class="button action-button">Edit Venue</button></a>
        <form method="POST" action="view_venue.php?venue_id=<?= urlencode($venue_id) ?>" style="display: inline;">
          <input type="hidden" name="venue_id" value="<?= htmlspecialchars($venue_id) ?>">
          <button type="submit" name="action" value="delete" class="button danger-button" <?= $venue_id == 1 ? ' disabled' : '' ?>>Delete Venue</button>
        </form>
      </div>
    <?php endif; ?>
  </div>
</div>

<?php include PRIVATE_PATH . '/templates/footer.php'; ?>
