<?php
/**
 * Utility functions
 * @package StageWrite
 */

/**
 * Sanitize and clean user input
 * 
 * @param string|array $input Input to sanitize
 * @param bool $trim Whether to trim whitespace
 * @return string|array Sanitized input
 */
function sanitizeInput($input, $trim = true) {
    if (is_array($input)) {
        return array_map(function($value) use ($trim) {
            return sanitizeInput($value, $trim);
        }, $input);
    }
    
    // Convert special characters to HTML entities to prevent XSS
    $clean = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');
    
    // Trim whitespace if requested
    if ($trim) {
        $clean = trim($clean);
    }
    
    return $clean;
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

/**
 * Generate sort icons for table columns
 * 
 * @param string $column Column name
 * @param string $currentSort Current sort column
 * @param string $currentOrder Current sort order
 * @param bool $explicitSort Whether sorting is explicit or default
 * @return string Icon HTML
 */
function getSortIcon($column, $currentSort, $currentOrder, $explicitSort = true) {
    if ($currentSort === $column && $explicitSort) {
        return $currentOrder === 'asc' ? '▲' : '▼';
    }
    // Show a subtle indicator for unsorted columns
    return '';
}

/**
 * Format empty values with a dash for display
 * 
 * @param string $value The value to check
 * @param bool $trim Whether to trim the value before checking
 * @return string The original value or a dash if empty
 */
function formatEmpty($value, $trim = true) {
    if ($trim) {
        $value = trim($value);
    }
    return (empty($value) && $value !== '0') ? '—' : $value;
}

/**
 * Generate pagination HTML
 * 
 * @param int $currentPage Current page number
 * @param int $totalPages Total number of pages
 * @param array $params Additional URL parameters to maintain
 * @param string $section Section identifier for multiple paginations on one page
 * @return string HTML for pagination controls
 */
function generatePagination($currentPage, $totalPages, $params = [], $section = '') {
    if ($totalPages <= 1) {
        return '';
    }
    
    $html = '<div class="pagination-container">';
    $html .= '<ul class="pagination">';
    
    // Add section parameter if provided
    if (!empty($section)) {
        $params['section'] = $section;
    }
    
    // First page link
    if ($currentPage > 1) {
        $params['page'] = 1;
        $queryString = http_build_query($params);
        $html .= '<li><a href="?' . $queryString . '" class="pagination-link" title="First page">&laquo;</a></li>';
    } else {
        $html .= '<li><span class="pagination-link disabled">&laquo;</span></li>';
    }
    
    // Previous page link
    if ($currentPage > 1) {
        $params['page'] = $currentPage - 1;
        $queryString = http_build_query($params);
        $html .= '<li><a href="?' . $queryString . '" class="pagination-link" title="Previous page">&lsaquo;</a></li>';
    } else {
        $html .= '<li><span class="pagination-link disabled">&lsaquo;</span></li>';
    }
    
    // Page numbers with ellipsis for long lists
    $range = 2;
    
    // Always show first page
    $params['page'] = 1;
    $queryString = http_build_query($params);
    $html .= '<li><a href="?' . $queryString . '" class="pagination-link ' . ($currentPage == 1 ? 'current' : '') . '">1</a></li>';
    
    // Add ellipsis if needed
    if ($currentPage - $range > 2) {
        $html .= '<li><span class="pagination-ellipsis">&hellip;</span></li>';
    }
    
    // Page links around current page
    $startPage = max(2, $currentPage - $range);
    $endPage = min($totalPages - 1, $currentPage + $range);
    
    for ($i = $startPage; $i <= $endPage; $i++) {
        $params['page'] = $i;
        $queryString = http_build_query($params);
        $html .= '<li><a href="?' . $queryString . '" class="pagination-link ' . ($currentPage == $i ? 'current' : '') . '">' . $i . '</a></li>';
    }
    
    // Add ellipsis if needed
    if ($currentPage + $range < $totalPages - 1) {
        $html .= '<li><span class="pagination-ellipsis">&hellip;</span></li>';
    }
    
    // Always show last page if there's more than one page
    if ($totalPages > 1) {
        $params['page'] = $totalPages;
        $queryString = http_build_query($params);
        $html .= '<li><a href="?' . $queryString . '" class="pagination-link ' . ($currentPage == $totalPages ? 'current' : '') . '">' . $totalPages . '</a></li>';
    }
    
    // Next and last page links
    if ($currentPage < $totalPages) {
        $params['page'] = $currentPage + 1;
        $queryString = http_build_query($params);
        $html .= '<li><a href="?' . $queryString . '" class="pagination-link" title="Next page">&rsaquo;</a></li>';
        
        $params['page'] = $totalPages;
        $queryString = http_build_query($params);
        $html .= '<li><a href="?' . $queryString . '" class="pagination-link" title="Last page">&raquo;</a></li>';
    } else {
        $html .= '<li><span class="pagination-link disabled">&rsaquo;</span></li>';
        $html .= '<li><span class="pagination-link disabled">&raquo;</span></li>';
    }
    
    $html .= '</ul>';
    $html .= '<div class="pagination-info">Page ' . $currentPage . ' of ' . $totalPages . '</div>';
    $html .= '</div>';
    
    return $html;
}
