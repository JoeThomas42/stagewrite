<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';
require_once INCLUDES_PATH . '/plot_snapshot.php';
require_once INCLUDES_PATH . '/functions.php';
require VENDOR_PATH . '/autoload.php';
    
// Import PHPMailer classes into the global namespace
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

// Ensure user is logged in
$userObj = new User();
if (!$userObj->isLoggedIn()) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

// Get JSON data
$jsonData = file_get_contents('php://input');
error_log('Email request received: ' . $jsonData);
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
    
    // Get or generate the snapshot for email
    $snapshotPath = null;
    if ($plotId) {
        $snapshotInfo = $db->fetchOne(
            "SELECT snapshot_filename FROM saved_plots WHERE plot_id = ?",
            [$plotId]
        );
        
        if ($snapshotInfo && !empty($snapshotInfo['snapshot_filename'])) {
            $snapshotPath = PRIVATE_PATH . '/snapshots/' . $snapshotInfo['snapshot_filename'];
            if (!file_exists($snapshotPath)) {
                $snapshotPath = null;
            }
        }
        
        // If no existing snapshot, generate one
        if (!$snapshotPath) {
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
    
    // Generate the PDF
    $pdfResult = generatePlotPDF($data, $db, $tempDir, false);
    $pdfAttachmentPath = $pdfResult['filepath'];
    
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
            .sender { font-weight: bold; color: #4a6da7; }
            .message { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
            .footer { margin-top: 30px; font-size: 12px; color: #999; }
        </style>
    </head>
    <body>
        <div class='container'>
            <h1>Stage Plot: $plotTitle</h1>
            <p><span class='sender'>$senderName</span> has shared a stage plot with you from StageWrite.</p>";
    
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
    
    // Close the HTML
    $htmlContent .= "
            <div class='footer'>
                <p>This email was sent via StageWrite, the stage plot management tool for event production.</p>
                <p>A PDF version of this stage plot is attached to this email.</p>
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
    
    // Send the email
    $recipient = $data['recipient'];
    error_log('About to send email to: ' . $recipient);
    
    try {
        // Create a new PHPMailer instance
        $mail = new PHPMailer(true);

        // Debug settings
        // $mail->SMTPDebug = SMTP::DEBUG_SERVER;
        
        // Server settings
        $mail->isSMTP();
        $mail->Host       = 'mail.stagewrite.app';
        $mail->SMTPAuth   = true;
        $mail->Username   = 'noreply@stagewrite.app';
        $mail->Password   = 'fP2QF4b_p[R2';
        
        // $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS; // For port 587
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;     // For port 465
        $mail->Port       = 465;
        
        // Increase timeout for slow SMTP servers
        $mail->Timeout = 60;
        
        // Set "from" as your system address, but include the user's name
        $mail->setFrom('noreply@stagewrite.app', $senderName . ' via StageWrite');
        
        // Set reply-to as the user's actual email address
        $mail->addReplyTo($senderEmail, $senderName);
        
        // Add recipient
        $mail->addAddress($recipient);
        
        // Content
        $mail->isHTML(true);
        $mail->Subject = "Stage Plot from $senderName: $plotTitle";
        $mail->Body    = $htmlContent;
        $mail->AltBody = $textContent;
        
        // Attachments
        if (isset($snapshotPath) && file_exists($snapshotPath)) {
            $mail->addAttachment($snapshotPath, 'stage_plot.png');
        }
        
        if (file_exists($pdfAttachmentPath)) {
            $mail->addAttachment($pdfAttachmentPath, $pdfResult['filename']);
        }
        
        // Send the email
        $mail->send();
        $mailSent = true;
        error_log('Email sent successfully to: ' . $recipient);
    } catch (Exception $e) {
        $mailSent = false;
        throw new Exception('Mail sending failed: ' . $mail->ErrorInfo);
    }
    
    // Clean up temporary files
    if (file_exists($pdfAttachmentPath)) {
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
