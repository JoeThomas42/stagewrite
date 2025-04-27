<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';
require VENDOR_PATH . '/autoload.php';

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\SMTP;
use PHPMailer\PHPMailer\Exception;

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
  http_response_code(405);
  echo json_encode(['success' => false, 'error' => 'Method not allowed']);
  exit;
}

$email = isset($_POST['email']) ? trim($_POST['email']) : '';

if (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
  echo json_encode(['success' => false, 'error' => 'Please provide a valid email address']);
  exit;
}

$db = Database::getInstance();

try {
  $user = $db->fetchOne(
    "SELECT user_id, first_name, last_name, email FROM users WHERE email = ? AND is_active = 1",
    [$email]
  );

  if (!$user) {
    echo json_encode(['success' => true]);
    exit;
  }

  $token = bin2hex(random_bytes(32));

  $expires = date('Y-m-d H:i:s', time() + 24 * 60 * 60);

  $db->query(
    "DELETE FROM password_reset_tokens WHERE user_id = ?",
    [$user['user_id']]
  );

  $db->query(
    "INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)",
    [$user['user_id'], $token, $expires]
  );

  $resetLink = sprintf(
    "%s://%s/reset_password.php?token=%s",
    isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] != 'off' ? 'https' : 'http',
    $_SERVER['SERVER_NAME'],
    $token
  );

  $mail = new PHPMailer(true);

  try {
    $mail->isSMTP();
    $mail->Host       = 'mail.stagewrite.app';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'noreply@stagewrite.app';
    $mail->Password   = 'fP2QF4b_p[R2';
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    $mail->Port       = 465;
    $mail->Timeout    = 60;

    $mail->setFrom('noreply@stagewrite.app', 'StageWrite');
    $mail->addAddress($user['email'], $user['first_name'] . ' ' . $user['last_name']);

    $mail->isHTML(true);
    $mail->Subject = 'Reset Your StageWrite Password';

    $htmlContent = "
        <html>
        <head>
            <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                h1 { color: #4a6da7; }
                .message { margin: 20px 0; padding: 15px; background-color: #f5f5f5; border-radius: 5px; }
                .button { display: inline-block; padding: 10px 20px; background-color: #4a6da7; color: #ffffff;
                          text-decoration: none; border-radius: 5px; }
                .footer { margin-top: 30px; font-size: 12px; color: #999; }
            </style>
        </head>
        <body>
            <div class='container'>
                <h1>Reset Your StageWrite Password</h1>
                <p>Hello " . htmlspecialchars($user['first_name']) . ",</p>
                <p>We received a request to reset the password for your StageWrite account. If you didn't make this request, you can safely ignore this email.</p>
                <div class='message'>
                    <p>To reset your password, click the link below:</p>
                    <p><a href='" . $resetLink . "' class='button'>Reset My Password</a></p>
                    <p>Or copy and paste this URL into your browser:</p>
                    <p>" . $resetLink . "</p>
                    <p>This link will expire in 24 hours.</p>
                </div>
                <div class='footer'>
                    <p>This email was sent by StageWrite. If you have any questions, please contact support.</p>
                </div>
            </div>
        </body>
        </html>";

    $textContent = "Reset Your StageWrite Password\n\n"
      . "Hello " . $user['first_name'] . ",\n\n"
      . "We received a request to reset the password for your StageWrite account. "
      . "If you didn't make this request, you can safely ignore this email.\n\n"
      . "To reset your password, click the link below:\n"
      . $resetLink . "\n\n"
      . "This link will expire in 24 hours.\n\n"
      . "This email was sent by StageWrite. If you have any questions, please contact support.";

    $mail->Body    = $htmlContent;
    $mail->AltBody = $textContent;

    $mail->send();

    echo json_encode(['success' => true]);
  } catch (Exception $e) {
    error_log('Error sending password reset email: ' . $mail->ErrorInfo);
    echo json_encode(['success' => false, 'error' => 'Failed to send email. Please try again later.']);
  }
} catch (Exception $e) {
  error_log('Error in password reset request: ' . $e->getMessage());
  echo json_encode(['success' => false, 'error' => 'An unexpected error occurred. Please try again later.']);
}
