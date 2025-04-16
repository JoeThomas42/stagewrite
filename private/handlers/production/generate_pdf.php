<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';
require_once INCLUDES_PATH . '/plot_snapshot.php';
require_once INCLUDES_PATH . '/functions.php';

// Ensure user is logged in
$userObj = new User();
if (!$userObj->isLoggedIn()) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

// Get JSON data (update to handle both direct JSON and form POST)
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
    
    // Database connection
    $db = Database::getInstance();
    
    // Create temporary directory if needed
    $tempDir = PRIVATE_PATH . '/temp';
    
    // Check if we should print (auto-open print dialog)
    $displayMode = isset($_POST['display_mode']) && $_POST['display_mode'] === 'true';
    
    // Generate the PDF
    $pdfResult = generatePlotPDF($data, $db, $tempDir, $displayMode);
    
    // Send the file to the browser
    header('Content-Type: application/pdf');
    if ($displayMode) {
        // For display - open in browser window
        header('Content-Disposition: inline; filename="' . $pdfResult['filename'] . '"');
    } else {
        // For download - force download
        header('Content-Disposition: attachment; filename="' . $pdfResult['filename'] . '"');
    }
    header('Cache-Control: max-age=0');
    readfile($pdfResult['filepath']);

    // Clean up temporary file after sending
    unlink($pdfResult['filepath']);
    exit;
    
} catch (Exception $e) {
    error_log('Error generating PDF: ' . $e->getMessage());
    
    // Only send JSON response if headers not sent
    if (!headers_sent()) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'Error generating PDF: ' . $e->getMessage()]);
    }
}
