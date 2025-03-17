<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Ensure user is logged in
$userObj = new User();
if (!$userObj->isLoggedIn()) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

// Check for plot ID
if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Invalid plot ID']);
    exit;
}

$plotId = (int)$_GET['id'];
$db = Database::getInstance();

try {
    // Fetch plot info with venue details
    $plot = $db->fetchOne("
        SELECT sp.plot_id, sp.plot_name, sp.event_date_start, sp.event_date_end,
               sp.venue_id, v.venue_name, v.stage_width, v.stage_depth
        FROM saved_plots sp
        JOIN venues v ON sp.venue_id = v.venue_id
        WHERE sp.plot_id = ? AND sp.user_id = ?
    ", [$plotId, $_SESSION['user_id']]);

    if (!$plot) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'Plot not found or access denied']);
        exit;
    }

    // Fetch placed elements with element details
    $elements = $db->fetchAll("
        SELECT pe.*, e.element_name, e.category_id, e.element_image
        FROM placed_elements pe
        JOIN elements e ON pe.element_id = e.element_id
        WHERE pe.plot_id = ?
        ORDER BY pe.z_index ASC
    ", [$plotId]);

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true, 
        'plot' => $plot,
        'elements' => $elements
    ]);

} catch (Exception $e) {
    error_log('Error fetching plot: ' . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Database error']);
}
