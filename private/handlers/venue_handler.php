<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

require_once INCLUDES_PATH . '/VenueManager.php';

$currentUser = new User();
if (!$currentUser->hasRole([2, 3])) {
  header('Content-Type: application/json');
  echo json_encode(['error' => 'Unauthorized access']);
  exit;
}

header('Content-Type: application/json');
$venueManager = new VenueManager();

if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'get') {
  if (!isset($_GET['venue_id']) || empty($_GET['venue_id'])) {
    echo json_encode(['error' => 'Missing venue ID']);
    exit;
  }

  $venueId = filter_var($_GET['venue_id'], FILTER_VALIDATE_INT);

  if (!$venueId) {
    echo json_encode(['error' => 'Invalid venue ID']);
    exit;
  }

  try {
    $venue = $venueManager->getVenue($venueId);

    if ($venue) {
      echo json_encode(['success' => true, 'venue' => $venue]);
    } else {
      echo json_encode(['error' => 'Venue not found or cannot be edited']);
    }
  } catch (Exception $e) {
    echo json_encode(['error' => 'Database error: ' . $e->getMessage()]);
  }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'update') {
  $venueData = [
    'venue_id' => !empty($_POST['venue_id']) ? filter_var($_POST['venue_id'], FILTER_VALIDATE_INT) : null,
    'venue_name' => htmlspecialchars(trim($_POST['venue_name'] ?? '')),
    'venue_street' => htmlspecialchars(trim($_POST['venue_street'] ?? '')),
    'venue_city' => htmlspecialchars(trim($_POST['venue_city'] ?? '')),
    'venue_state_id' => !empty($_POST['venue_state_id']) ? filter_var($_POST['venue_state_id'], FILTER_VALIDATE_INT) : null,
    'venue_zip' => !empty($_POST['venue_zip']) ? htmlspecialchars(trim($_POST['venue_zip'])) : null,
    'stage_width' => filter_var($_POST['stage_width'] ?? 0, FILTER_VALIDATE_INT),
    'stage_depth' => filter_var($_POST['stage_depth'] ?? 0, FILTER_VALIDATE_INT)
  ];

  $errors = $venueManager->validateVenueData($venueData);

  if (!empty($errors)) {
    echo json_encode(['success' => false, 'errors' => $errors]);
    exit;
  }

  try {
    $success = $venueManager->saveVenue($venueData);

    if ($success) {
      echo json_encode(['success' => true]);
    } else {
      echo json_encode(['success' => false, 'error' => 'Failed to save venue']);
    }
  } catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
  }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action']) && $_POST['action'] === 'delete') {
  if (empty($_POST['venue_id'])) {
    echo json_encode(['success' => false, 'error' => 'Missing venue ID']);
    exit;
  }

  $venueId = filter_var($_POST['venue_id'], FILTER_VALIDATE_INT);

  if (!$venueId) {
    echo json_encode(['success' => false, 'error' => 'Invalid venue ID']);
    exit;
  }

  try {
    $success = $venueManager->deleteVenue($venueId);

    if ($success) {
      echo json_encode(['success' => true]);
    } else {
      echo json_encode(['success' => false, 'error' => 'Venue not found or cannot be deleted']);
    }
  } catch (Exception $e) {
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
  }
}
