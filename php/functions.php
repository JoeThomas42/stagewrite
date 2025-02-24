<?php
/**
 * Formats event dates for display
 * 
 * @param string $startDate The event start date
 * @param string $endDate The event end date
 * @return string Formatted date string
 */
function formatEventDate($startDate, $endDate) {
    if (!$startDate) return 'Date TBD';
    
    $start = new DateTime($startDate);
    if (!$endDate) {
        return $start->format('F j, Y');
    }
    
    $end = new DateTime($endDate);
    if ($start->format('Y-m-d') === $end->format('Y-m-d')) {
        return $start->format('F j, Y');
    }
    
    if ($start->format('Y') === $end->format('Y')) {
        if ($start->format('F') === $end->format('F')) {
            return $start->format('F j') . '-' . $end->format('j, Y');
        }
        return $start->format('F j') . ' - ' . $end->format('F j, Y');
    }
    
    return $start->format('F j, Y') . ' - ' . $end->format('F j, Y');
}
