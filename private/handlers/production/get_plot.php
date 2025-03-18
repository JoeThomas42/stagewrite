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
    // Fetch plot info with venue details - modified to handle both venue types
    $plot = $db->fetchOne("
        SELECT 
            sp.plot_id, sp.plot_name, sp.event_date_start, sp.event_date_end,
            sp.venue_id, sp.user_venue_id,
            CASE 
                WHEN sp.venue_id IS NOT NULL THEN v.venue_name
                WHEN sp.user_venue_id IS NOT NULL THEN uv.venue_name
                ELSE 'Unknown Venue'
            END as venue_name,
            CASE 
                WHEN sp.venue_id IS NOT NULL THEN v.stage_width
                WHEN sp.user_venue_id IS NOT NULL THEN uv.stage_width
                ELSE 40
            END as stage_width,
            CASE 
                WHEN sp.venue_id IS NOT NULL THEN v.stage_depth
                WHEN sp.user_venue_id IS NOT NULL THEN uv.stage_depth
                ELSE 30
            END as stage_depth,
            CASE 
                WHEN sp.user_venue_id IS NOT NULL THEN CONCAT('user_', sp.user_venue_id)
                ELSE CAST(sp.venue_id AS CHAR)
            END as effective_venue_id,
            CASE 
                WHEN sp.user_venue_id IS NOT NULL THEN 1
                ELSE 0
            END as is_user_venue
        FROM saved_plots sp
        LEFT JOIN venues v ON sp.venue_id = v.venue_id
        LEFT JOIN user_venues uv ON sp.user_venue_id = uv.user_venue_id
        WHERE sp.plot_id = ? AND sp.user_id = ?
    ", [$plotId, $_SESSION['user_id']]);

    if (!$plot) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'Plot not found or access denied']);
        exit;
    }

    // Fetch placed elements with element details (unchanged)
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
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
