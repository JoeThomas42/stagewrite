<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

$userObj = new User();
if (!$userObj->isLoggedIn()) {
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Unauthorized']);
  exit;
}

if (!isset($_POST['plot_id']) || !is_numeric($_POST['plot_id'])) {
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Invalid plot ID']);
  exit;
}

$plotId = (int)$_POST['plot_id'];
$db = Database::getInstance();

try {
  $db->getConnection()->beginTransaction();

  $plot = $db->fetchOne(
    "SELECT plot_id FROM saved_plots WHERE plot_id = ? AND user_id = ?",
    [$plotId, $_SESSION['user_id']]
  );

  if (!$plot) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Plot not found or access denied']);
    exit;
  }

  $db->query("DELETE FROM placed_elements WHERE plot_id = ?", [$plotId]);

  $db->query("DELETE FROM saved_plots WHERE plot_id = ?", [$plotId]);

  $db->getConnection()->commit();

  header('Content-Type: application/json');
  echo json_encode(['success' => true]);
} catch (Exception $e) {
  if ($db->getConnection()->inTransaction()) {
    $db->getConnection()->rollBack();
  }

  error_log('Error deleting plot: ' . $e->getMessage());
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
