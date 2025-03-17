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
if (!isset($_POST['plot_id']) || !is_numeric($_POST['plot_id'])) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Invalid plot ID']);
    exit;
}

$plotId = (int)$_POST['plot_id'];
$db = Database::getInstance();

try {
    // Begin transaction
    $db->getConnection()->beginTransaction();
    
    // Verify plot belongs to current user
    $plot = $db->fetchOne(
        "SELECT plot_id FROM saved_plots WHERE plot_id = ? AND user_id = ?", 
        [$plotId, $_SESSION['user_id']]
    );
    
    if (!$plot) {
        header('Content-Type: application/json');
        echo json_encode(['success' => false, 'error' => 'Plot not found or access denied']);
        exit;
    }
    
    // Delete placed elements first (due to foreign key constraints)
    $db->query("DELETE FROM placed_elements WHERE plot_id = ?", [$plotId]);
    
    // Delete the plot
    $db->query("DELETE FROM saved_plots WHERE plot_id = ?", [$plotId]);
    
    // Commit transaction
    $db->getConnection()->commit();
    
    // Return success
    header('Content-Type: application/json');
    echo json_encode(['success' => true]);
    
} catch (Exception $e) {
    // Rollback on error
    if ($db->getConnection()->inTransaction()) {
        $db->getConnection()->rollBack();
    }
    
    error_log('Error deleting plot: ' . $e->getMessage());
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
?>
