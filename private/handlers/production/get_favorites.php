<?php
header('Content-Type: application/json');

$currentUser = new User();
if (!$currentUser->isLoggedIn()) {
  http_response_code(401);
  echo json_encode(['success' => false, 'error' => 'Unauthorized']);
  exit;
}

$db = Database::getInstance();

try {
  $favorites = $db->fetchAll(
    "SELECT uf.element_id, e.element_name, e.category_id, e.element_image
      FROM user_favorites uf
      JOIN elements e ON uf.element_id = e.element_id
      WHERE uf.user_id = ?",
    [$_SESSION['user_id']]
  );

  echo json_encode([
    'success' => true,
    'favorites' => $favorites
  ]);
} catch (Exception $e) {
  error_log('Error fetching favorites: ' . $e->getMessage());
  http_response_code(500);
  echo json_encode([
    'success' => false,
    'error' => 'Database error: ' . $e->getMessage()
  ]);
}
