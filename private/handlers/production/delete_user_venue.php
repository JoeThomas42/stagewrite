<?php
header('Content-Type: application/json');

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

$userObj = new User();
if (!$userObj->isLoggedIn()) {
  echo json_encode(['success' => false, 'error' => 'Unauthorized']);
  exit;
}

$venueId = isset($_POST['id']) ? (int)$_POST['id'] : (isset($_GET['id']) ? (int)$_GET['id'] : 0);
if (!$venueId) {
  echo json_encode(['success' => false, 'error' => 'Invalid venue ID']);
  exit;
}

try {
  $db = Database::getInstance();

  $venue = $db->fetchOne(
    "SELECT * FROM user_venues WHERE user_venue_id = ? AND user_id = ?",
    [$venueId, $_SESSION['user_id']]
  );

  if (!$venue) {
    echo json_encode(['success' => false, 'error' => 'Venue not found or access denied']);
    exit;
  }

  $result = $db->query("DELETE FROM user_venues WHERE user_venue_id = ?", [$venueId]);
  echo json_encode(['success' => true]);
} catch (Exception $e) {
  echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
