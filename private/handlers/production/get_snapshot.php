<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

$currentUser = new User();
if (!$currentUser->isLoggedIn()) {
  http_response_code(401);
  header('Content-Type: text/plain');
  echo 'Unauthorized';
  exit;
}

if (!isset($_GET['filename']) || empty($_GET['filename'])) {
  http_response_code(400);
  header('Content-Type: text/plain');
  echo 'Missing filename parameter';
  exit;
}

$filename = basename($_GET['filename']);

$db = Database::getInstance();
$plot = $db->fetchOne(
  "SELECT * FROM saved_plots
    WHERE snapshot_filename = ? AND user_id = ?",
  [$filename, $_SESSION['user_id']]
);

if (!$plot) {
  http_response_code(403);
  header('Content-Type: text/plain');
  echo 'Access denied';
  exit;
}

$snapshotPath = PRIVATE_PATH . '/snapshots/' . $filename;

if (!file_exists($snapshotPath) || !is_file($snapshotPath)) {
  http_response_code(404);
  header('Content-Type: text/plain');
  echo 'Snapshot not found';
  exit;
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $snapshotPath);
finfo_close($finfo);

header('Content-Type: ' . $mimeType);

header('Cache-Control: public, max-age=86400');
header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + 86400));

readfile($snapshotPath);
exit;
