<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

$userObj = new User();
if (!$userObj->isLoggedIn()) {
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Unauthorized']);
  exit;
}

if (!isset($_GET['zip']) || !preg_match('/^\d{5}$/', $_GET['zip'])) {
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Invalid ZIP code format']);
  exit;
}

$zipCode = $_GET['zip'];
$db = Database::getInstance();

$zipCodeData = [
  "10001" => ["city" => "New York", "state" => "NY"],
  "10016" => ["city" => "New York", "state" => "NY"],
  "10019" => ["city" => "New York", "state" => "NY"],
  "90001" => ["city" => "Los Angeles", "state" => "CA"],
  "90007" => ["city" => "Los Angeles", "state" => "CA"],
  "90015" => ["city" => "Los Angeles", "state" => "CA"],
];

try {
  if (isset($zipCodeData[$zipCode])) {
    $data = $zipCodeData[$zipCode];

    $stateInfo = $db->fetchOne("SELECT state_id FROM states WHERE state_abbr = ?", [$data['state']]);
    $stateId = $stateInfo ? $stateInfo['state_id'] : null;

    header('Content-Type: application/json');
    echo json_encode([
      'success' => true,
      'city' => $data['city'],
      'state' => $data['state'],
      'state_id' => $stateId
    ]);
  } else {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'ZIP code not found']);
  }
} catch (Exception $e) {
  error_log('Error fetching ZIP code info: ' . $e->getMessage());
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
