<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';
require_once INCLUDES_PATH . '/plot_snapshot.php';
require_once INCLUDES_PATH . '/functions.php';
require VENDOR_PATH . '/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

$userObj = new User();
if (!$userObj->isLoggedIn()) {
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Unauthorized']);
  exit;
}

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

  if (empty($data['recipient']) || !filter_var($data['recipient'], FILTER_VALIDATE_EMAIL)) {
    throw new Exception('Valid recipient email is required');
  }

  $db = Database::getInstance();

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

  $plotId = isset($data['plotId']) ? (int)$data['plotId'] : null;
  $plotTitle = $data['title'] ?? 'Stage Plot';

  $tempDir = PRIVATE_PATH . '/temp';
  if (!is_dir($tempDir)) {
    mkdir($tempDir, 0755, true);
  }

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

    if (!$snapshotPath) {
      $elements = $data['elements'];

      $venueId = null;
      $userVenueId = null;
      if (!empty($data['venueId'])) {
        if (strpos($data['venueId'], 'user_') === 0) {
          $userVenueId = (int)str_replace('user_', '', $data['venueId']);
        } else {
          $venueId = (int)$data['venueId'];
        }
      }

      $snapshotFilename = generatePlotSnapshot($plotId, $elements, $venueId, $userVenueId);
      if ($snapshotFilename) {
        $snapshotPath = PRIVATE_PATH . '/snapshots/' . $snapshotFilename;
      }
    }
  }

  $pdfResult = generatePlotPDF($data, $db, $tempDir, false);
  $pdfAttachmentPath = $pdfResult['filepath'];

  $subject = "Stage Plot: $plotTitle";

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

  if (!empty($data['message'])) {
    $htmlContent .= "<div class='message'>" . nl2br(htmlspecialchars($data['message'])) . "</div>";
  }

  if (!empty($data['venue'])) {
    $htmlContent .= "<p><strong>Venue:</strong> " . htmlspecialchars($data['venue']) . "</p>";

    if (empty($data['address']) || $data['address'] === 'N/A') {
      $venueId = null;
      $userVenueId = null;

      if (!empty($data['venueId'])) {
        if (strpos($data['venueId'], 'user_') === 0) {
          $userVenueId = (int)str_replace('user_', '', $data['venueId']);

          $venueInfo = $db->fetchOne(
            "
                        SELECT
                            CONCAT_WS(', ',
                                venue_street,
                                venue_city,
                                (SELECT state_abbr FROM states WHERE state_id = venue_state_id),
                                venue_zip
                            ) as address
                        FROM user_venues
                        WHERE user_venue_id = ?",
            [$userVenueId]
          );
        } else {
          $venueId = (int)$data['venueId'];

          $venueInfo = $db->fetchOne(
            "
                        SELECT
                            CONCAT_WS(', ',
                                venue_street,
                                venue_city,
                                (SELECT state_abbr FROM states WHERE state_id = venue_state_id),
                                venue_zip
                            ) as address
                        FROM venues
                        WHERE venue_id = ?",
            [$venueId]
          );
        }

        if ($venueInfo && !empty($venueInfo['address'])) {
          $data['address'] = $venueInfo['address'];
        }
      }
    }

    if (!empty($data['address']) && $data['address'] !== 'N/A') {
      $htmlContent .= "<p><strong>Address:</strong> " . htmlspecialchars($data['address']) . "</p>";
    }
  }

  if (!empty($data['eventStart'])) {
    $dateText = date('F j, Y', strtotime($data['eventStart']));
    if (!empty($data['eventEnd']) && $data['eventEnd'] !== $data['eventStart']) {
      $dateText .= ' - ' . date('F j, Y', strtotime($data['eventEnd']));
    }
    $htmlContent .= "<p><strong>Date:</strong> $dateText</p>";
  }

  $htmlContent .= "
            <div class='footer'>
                <p>This email was sent via StageWrite, the stage plot management tool for event production.</p>
                <p>A PDF version of this stage plot is attached to this email.</p>
            </div>
        </div>
    </body>
    </html>";

  $textContent = "Stage Plot: $plotTitle\n\n";
  $textContent .= "$senderName has shared a stage plot with you from StageWrite.\n\n";

  if (!empty($data['message'])) {
    $textContent .= "Message:\n" . $data['message'] . "\n\n";
  }

  if (!empty($data['venue'])) {
    $textContent .= "Venue: " . $data['venue'] . "\n";

    if (!empty($data['address']) && $data['address'] !== 'N/A') {
      $textContent .= "Address: " . $data['address'] . "\n";
    }
  }

  if (!empty($data['eventStart'])) {
    $dateText = date('F j, Y', strtotime($data['eventStart']));
    if (!empty($data['eventEnd']) && $data['eventEnd'] !== $data['eventStart']) {
      $dateText .= ' - ' . date('F j, Y', strtotime($data['eventEnd']));
    }
    $textContent .= "Date: $dateText\n\n";
  }

  $recipient = $data['recipient'];
  error_log('About to send email to: ' . $recipient);

  try {
    $mail = new PHPMailer(true);


    $mail->isSMTP();
    $mail->Host       = 'mail.stagewrite.app';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'noreply@stagewrite.app';
    $mail->Password   = 'fP2QF4b_p[R2';

    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = 465;

    $mail->Timeout = 60;

    $mail->setFrom('noreply@stagewrite.app', $senderName . ' via StageWrite');

    $mail->addReplyTo($senderEmail, $senderName);

    $mail->addAddress($recipient);

    $mail->isHTML(true);
    $mail->Subject = "Stage Plot from $senderName: $plotTitle";
    $mail->Body    = $htmlContent;
    $mail->AltBody = $textContent;

    if (isset($snapshotPath) && file_exists($snapshotPath)) {
      $mail->addAttachment($snapshotPath, 'stage_plot.png');
    }

    if (file_exists($pdfAttachmentPath)) {
      $mail->addAttachment($pdfAttachmentPath, $pdfResult['filename']);
    }

    $mail->send();
    $mailSent = true;
    error_log('Email sent successfully to: ' . $recipient);
  } catch (Exception $e) {
    $mailSent = false;
    throw new Exception('Mail sending failed: ' . $mail->ErrorInfo);
  }

  if (file_exists($pdfAttachmentPath)) {
    unlink($pdfAttachmentPath);
  }

  if ($mailSent) {
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
