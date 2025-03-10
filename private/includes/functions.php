<?php

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
