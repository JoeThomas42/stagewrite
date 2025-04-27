<?php

/**
 * User authentication and management
 * @package StageWrite
 */
class User
{
  private $db;
  
  // Change this constant to extend the expiration time (in days)
  private const REMEMBER_ME_DAYS = 60;

  /**
   * Constructor
   */
  public function __construct()
  {
    $this->db = Database::getInstance();

    // Check for remember me cookie on initialization
    $this->checkRememberMeCookie();
  }

  /**
   * Check if user is logged in
   * 
   * @return bool True if user is logged in
   */
  public function isLoggedIn()
  {
    return isset($_SESSION['user_id']);
  }

  /**
   * Check if user has specific role
   * 
   * @param int|array $roles Role ID(s) to check
   * @return bool True if user has role
   */
  public function hasRole($roles)
  {
    if (!$this->isLoggedIn()) {
      return false;
    }

    if (is_array($roles)) {
      return in_array($_SESSION['role_id'], $roles);
    }

    return $_SESSION['role_id'] == $roles;
  }

  /**
   * Check for and validate remember me cookie
   */
  private function checkRememberMeCookie()
  {
    if ($this->isLoggedIn() || !isset($_COOKIE['remember_token'])) {
      return;
    }

    $token = $_COOKIE['remember_token'];
    if (empty($token)) {
      return;
    }

    try {
      // First check if the token exists and is valid
      $sql = "SELECT * FROM user_tokens WHERE token = ? AND expires_at > NOW()";
      $tokenData = $this->db->fetchOne($sql, [$token]);
      
      if (!$tokenData) {
        // Token not found or expired, clear the cookie
        $this->clearRememberMeCookie();
        return;
      }
      
      // Then get user data separately
      $sql = "SELECT * FROM users WHERE user_id = ? AND is_active = 1";
      $user = $this->db->fetchOne($sql, [$tokenData['user_id']]);

      if ($user) {
        // Set session variables
        $_SESSION['user_id'] = $user['user_id'];
        $_SESSION['first_name'] = $user['first_name'];
        $_SESSION['last_name'] = $user['last_name'];
        $_SESSION['role_id'] = $user['role_id'];

        // Generate a new token for security (token rotation)
        $this->refreshRememberMeToken($user['user_id'], $token);
        
        // Add to debug log
        error_log('Successfully authenticated user via remember me token: ' . $user['user_id']);
      } else {
        // User not found or inactive, clear the cookie
        $this->clearRememberMeCookie();
        error_log('Remember me token found but user is inactive or not found: ' . $tokenData['user_id']);
      }
    } catch (Exception $e) {
      // Log error but don't show to user
      error_log('Remember me token validation error: ' . $e->getMessage());
      // Clear the problematic cookie
      $this->clearRememberMeCookie();
    }
  }

  /**
   * Generate new remember me token and set cookie
   * 
   * @param string $userId User ID
   * @return string Generated token
   */
  private function createRememberMeToken($userId)
  {
    // Generate a strong random token
    $token = bin2hex(random_bytes(32));

    // Calculate expiration seconds (days * 24 hours * 60 minutes * 60 seconds)
    $expirySeconds = self::REMEMBER_ME_DAYS * 24 * 60 * 60;
    
    // Set expiration date for the database
    $expiryDate = date('Y-m-d H:i:s', time() + $expirySeconds);

    try {
      // First delete any existing tokens for this user to prevent multiple tokens
      $this->db->query(
        "DELETE FROM user_tokens WHERE user_id = ?",
        [$userId]
      );
      
      // Store token in database
      $this->db->query(
        "INSERT INTO user_tokens (user_id, token, expires_at, created_at) 
         VALUES (?, ?, ?, NOW())",
        [$userId, $token, $expiryDate]
      );
      
      // Get cookie parameters
      $cookieParams = session_get_cookie_params();
      
      // Determine if we should use secure cookies (only on HTTPS)
      $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || 
                  $_SERVER['SERVER_PORT'] == 443;
      
      // Set the cookie domain - use the current domain if not specified
      $domain = $cookieParams['domain'] ?: '';
      
      // For PHP 7.3+
      if (PHP_VERSION_ID >= 70300) {
        setcookie(
          'remember_token',
          $token,
          [
            'expires' => time() + $expirySeconds, // Use the same expiry time
            'path' => '/',
            'domain' => $domain,
            'secure' => $isSecure,    // Secure cookie only on HTTPS
            'httponly' => true,       // HttpOnly
            'samesite' => 'Lax'       // SameSite policy
          ]
        );
      } else {
        // Fallback for older PHP versions
        setcookie(
          'remember_token',
          $token,
          time() + $expirySeconds, // Use the same expiry time
          '/',
          $domain,
          $isSecure,    // Secure cookie only on HTTPS
          true          // HttpOnly
        );
      }
      
      error_log('Created remember me token for user: ' . $userId . ', expires in ' . self::REMEMBER_ME_DAYS . ' days');
      return $token;
    } catch (Exception $e) {
      error_log('Error creating remember me token: ' . $e->getMessage());
      return null;
    }
  }

