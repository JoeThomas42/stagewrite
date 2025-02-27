<?php

// defined('APP_RUNNING') or die('Direct access is not allowed.');
// mb_internal_encoding('UTF-8');

/**
 * Safe string length function for multibyte strings
 * 
 * @param string $string Input string
 * @return int Length of the string
 */
function safe_strlen($string) {
    return mb_strlen($string, 'UTF-8');
}

/**
 * Enhanced HTML special characters encoding
 * 
 * @param string $string Input string
 * @return string Encoded string
 */
function safe_htmlspecialchars($string) {
    return htmlspecialchars($string, ENT_QUOTES | ENT_SUBSTITUTE, 'UTF-8', true);
}

/**
 * Create a secure database connection
 * 
 * @return mysqli Database connection object
 */
function create_db_connection() {
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    if ($conn->connect_error) {
        error_log("Database Connection Failed: " . $conn->connect_error);
        die("Connection failed: " . $conn->connect_error);
    }

    $conn->set_charset(DB_CHARSET);

    return $conn;
}

/**
 * Safely sanitize and validate sort column
 * 
 * @param mysqli $conn Database connection
 * @param string $table Table name
 * @param string $requested_column Requested sort column
 * @param string $default_column Default sort column
 * @return string Validated sort column
 */
function validate_sort_column(mysqli $conn, string $table, string $requested_column, string $default_column) {
    $clean_column = preg_replace('/[^a-zA-Z0-9_]/', '', $requested_column);
    
    $columns = $conn->query("SHOW COLUMNS FROM `" . $conn->real_escape_string($table) . "`");
    $valid_columns = [];
    while ($column = $columns->fetch_assoc()) {
        $valid_columns[] = $column['Field'];
    }
    
    return in_array($clean_column, $valid_columns) ? $clean_column : $default_column;
}

/**
 * Get total number of rows in a table
 * 
 * @param mysqli $conn Database connection
 * @param string $table Table name
 * @return int Total number of rows
 */
function get_total_rows(mysqli $conn, string $table) {
    $count_query = $conn->query("SELECT COUNT(*) as total FROM `" . $conn->real_escape_string($table) . "`");
    return $count_query->fetch_assoc()['total'];
}

/**
 * Format event date range for display
 * 
 * @param string $startDate Event start date
 * @param string $endDate Event end date
 * @return string Formatted date string
 */
function formatEventDate($startDate, $endDate) {
    $start = new DateTime($startDate);
    $end = new DateTime($endDate);
    
    // Same day event
    if ($start->format('Y-m-d') === $end->format('Y-m-d')) {
        return $start->format('F j, Y');
    }
    
    // Same month event
    if ($start->format('Y-m') === $end->format('Y-m')) {
        return $start->format('F j') . ' - ' . $end->format('j, Y');
    }
    
    // Same year event
    if ($start->format('Y') === $end->format('Y')) {
        return $start->format('F j') . ' - ' . $end->format('F j, Y');
    }
    
    // Different year event
    return $start->format('F j, Y') . ' - ' . $end->format('F j, Y');
}
