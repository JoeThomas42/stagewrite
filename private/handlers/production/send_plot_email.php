<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';
require_once INCLUDES_PATH . '/plot_snapshot.php';

// Ensure user is logged in
$userObj = new User();
if (!$userObj->isLoggedIn()) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

// Get JSON data
$jsonData = file_get_contents('php://input');
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
    
    // Validate required fields
    if (empty($data['recipient']) || !filter_var($data['recipient'], FILTER_VALIDATE_EMAIL)) {
        throw new Exception('Valid recipient email is required');
    }
    
    // Database connection
    $db = Database::getInstance();
    
    // Get sender information
    $sender = $db->fetchOne(
        "SELECT email, CONCAT(first_name, ' ', last_name) as full_name 
         FROM users WHERE user_id = ?", 
        [$_SESSION['user_id']]
    );
    
    if (!$sender) {
        throw new Exception('Unable to retrieve sender information');
    }
    
    $senderEmail = $sender['email'];
    $senderName = $sender['full_name'];
    
    // Get plot information
    $plotId = isset($data['plotId']) ? (int)$data['plotId'] : null;
    $plotTitle = $data['title'] ?? 'Stage Plot';
    
    // Create temporary directory if needed
    $tempDir = PRIVATE_PATH . '/temp';
    if (!is_dir($tempDir)) {
        mkdir($tempDir, 0755, true);
    }
    
    // Generate a PDF attachment
    $filename = 'stage_plot_' . preg_replace('/[^a-z0-9_-]/i', '_', $plotTitle) . '.pdf';
    $filepath = $tempDir . '/' . $filename;
    $pdf->Output($filepath, 'F');
    
    /*
    // PLACEHOLDER FOR PDF GENERATION
    $pdfAttachmentPath = null;
    */
    
    // If we have a plotId, get the existing snapshot instead of generating a new one
    if ($plotId) {
        // Get existing snapshot filename from database
        $snapshotInfo = $db->fetchOne(
            "SELECT snapshot_filename FROM saved_plots WHERE plot_id = ?",
            [$plotId]
        );
        
        if ($snapshotInfo && !empty($snapshotInfo['snapshot_filename'])) {
            $snapshotPath = PRIVATE_PATH . '/snapshots/' . $snapshotInfo['snapshot_filename'];
            if (!file_exists($snapshotPath)) {
                // Fallback to generating a new snapshot if file doesn't exist
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
                
                // Generate the snapshot
                $snapshotFilename = generatePlotSnapshot($plotId, $elements, $venueId, $userVenueId);
                if ($snapshotFilename) {
                    $snapshotPath = PRIVATE_PATH . '/snapshots/' . $snapshotFilename;
                }
            }
        } else {
            // Fallback to generating a new snapshot if no filename in database
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
            
            // Generate the snapshot
            $snapshotFilename = generatePlotSnapshot($plotId, $elements, $venueId, $userVenueId);
            if ($snapshotFilename) {
                $snapshotPath = PRIVATE_PATH . '/snapshots/' . $snapshotFilename;
            }
        }
    }
    
    // Prepare email content
    $subject = "Stage Plot: $plotTitle";
    
    // Build email HTML content
    $htmlContent = "
    <html>
    <head>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            h1 { color: #4a6da7; }
            .message { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
            .footer { margin-top: 30px; font-size: 12px; color: #999; }
        </style>
    </head>
    <body>
        <div class='container'>
            <h1>Stage Plot: $plotTitle</h1>
            <p>$senderName has shared a stage plot with you from StageWrite.</p>";
    
    // Add custom message if provided
    if (!empty($data['message'])) {
        $htmlContent .= "<div class='message'>" . nl2br(htmlspecialchars($data['message'])) . "</div>";
    }
    
    // Add venue and date information if available
    if (!empty($data['venue'])) {
        $htmlContent .= "<p><strong>Venue:</strong> " . htmlspecialchars($data['venue']) . "</p>";
    }
    
    if (!empty($data['eventStart'])) {
        $dateText = date('F j, Y', strtotime($data['eventStart']));
        if (!empty($data['eventEnd']) && $data['eventEnd'] !== $data['eventStart']) {
            $dateText .= ' - ' . date('F j, Y', strtotime($data['eventEnd']));
        }
        $htmlContent .= "<p><strong>Date:</strong> $dateText</p>";
    }
    
    // Add input list if available
    if (!empty($data['inputs'])) {
        $htmlContent .= "
        <h2>Input List</h2>
        <table border='1' cellpadding='5' cellspacing='0' style='border-collapse: collapse; width: 100%;'>
            <tr>
                <th style='background-color: #f0f0f0;'>Input #</th>
                <th style='background-color: #f0f0f0;'>Description</th>
            </tr>";
        
        foreach ($data['inputs'] as $input) {
            $inputNumber = $input['number'] ?? ($input['input_number'] ?? '');
            $inputLabel = $input['label'] ?? ($input['input_name'] ?? '');
            
            $htmlContent .= "
            <tr>
                <td style='text-align: center;'>$inputNumber</td>
                <td>$inputLabel</td>
            </tr>";
        }
        
        $htmlContent .= "</table>";
    }
    
    // Close the HTML
    $htmlContent .= "
            <div class='footer'>
                <p>This email was sent via StageWrite, the stage plot management tool for event production.</p>
            </div>
        </div>
    </body>
    </html>";
    
    // Plain text alternative
    $textContent = "Stage Plot: $plotTitle\n\n";
    $textContent .= "$senderName has shared a stage plot with you from StageWrite.\n\n";
    
    if (!empty($data['message'])) {
        $textContent .= "Message:\n" . $data['message'] . "\n\n";
    }
    
    if (!empty($data['venue'])) {
        $textContent .= "Venue: " . $data['venue'] . "\n";
    }
    
    if (!empty($data['eventStart'])) {
        $dateText = date('F j, Y', strtotime($data['eventStart']));
        if (!empty($data['eventEnd']) && $data['eventEnd'] !== $data['eventStart']) {
            $dateText .= ' - ' . date('F j, Y', strtotime($data['eventEnd']));
        }
        $textContent .= "Date: $dateText\n\n";
    }
    
    if (!empty($data['inputs'])) {
        $textContent .= "INPUT LIST:\n";
        $textContent .= "----------\n";
        
        foreach ($data['inputs'] as $input) {
            $inputNumber = $input['number'] ?? ($input['input_number'] ?? '');
            $inputLabel = $input['label'] ?? ($input['input_name'] ?? '');
            
            $textContent .= "Input #$inputNumber: $inputLabel\n";
        }
    }
    
    // Email headers
    $headers = "From: StageWrite <$senderEmail>\r\n";
    $headers .= "Reply-To: $senderEmail\r\n";
    $headers .= "MIME-Version: 1.0\r\n";
    
    // If we have attachments, create a multipart message
    if (isset($snapshotPath) || isset($pdfAttachmentPath)) {
        // Generate a boundary string
        $boundary = md5(time());
        
        $headers .= "Content-Type: multipart/mixed; boundary=\"$boundary\"\r\n";
        
        // Email body for multipart messages
        $body = "--$boundary\r\n";
        $body .= "Content-Type: multipart/alternative; boundary=\"alt-$boundary\"\r\n\r\n";
        
        // Plain text part
        $body .= "--alt-$boundary\r\n";
        $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $body .= $textContent . "\r\n\r\n";
        
        // HTML part
        $body .= "--alt-$boundary\r\n";
        $body .= "Content-Type: text/html; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $body .= $htmlContent . "\r\n\r\n";
        
        // End of alternative part
        $body .= "--alt-$boundary--\r\n\r\n";
        
        // Attach snapshot image if available
        if (isset($snapshotPath)) {
            $imgData = file_get_contents($snapshotPath);
            $imgData = chunk_split(base64_encode($imgData));
            
            $body .= "--$boundary\r\n";
            $body .= "Content-Type: image/png; name=\"stage_plot.png\"\r\n";
            $body .= "Content-Disposition: attachment; filename=\"stage_plot.png\"\r\n";
            $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
            $body .= $imgData . "\r\n\r\n";
        }
        
        // Attach PDF if available
        if (isset($pdfAttachmentPath)) {
            $pdfData = file_get_contents($pdfAttachmentPath);
            $pdfData = chunk_split(base64_encode($pdfData));
            
            $body .= "--$boundary\r\n";
            $body .= "Content-Type: application/pdf; name=\"stage_plot.pdf\"\r\n";
            $body .= "Content-Disposition: attachment; filename=\"stage_plot.pdf\"\r\n";
            $body .= "Content-Transfer-Encoding: base64\r\n\r\n";
            $body .= $pdfData . "\r\n\r\n";
        }
        
        // End of the message
        $body .= "--$boundary--";
    } else {
        // Simple HTML email without attachments
        $headers .= "Content-Type: multipart/alternative; boundary=\"alt-boundary\"\r\n";
        
        $body = "--alt-boundary\r\n";
        $body .= "Content-Type: text/plain; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $body .= $textContent . "\r\n\r\n";
        
        $body .= "--alt-boundary\r\n";
        $body .= "Content-Type: text/html; charset=UTF-8\r\n";
        $body .= "Content-Transfer-Encoding: 8bit\r\n\r\n";
        $body .= $htmlContent . "\r\n\r\n";
        
        $body .= "--alt-boundary--";
    }
    
    // Send the email
    $recipient = $data['recipient'];
    
    // IMPORTANT: In production, you would use a proper email library like PHPMailer
    // This basic mail() function may not work in all environments
    $mailSent = mail($recipient, $subject, $body, $headers);
    
    // Clean up temporary files if they exist
    if (isset($pdfAttachmentPath) && file_exists($pdfAttachmentPath)) {
        unlink($pdfAttachmentPath);
    }
    
    if ($mailSent) {
        // Log the email
        $db->query(
            "INSERT INTO email_log (user_id, recipient_email, subject, plot_id, sent_at)
             VALUES (?, ?, ?, ?, NOW())",
            [$_SESSION['user_id'], $recipient, $subject, $plotId]
        );
        
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'message' => 'Stage plot sent successfully']);
    } else {
        throw new Exception('Failed to send email');
    }
    
} catch (Exception $e) {
    error_log('Error sending plot email: ' . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => $e->getMessage()]);
}