  /**
   * Refresh remember me token (token rotation)
   * 
   * @param string $userId User ID
   * @param string $oldToken Old token to invalidate
   * @return string New token
   */
  private function refreshRememberMeToken($userId, $oldToken)
  {
    try {
      // Delete the old token
      $this->db->query(
        "DELETE FROM user_tokens WHERE token = ?",
        [$oldToken]
      );

      // Create a new token
      return $this->createRememberMeToken($userId);
    } catch (Exception $e) {
      error_log('Error refreshing remember me token: ' . $e->getMessage());
      return null;
    }
  }

  /**
   * Remove remember me token
   */
  private function clearRememberMeCookie()
  {
    if (isset($_COOKIE['remember_token'])) {
      $token = $_COOKIE['remember_token'];

      try {
        // Remove from database
        $this->db->query(
          "DELETE FROM user_tokens WHERE token = ?",
          [$token]
        );
      } catch (Exception $e) {
        error_log('Error clearing remember token from database: ' . $e->getMessage());
      }

      // Get cookie parameters
      $cookieParams = session_get_cookie_params();
      $domain = $cookieParams['domain'] ?: '';
      $isSecure = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') || 
                  $_SERVER['SERVER_PORT'] == 443;

      // For PHP 7.3+
      if (PHP_VERSION_ID >= 70300) {
        setcookie(
          'remember_token',
          '',
          [
            'expires' => time() - 3600,
            'path' => '/',
            'domain' => $domain,
            'secure' => $isSecure,
            'httponly' => true,
            'samesite' => 'Lax'
          ]
        );
      } else {
        // Fallback for older PHP versions
        setcookie(
          'remember_token',
          '',
          time() - 3600,
          '/',
          $domain,
          $isSecure,
          true
        );
      }
      
      error_log('Cleared remember me cookie');
    }
  }

  /**
   * Authenticate user
   * 
   * @param string $email User email
   * @param string $password User password
   * @param bool $rememberMe Whether to create persistent login
   * @return bool|array User data or false on failure
   */
  public function login($email, $password, $rememberMe = false)
  {
    $stmt = $this->db->query(
      "SELECT * FROM users WHERE email = ? AND is_active = 1",
      [$email]
    );

    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
      // Set session variables
      $_SESSION['user_id'] = $user['user_id'];
      $_SESSION['first_name'] = $user['first_name'];
      $_SESSION['last_name'] = $user['last_name'];
      $_SESSION['role_id'] = $user['role_id'];

      // Create remember me cookie if requested
      if ($rememberMe) {
        $this->createRememberMeToken($user['user_id']);
        error_log('Stay logged in requested for user: ' . $user['user_id']);
      }

      return $user;
    }

