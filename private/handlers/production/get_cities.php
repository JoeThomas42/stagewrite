<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

$userObj = new User();
if (!$userObj->isLoggedIn()) {
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Unauthorized']);
  exit;
}

if (!isset($_GET['state_id']) || !is_numeric($_GET['state_id'])) {
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Invalid state ID']);
  exit;
}

$stateId = (int)$_GET['state_id'];
$searchTerm = isset($_GET['term']) ? trim($_GET['term']) : '';
$db = Database::getInstance();

try {
  $stateInfo = $db->fetchOne("SELECT state_abbr FROM states WHERE state_id = ?", [$stateId]);

  if (!$stateInfo) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'State not found']);
    exit;
  }

  $stateAbbr = $stateInfo['state_abbr'];

  $mockCityData = [
    "AL" => ["Birmingham", "Montgomery", "Mobile", "Huntsville", "Tuscaloosa"],
    "AK" => ["Anchorage", "Fairbanks", "Juneau", "Sitka", "Ketchikan"],
    "AZ" => ["Phoenix", "Tucson", "Mesa", "Chandler", "Scottsdale", "Glendale", "Gilbert", "Tempe"],
    "AR" => ["Little Rock", "Fort Smith", "Fayetteville", "Springdale", "Jonesboro"],
    "CA" => ["Los Angeles", "San Diego", "San Jose", "San Francisco", "Fresno", "Sacramento", "Long Beach"],
  ];

  $cities = $mockCityData[$stateAbbr] ?? [
    "$stateAbbr City",
    "$stateAbbr Town",
    "North $stateAbbr",
    "South $stateAbbr",
    "East $stateAbbr",
    "West $stateAbbr"
  ];

  if (!empty($searchTerm)) {
    $filteredCities = array_filter($cities, function ($city) use ($searchTerm) {
      return stripos($city, $searchTerm) !== false;
    });
    $cities = array_values($filteredCities);
  }

  if (empty($searchTerm) && count($cities) > 8) {
    $cities = array_slice($cities, 0, 8);
  }

  header('Content-Type: application/json');
  echo json_encode(['success' => true, 'cities' => $cities]);
} catch (Exception $e) {
  error_log('Error fetching cities: ' . $e->getMessage());
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
