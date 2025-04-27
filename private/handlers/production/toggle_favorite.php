<?php
header('Content-Type: application/json');

$currentUser = new User();
if (!$currentUser->isLoggedIn()) {
  http_response_code(401);
  echo json_encode(['success' => false, 'error' => 'Log in to save Favorites!']);
  exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'error' => 'Method not allowed']);
  exit;
}

if (empty($_POST['element_id']) || !is_numeric($_POST['element_id'])) {
  http_response_code(400);
  echo json_encode(['success' => false, 'error' => 'Missing or invalid element ID']);
  exit;
}

$elementId = (int)$_POST['element_id'];
$userId = $_SESSION['user_id'];

$db = Database::getInstance();

try {
  $elementData = $db->fetchOne(
    "SELECT element_name FROM elements WHERE element_id = ?",
    [$elementId]
  );

  if (!$elementData) {
    http_response_code(404);
    echo json_encode(['success' => false, 'error' => 'Element not found']);
    exit;
  }

  $elementName = $elementData['element_name'];

  $favorite = $db->fetchOne(
    "SELECT favorite_id FROM user_favorites
      WHERE user_id = ? AND element_id = ?",
    [$userId, $elementId]
  );

  if ($favorite) {
    $db->query(
      "DELETE FROM user_favorites WHERE favorite_id = ?",
      [$favorite['favorite_id']]
    );

    echo json_encode([
      'success' => true,
      'action' => 'removed',
      'element_name' => $elementName,
      'message' => "{$elementName} remove from favorites!"
    ]);
  } else {
    $db->query(
      "INSERT INTO user_favorites (user_id, element_id)
        VALUES (?, ?)",
      [$userId, $elementId]
    );

    echo json_encode([
      'success' => true,
      'action' => 'added',
      'element_name' => $elementName,
      'message' => "{$elementName} added to favorites!"
    ]);
  }
} catch (Exception $e) {
  error_log('Error toggling favorite: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'error' => 'Database error: ' . $e->getMessage()
  ]);
}
