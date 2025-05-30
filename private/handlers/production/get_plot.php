<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

$userObj = new User();
if (!$userObj->isLoggedIn()) {
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Unauthorized']);
  exit;
}

if (!isset($_GET['id']) || !is_numeric($_GET['id'])) {
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Invalid plot ID']);
  exit;
}

$plotId = (int)$_GET['id'];
$db = Database::getInstance();

try {
  $plot = $db->fetchOne("
        SELECT
            sp.plot_id, sp.plot_name, sp.event_date_start, sp.event_date_end,
            sp.venue_id, sp.user_venue_id, sp.snapshot_filename, sp.snapshot_version,
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

  $elements = $db->fetchAll("
        SELECT
            pe.*,
            e.element_name, e.category_id, e.element_image,
            CASE WHEN uf.favorite_id IS NOT NULL THEN 1 ELSE 0 END as is_favorite
        FROM placed_elements pe
        JOIN elements e ON pe.element_id = e.element_id
        LEFT JOIN user_favorites uf ON e.element_id = uf.element_id AND uf.user_id = ?
        WHERE pe.plot_id = ?
        ORDER BY pe.z_index ASC
    ", [$_SESSION['user_id'], $plotId]);

  $favorites = $db->fetchAll("
        SELECT e.element_id, e.element_name, e.category_id, e.element_image
        FROM user_favorites uf
        JOIN elements e ON uf.element_id = e.element_id
        WHERE uf.user_id = ?
    ", [$_SESSION['user_id']]);

  $inputs = $db->fetchAll("
        SELECT input_number, input_name as label
        FROM plot_inputs
        WHERE plot_id = ?
        ORDER BY input_number ASC
    ", [$plotId]);
  $inputs = array_map(function ($input) {
    $input['number'] = (int)$input['input_number'];
    unset($input['input_number']);
    return $input;
  }, $inputs);

  header('Content-Type: application/json');
  echo json_encode([
    'success' => true,
    'plot' => $plot,
    'elements' => $elements,
    'favorites' => $favorites,
    'inputs' => $inputs
  ]);
} catch (Exception $e) {
  error_log('Error fetching plot: ' . $e->getMessage());
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
