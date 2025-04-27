<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';
require_once INCLUDES_PATH . '/plot_snapshot.php';
require_once INCLUDES_PATH . '/functions.php';

$userObj = new User();
if (!$userObj->isLoggedIn()) {
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Unauthorized']);
  exit;
}

$jsonData = null;
if (isset($_POST['data'])) {
  $jsonData = $_POST['data'];
} else {
  $jsonData = file_get_contents('php://input');
}

if (!$jsonData) {
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'No data received']);
  exit;
}

try {
  $data = json_decode($jsonData, true);
  if (json_last_error() !== JSON_ERROR_NONE) {
    throw new Exception('Invalid JSON: ' . json_last_error_msg());
  }

  $db = Database::getInstance();

  $tempDir = PRIVATE_PATH . '/temp';

  $displayMode = isset($_POST['display_mode']) && $_POST['display_mode'] === 'true';

  $pdfResult = generatePlotPDF($data, $db, $tempDir, $displayMode);

  header('Content-Type: application/pdf');
  if ($displayMode) {
    header('Content-Disposition: inline; filename="' . $pdfResult['filename'] . '"');
  } else {
    header('Content-Disposition: attachment; filename="' . $pdfResult['filename'] . '"');
  }
  header('Cache-Control: max-age=0');
  readfile($pdfResult['filepath']);

  unlink($pdfResult['filepath']);
  exit;
} catch (Exception $e) {
  error_log('Error generating PDF: ' . $e->getMessage());

  if (!headers_sent()) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Error generating PDF: ' . $e->getMessage()]);
  }
}
