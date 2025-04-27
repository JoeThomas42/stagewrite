<?php
/**
 * Database check script for user_tokens table
 * Place this file in your public folder and access it through the browser
 * Example: https://your-domain.com/check_user_tokens.php
 */

// Ensure content is sent as plain text for easy reading
header('Content-Type: text/plain');

echo "CHECKING USER TOKENS TABLE\n";
echo "=========================\n\n";

try {
    // Include bootstrap to get database connection
    require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';
    
    // Get database instance
    $db = Database::getInstance();
    $connection = $db->getConnection();
    
    echo "Database connection successful!\n\n";
    
    // Check if user_tokens table exists
    $tables = $connection->query("SHOW TABLES LIKE 'user_tokens'")->fetchAll();
    
    if (count($tables) === 0) {
        echo "ERROR: The 'user_tokens' table does not exist!\n";
        echo "Creating table...\n";
        
        // Create the table
        $createTableSQL = "
            CREATE TABLE `user_tokens` (
                `token_id` INT UNSIGNED NOT NULL AUTO_INCREMENT,
                `user_id` VARCHAR(36) NOT NULL,
                `token` VARCHAR(255) NOT NULL,
                `expires_at` DATETIME NOT NULL,
                `created_at` DATETIME NOT NULL,
                PRIMARY KEY (`token_id`),
                UNIQUE INDEX `token_UNIQUE` (`token`),
                INDEX `user_id_idx` (`user_id`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        ";
        
        $connection->exec($createTableSQL);
        echo "Table 'user_tokens' created successfully!\n\n";
    } else {
        echo "Table 'user_tokens' exists.\n\n";
    }
    
    // Check table structure
    echo "Checking table structure...\n";
    $columns = $connection->query("SHOW COLUMNS FROM user_tokens")->fetchAll(PDO::FETCH_COLUMN);
    
    $requiredColumns = ['token_id', 'user_id', 'token', 'expires_at', 'created_at'];
    $missingColumns = array_diff($requiredColumns, $columns);
    
    if (!empty($missingColumns)) {
        echo "WARNING: The following columns are missing: " . implode(', ', $missingColumns) . "\n";
    } else {
        echo "All required columns exist.\n";
    }
    
    // Check if there are any existing tokens
    $tokenCount = $connection->query("SELECT COUNT(*) FROM user_tokens")->fetchColumn();
    echo "\nCurrent token count in database: " . $tokenCount . "\n";
    
    if ($tokenCount > 0) {
        echo "Active tokens:\n";
        $activeTokens = $connection->query("
            SELECT user_id, LEFT(token, 10) as token_preview, expires_at 
            FROM user_tokens 
            WHERE expires_at > NOW()
            LIMIT 5
        ")->fetchAll();
        
        foreach ($activeTokens as $token) {
            echo "- User ID: {$token['user_id']}, Token: {$token['token_preview']}..., Expires: {$token['expires_at']}\n";
        }
        
        if (count($activeTokens) < $tokenCount) {
            echo "(Showing first 5 tokens only)\n";
        }
    }
    
    // Check cookie settings
    echo "\nCookie settings:\n";
    $cookieParams = session_get_cookie_params();
    echo "- Path: " . $cookieParams['path'] . "\n";
    echo "- Domain: " . ($cookieParams['domain'] ?: 'Not set (using current domain)') . "\n";
    echo "- Secure only: " . ($cookieParams['secure'] ? 'Yes' : 'No') . "\n";
    echo "- HttpOnly: " . ($cookieParams['httponly'] ? 'Yes' : 'No') . "\n";
    if (isset($cookieParams['samesite'])) {
        echo "- SameSite: " . $cookieParams['samesite'] . "\n";
    }
    
    // Check if site is using HTTPS
    echo "\nHTTPS status: " . (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off' ? 'Enabled' : 'Disabled') . "\n";
    
    echo "\nCheck completed successfully.\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
}
