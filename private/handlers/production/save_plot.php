<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';
require_once INCLUDES_PATH . '/plot_snapshot.php'; // Assuming you still need this

// Ensure user is logged in
$userObj = new User();
if (!$userObj->isLoggedIn()) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'Unauthorized']);
    exit;
}

$db = Database::getInstance();
$jsonData = file_get_contents('php://input');

if (!$jsonData) {
    header('Content-Type: application/json');
    echo json_encode(['success' => false, 'error' => 'No data received']);
    exit;
}

try {
    $data = json_decode($jsonData, true);
    if (json_last_error() !== JSON_ERROR_NONE) {
        throw new Exception('Invalid JSON: ' . json_last_error_msg());
    }

    // Validate required data
    if (empty($data['plot_name']) || !isset($data['elements']) || !is_array($data['elements'])) {
        throw new Exception('Missing required plot data');
    }
    // Input list data is optional
    $inputList = isset($data['inputs']) && is_array($data['inputs']) ? $data['inputs'] : [];


    $db->getConnection()->beginTransaction();

    // Determine venue IDs
    $venueId = null;
    $userVenueId = null;
    if (!empty($data['venue_id'])) {
        if (strpos($data['venue_id'], 'user_') === 0) {
            $userVenueId = (int)str_replace('user_', '', $data['venue_id']);
        } else {
            $venueId = (int)$data['venue_id'];
        }
    }

    $plotId = null;
    $isUpdate = !empty($data['plot_id']);

    if ($isUpdate) {
        // Update existing plot
        $plotId = $data['plot_id'];

         // Verify ownership before deleting elements/inputs
        $ownerCheck = $db->fetchOne("SELECT user_id FROM saved_plots WHERE plot_id = ?", [$plotId]);
        if (!$ownerCheck || $ownerCheck['user_id'] !== $_SESSION['user_id']) {
            throw new Exception('Access denied or plot not found.');
         }


        $db->query(
            "UPDATE saved_plots SET
            plot_name = ?, venue_id = ?, user_venue_id = ?, event_date_start = ?, event_date_end = ?, updated_at = NOW()
            WHERE plot_id = ? AND user_id = ?",
            [
                $data['plot_name'], $venueId, $userVenueId,
                !empty($data['event_date_start']) ? $data['event_date_start'] : null,
                !empty($data['event_date_end']) ? $data['event_date_end'] : null,
                $plotId, $_SESSION['user_id']
            ]
        );
         // Delete existing placed elements and inputs before inserting new ones
        $db->query("DELETE FROM placed_elements WHERE plot_id = ?", [$plotId]);
         $db->query("DELETE FROM plot_inputs WHERE plot_id = ?", [$plotId]); // <<< DELETE OLD INPUTS

    } else {
        // Insert new plot
        $stmt = $db->query(
            "INSERT INTO saved_plots (user_id, plot_name, venue_id, user_venue_id, event_date_start, event_date_end, created_at)
            VALUES (?, ?, ?, ?, ?, ?, NOW())",
            [
                $_SESSION['user_id'], $data['plot_name'], $venueId, $userVenueId,
                !empty($data['event_date_start']) ? $data['event_date_start'] : null,
                !empty($data['event_date_end']) ? $data['event_date_end'] : null
            ]
        );
        $plotId = $db->getConnection()->lastInsertId();
    }

    // Insert placed elements
    foreach ($data['elements'] as $element) {
        $db->query(
            "INSERT INTO placed_elements
            (plot_id, element_id, x_position, y_position, width, height, flipped, z_index, label, notes)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                $plotId, $element['element_id'], $element['x_position'], $element['y_position'],
                $element['width'], $element['height'], $element['flipped'],
                $element['z_index'], $element['label'] ?? '', $element['notes'] ?? ''
            ]
        );
    }

    // Input List Data
    if (!empty($inputList)) {
        $inputStmt = $db->getConnection()->prepare(
            "INSERT INTO plot_inputs (plot_id, input_number, input_name) VALUES (?, ?, ?)"
        );
        foreach ($inputList as $inputItem) {
            // Basic validation
            if (isset($inputItem['input_number']) && is_numeric($inputItem['input_number']) &&
                isset($inputItem['input_name']) && !empty(trim($inputItem['input_name']))) {

                $inputStmt->execute([
                    $plotId,
                    (int)$inputItem['input_number'],
                    trim($inputItem['input_name'])
                ]);
            }
        }
    }

    // Generate snapshot
    $snapshotFilename = generatePlotSnapshot($plotId, $data['elements'], $venueId, $userVenueId);
    if ($snapshotFilename) {
        $db->query(
            "UPDATE saved_plots SET snapshot_filename = ? WHERE plot_id = ?",
            [$snapshotFilename, $plotId]
        );
        $currentTimestamp = time();
        $db->query(
            "UPDATE saved_plots SET snapshot_version = ? WHERE plot_id = ?",
            [$currentTimestamp, $plotId]
        );
    }

    $db->getConnection()->commit();

    header('Content-Type: application/json');
    echo json_encode(['success' => true, 'plot_id' => $plotId]);

} catch (Exception $e) {
    if ($db->getConnection()->inTransaction()) {
        $db->getConnection()->rollBack();
    }
    error_log('Error saving plot: ' . $e->getMessage());
    header('Content-Type: application/json');
    // Provide a more specific error message if possible
    $errorMessage = ($e->getCode() === '23000') ? 'Duplicate plot name or constraint violation.' : $e->getMessage();
    echo json_encode(['success' => false, 'error' => $errorMessage]);
}
