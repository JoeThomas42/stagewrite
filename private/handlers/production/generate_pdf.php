<?php

// Debugging - log incoming data
error_log('PDF Request Data: ' . print_r($data, true));

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';
require_once INCLUDES_PATH . '/plot_snapshot.php';

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
    // Load TCPDF library
    require_once VENDOR_PATH . '/tecnickcom/tcpdf/tcpdf.php';
    
    $data = json_decode($jsonData, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }
    
    // Database connection
    $db = Database::getInstance();
    
    // Get current plot ID if available
    $plotId = isset($data['plotId']) ? (int)$data['plotId'] : null;
    
    // Create temporary directory if needed
    $tempDir = PRIVATE_PATH . '/temp';
    if (!is_dir($tempDir)) {
        mkdir($tempDir, 0755, true);
    }
    
    // Create new PDF document
    $pdf = new TCPDF('P', 'mm', 'LETTER', true, 'UTF-8', false);
    
    // Set document information
    $pdf->SetCreator('StageWrite');
    $pdf->SetAuthor('StageWrite User');
    $pdf->SetTitle($data['title'] ? $data['title'] : 'Stage Plot');
    $pdf->SetSubject('Stage Plot');
    
    // Remove default header/footer
    $pdf->setPrintHeader(false);
    $pdf->setPrintFooter(false);
    
    // Set margins
    $pdf->SetMargins(15, 15, 15);
    
    // Set auto page breaks
    $pdf->SetAutoPageBreak(TRUE, 15);
    
    // ---------------------------------------------------------
    
    // Add a page for the stage plot
    $pdf->AddPage();
    
    // Title
    $pdf->SetFont('helvetica', 'B', 16);
    $pdf->Cell(0, 10, $data['title'] ? $data['title'] : 'Stage Plot', 0, 1, 'C');
    
    // Add date range if available
    if (!empty($data['eventStart'])) {
        $pdf->SetFont('helvetica', '', 12);
        $dateText = date('F j, Y', strtotime($data['eventStart']));
        if (!empty($data['eventEnd']) && $data['eventEnd'] !== $data['eventStart']) {
            $dateText .= ' - ' . date('F j, Y', strtotime($data['eventEnd']));
        }
        $pdf->Cell(0, 7, $dateText, 0, 1, 'C');
    }
    
    // Add venue information
    if (!empty($data['venue'])) {
        $pdf->SetFont('helvetica', 'B', 12);
        $pdf->Cell(0, 10, 'Venue: ' . $data['venue'], 0, 1, 'C');
        $pdf->Ln(2);
    }
    
    // Add stage plot image
    if ($plotId) {
        // Get existing snapshot filename from database instead of generating a new one
        $snapshotInfo = $db->fetchOne(
            "SELECT snapshot_filename FROM saved_plots WHERE plot_id = ?",
            [$plotId]
        );
        
        if ($snapshotInfo && !empty($snapshotInfo['snapshot_filename'])) {
            $snapshotPath = PRIVATE_PATH . '/snapshots/' . $snapshotInfo['snapshot_filename'];
            
            if (file_exists($snapshotPath)) {
                // Add the image to the PDF
                $pdf->Image($snapshotPath, 15, null, 180, 0, '', '', '', false, 300);
            } else {
                $pdf->Cell(0, 10, 'Snapshot file not found', 0, 1, 'C');
                error_log('PDF snapshot file not found: ' . $snapshotPath);
            }
        } else {
            // Fall back to generating a snapshot if one doesn't exist
            $elements = $data['elements'];
            
            // Extract venue ID and user venue ID
            $venueId = null;
            $userVenueId = null;
            if (!empty($data['venueId'])) {
                if (strpos($data['venueId'], 'user_') === 0) {
                    $userVenueId = (int)str_replace('user_', '', $data['venueId']);
                } else {
                    $venueId = (int)$data['venueId'];
                }
            }
            
            // Generate the snapshot as a fallback
            $snapshotFilename = generatePlotSnapshot($plotId, $elements, $venueId, $userVenueId);
            if ($snapshotFilename) {
                $snapshotPath = PRIVATE_PATH . '/snapshots/' . $snapshotFilename;
                $pdf->Image($snapshotPath, 15, null, 180, 0, '', '', '', false, 300);
            } else {
                $pdf->Cell(0, 10, 'Unable to generate stage plot image', 0, 1, 'C');
            }
        }
    } else {
        $pdf->Cell(0, 10, 'No plot image available', 0, 1, 'C');
    }
    
    // Add a page for elements list
    $pdf->AddPage();
    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Stage Elements List', 0, 1, 'L');
    $pdf->Ln(5);
    
    // Elements table
    if (!empty($data['elements'])) {
        $pdf->SetFont('helvetica', 'B', 10);
        // Table header
        $pdf->Cell(10, 7, '#', 1, 0, 'C');
        $pdf->Cell(50, 7, 'Element', 1, 0, 'C');
        $pdf->Cell(30, 7, 'Label', 1, 0, 'C');
        $pdf->Cell(90, 7, 'Notes', 1, 1, 'C');
        
        // Group elements by name to handle duplicates
        $elementGroups = [];
        $elementCounts = [];
        
        // First pass: count occurrences of each element name
        foreach ($data['elements'] as $element) {
            $name = isset($element['elementName']) ? $element['elementName'] : (isset($element['element_name']) ? $element['element_name'] : null);
            if (!$name) continue;
            
            if (!isset($elementCounts[$name])) {
                $elementCounts[$name] = 0;
            }
            $elementCounts[$name]++;
        }
        
        // Table data
        $pdf->SetFont('helvetica', '', 10);
        $i = 1;
        $nameCounts = []; // Track how many times we've seen each name
        
        foreach ($data['elements'] as $element) {
            // Get proper element name
            $name = isset($element['elementName']) ? $element['elementName'] : (isset($element['element_name']) ? $element['element_name'] : 'Element ' . $i);
            
            // Add counter to name if there are multiple elements with this name
            if (isset($elementCounts[$name]) && $elementCounts[$name] > 1) {
                if (!isset($nameCounts[$name])) {
                    $nameCounts[$name] = 1;
                } else {
                    $nameCounts[$name]++;
                }
                $displayName = $name . ' ' . $nameCounts[$name];
            } else {
                $displayName = $name;
            }
            
            $pdf->Cell(10, 7, $i, 1, 0, 'C');
            $pdf->Cell(50, 7, $displayName, 1, 0, 'L');
            $pdf->Cell(30, 7, isset($element['label']) ? $element['label'] : '', 1, 0, 'L');
            
            // Handle multi-line notes
            $notes = isset($element['notes']) ? $element['notes'] : '';
            $pdf->MultiCell(90, 7, $notes, 1, 'L', false, 1);
            
            $i++;
        }
    } else {
        $pdf->Cell(0, 10, 'No elements placed', 0, 1, 'C');
    }
    
    // Add a page for input list
    $pdf->AddPage();
    $pdf->SetFont('helvetica', 'B', 14);
    $pdf->Cell(0, 10, 'Input List', 0, 1, 'L');
    $pdf->Ln(5);
    
    // Input list table
    if (!empty($data['inputs'])) {
        $pdf->SetFont('helvetica', 'B', 10);
        // Table header
        $pdf->Cell(20, 7, 'Input #', 1, 0, 'C');
        $pdf->Cell(160, 7, 'Description', 1, 1, 'C');
        
        // Table data
        $pdf->SetFont('helvetica', '', 10);
        foreach ($data['inputs'] as $input) {
            $inputNumber = isset($input['number']) ? $input['number'] : 
                          (isset($input['input_number']) ? $input['input_number'] : '');
            $inputLabel = isset($input['label']) ? $input['label'] : 
                        (isset($input['input_name']) ? $input['input_name'] : '');
            
            $pdf->Cell(20, 7, $inputNumber, 1, 0, 'C');
            $pdf->Cell(160, 7, $inputLabel, 1, 1, 'L');
        }
    } else {
        $pdf->Cell(0, 10, 'No inputs defined', 0, 1, 'C');
    }
    
    // Close and output PDF
    $filename = 'stage_plot_' . preg_replace('/[^a-z0-9_-]/i', '_', $data['title']) . '.pdf';
    $filepath = $tempDir . '/' . $filename;
    $pdf->Output($filepath, 'F');

    // Send the file to the browser
    header('Content-Type: application/pdf');
    header('Content-Disposition: attachment; filename="' . $filename . '"');
    header('Cache-Control: max-age=0');
    readfile($filepath);

    // Clean up temporary file after sending
    unlink($filepath);
    exit;
    
} catch (Exception $e) {
    error_log('Error generating PDF: ' . $e->getMessage());
    
    // Only send JSON response if headers not sent
    if (!headers_sent()) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'Error generating PDF: ' . $e->getMessage()]);
    }
}
