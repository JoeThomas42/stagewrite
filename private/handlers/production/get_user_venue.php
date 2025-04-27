<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

$userObj = new User();
if (!$userObj->isLoggedIn()) {
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Unauthorized']);
  exit;
}

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Invalid venue ID']);
  exit;
}

$venueId = (int)$_GET['id'];
$db = Database::getInstance();

try {
  $venue = $db->fetchOne("
        SELECT uv.user_venue_id, uv.venue_name, uv.venue_street, uv.venue_city,
               uv.venue_state_id, s.state_abbr, uv.venue_zip, uv.stage_width, uv.stage_depth
        FROM user_venues uv
        LEFT JOIN states s ON uv.venue_state_id = s.state_id
        WHERE uv.user_venue_id = ? AND uv.user_id = ?
    ", [$venueId, $_SESSION['user_id']]);

  if (!$venue) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Venue not found or access denied']);
    exit;
  }

  header('Content-Type: application/json');
  echo json_encode(['success' => true, 'venue' => $venue]);
} catch (Exception $e) {
  error_log('Error fetching user venue: ' . $e->getMessage());
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Database error']);
}
