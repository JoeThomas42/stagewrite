<?php
/**
 * User authentication and management
 * @package StageWrite
 */
class User {
    private $db;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Check if user is logged in
     * 
     * @return bool True if user is logged in
     */
    public function isLoggedIn() {
        return isset($_SESSION['user_id']);
    }
    
    /**
     * Check if user has specific role
     * 
     * @param int|array $roles Role ID(s) to check
     * @return bool True if user has role
     */
    public function hasRole($roles) {
        if (!$this->isLoggedIn()) {
            return false;
        }
        
        if (is_array($roles)) {
            return in_array($_SESSION['role_id'], $roles);
        }
        
        return $_SESSION['role_id'] == $roles;
    }
    
    /**
     * Authenticate user
     * 
     * @param string $email User email
     * @param string $password User password
     * @return bool|array User data or false on failure
     */
    public function login($email, $password) {
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
            
            return $user;
        }
        
        return false;
    }
    
    /**
     * End user session
     */
    public function logout() {
        session_destroy();
        session_write_close();
        
        if (isset($_COOKIE[session_name()])) {
            setcookie(session_name(), '', time()-42000, '/');
        }
    }
    
    /**
     * Register a new user
     * 
     * @param array $userData User data
     * @return bool|string User ID or false on failure
     */
    public function register($userData) {
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
    public function toggleUserStatus($userId, $allowedRoles = []) {
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
    public function deleteUser($userId, $allowedRoles = []) {
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
    public function promoteToAdmin($userId) {
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
    public function demoteToMember($userId) {
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