    return false;
  }

  /**
   * End user session
   */
  public function logout()
  {
    // Clear the remember me token if exists
    $this->clearRememberMeCookie();

    session_destroy();
    session_write_close();

    if (isset($_COOKIE[session_name()])) {
      setcookie(session_name(), '', time() - 42000, '/');
    }
  }

  /**
   * Register a new user
   * 
   * @param array $userData User data
   * @return bool|string User ID or false on failure
   */
  public function register($userData)
  {
    // Check if email exists
    $exists = $this->db->fetchOne(
      "SELECT email FROM users WHERE email = ?",
      [$userData['email']]
    );

    if ($exists) {
      return false;
    }

    // Hash password
    $passwordHash = password_hash($userData['password'], PASSWORD_BCRYPT);

    // Insert user
    $this->db->query(
      "INSERT INTO users (user_id, first_name, last_name, email, password_hash, role_id, created_at, is_active) 
             VALUES (UUID(), ?, ?, ?, ?, ?, NOW(), 1)",
      [
        $userData['first_name'],
        $userData['last_name'],
        $userData['email'],
        $passwordHash,
        $userData['role_id'] ?? 1
      ]
    );

    // Get the new user
    $user = $this->db->fetchOne(
      "SELECT * FROM users WHERE email = ?",
      [$userData['email']]
    );

    if ($user) {
      return $user['user_id'];
    }

    return false;
  }

  /**
   * Toggle user active status
   * 
   * @param string $userId User ID to toggle
   * @param array $allowedRoles Roles allowed to be modified
   * @return array|false Result with new status or false on failure
   */
  public function toggleUserStatus($userId, $allowedRoles = [])
  {
    // Verify the user exists and is in allowed roles
    $user = $this->db->fetchOne(
      "SELECT role_id, is_active FROM users WHERE user_id = ?",
      [$userId]
    );

    if (!$user || (count($allowedRoles) > 0 && !in_array($user['role_id'], $allowedRoles))) {
      return false;
    }

    // Toggle the status
    $newStatus = $user['is_active'] ? 0 : 1;

    $success = $this->db->query(
      "UPDATE users SET is_active = ? WHERE user_id = ?",
      [$newStatus, $userId]
    );

    if ($success) {
      return [
        'success' => true,
        'user_id' => $userId,
        'is_active' => $newStatus,
        'status_text' => $newStatus ? 'Active' : 'Inactive'
      ];
    }

    return false;
  }

  /**
   * Delete a user
   * 
   * @param string $userId User ID to delete
   * @param array $allowedRoles Roles allowed to be deleted
   * @return bool Success or failure
   */
  public function deleteUser($userId, $allowedRoles = [])
  {
    if (empty($allowedRoles)) {
      return false;
    }

    // Build the query with allowed roles
    $inQuery = implode(',', array_fill(0, count($allowedRoles), '?'));
    $params = array_merge([$userId], $allowedRoles);

    $result = $this->db->query(
      "DELETE FROM users WHERE user_id = ? AND role_id IN ($inQuery)",
      $params
    );

    return $result->rowCount() > 0;
  }

  /**
   * Promote user to admin
   * 
   * @param string $userId User ID to promote
   * @return bool Success or failure
   */
  public function promoteToAdmin($userId)
  {
    // Verify the user is a member
    $user = $this->db->fetchOne(
      "SELECT role_id FROM users WHERE user_id = ?",
      [$userId]
    );

    if (!$user || $user['role_id'] != 1) {
      return false;
    }

    $result = $this->db->query(
      "UPDATE users SET role_id = 2 WHERE user_id = ?",
      [$userId]
    );

    return $result->rowCount() > 0;
  }

  /**
   * Demote admin to regular user
   * 
   * @param string $userId User ID to demote
   * @return bool Success or failure
   */
  public function demoteToMember($userId)
  {
    // Verify the user is an admin
    $user = $this->db->fetchOne(
      "SELECT role_id FROM users WHERE user_id = ?",
      [$userId]
    );

    if (!$user || $user['role_id'] != 2) {
      return false;
    }

    $result = $this->db->query(
      "UPDATE users SET role_id = 1 WHERE user_id = ?",
      [$userId]
    );

    return $result->rowCount() > 0;
  }
}
