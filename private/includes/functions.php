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

// Helper function to generate sort icons
function getSortIcon($column, $currentSort, $currentOrder) {
  if ($currentSort === $column) {
      return $currentOrder === 'asc' ? '▲' : '▼';
  }
  return '';
}
