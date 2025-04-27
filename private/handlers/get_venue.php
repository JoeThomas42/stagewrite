<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

header('Content-Type: application/json');

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
  echo json_encode(['success' => false, 'error' => 'Invalid venue ID']);
  exit;
}

$venueId = (int)$_GET['id'];
$db = Database::getInstance();

try {
  $venue = $db->fetchOne("
        SELECT venue_id, venue_name, venue_street, venue_city,
              venue_state_id, venue_zip, stage_width, stage_depth
        FROM venues
        WHERE venue_id = ?
    ", [$venueId]);

  if (!$venue) {
    echo json_encode(['success' => false, 'error' => 'Venue not found']);
    exit;
  }

  echo json_encode(['success' => true, 'venue' => $venue]);
} catch (Exception $e) {
  error_log('Error fetching venue: ' . $e->getMessage());
  echo json_encode(['success' => false, 'error' => 'Database error']);
}
