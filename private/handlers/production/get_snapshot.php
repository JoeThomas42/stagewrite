<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Check that user is logged in
$currentUser = new User();
if (!$currentUser->isLoggedIn()) {
    http_response_code(401);
    header('Content-Type: text/plain');
    echo 'Unauthorized';
    exit;
}

// Get the filename parameter from the request
if (!isset($_GET['filename']) || empty($_GET['filename'])) {
    http_response_code(400);
    header('Content-Type: text/plain');
    echo 'Missing filename parameter';
    exit;
}

// Sanitize the filename to prevent directory traversal attacks
$filename = basename($_GET['filename']);

// Check if the filename belongs to a plot owned by the current user
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

// Define the path to the snapshot
$snapshotPath = PRIVATE_PATH . '/snapshots/' . $filename;

// Check if the file exists
if (!file_exists($snapshotPath) || !is_file($snapshotPath)) {
    http_response_code(404);
    header('Content-Type: text/plain');
    echo 'Snapshot not found';
    exit;
}

// Get the file's MIME type
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $snapshotPath);
finfo_close($finfo);

// Set the content type header
header('Content-Type: ' . $mimeType);

// Set cache control for better performance
header('Cache-Control: public, max-age=86400'); // Cache for 1 day
header('Expires: ' . gmdate('D, d M Y H:i:s \G\M\T', time() + 86400));

// Output the file
readfile($snapshotPath);
exit;
