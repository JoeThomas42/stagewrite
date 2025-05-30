<?php

/**
 * Utility functions
 * @package StageWrite
 */

/**
 * Sanitize and clean user input
 * * @param string|array $input Input to sanitize
 * @param bool $trim Whether to trim whitespace
 * @return string|array Sanitized input
 */
function sanitizeInput($input, $trim = true)
{
  if (is_array($input)) {
    return array_map(function ($value) use ($trim) {
      return sanitizeInput($value, $trim);
    }, $input);
  }

  // Convert special characters to HTML entities to prevent XSS
  $clean = htmlspecialchars($input, ENT_QUOTES, 'UTF-8');

  if ($trim) {
    $clean = trim($clean);
  }

  return $clean;
}

/**
 * Format event date range for display
 * * @param string $startDate Event start date
 * @param string $endDate Event end date
 * @return string Formatted date string
 */
function formatEventDate($startDate, $endDate)
{
  $start = new DateTime($startDate);
  $end = new DateTime($endDate);

  if ($start->format('Y-m-d') === $end->format('Y-m-d')) {
    return $start->format('F j, Y');
  }

  if ($start->format('Y-m') === $end->format('Y-m')) {
    return $start->format('F j') . ' - ' . $end->format('j, Y');
  }

  if ($start->format('Y') === $end->format('Y')) {
    return $start->format('F j') . ' - ' . $end->format('F j, Y');
  }

  return $start->format('F j, Y') . ' - ' . $end->format('F j, Y');
}

/**
 * Generate sort icons for table columns
 * * @param string $column Column name
 * @param string $currentSort Current sort column
 * @param string $currentOrder Current sort order
 * @param bool $explicitSort Whether sorting is explicit or default
 * @return string Icon HTML
 */
function getSortIcon($column, $currentSort, $currentOrder, $explicitSort = true)
{
  if ($currentSort === $column && $explicitSort) {
    return $currentOrder === 'asc' ? '▲' : '▼';
  }
  return '';
}

/**
 * Format empty values with a dash for display
 * * @param string $value The value to check
 * @param bool $trim Whether to trim the value before checking
 * @return string The original value or a dash if empty
 */
function formatEmpty($value, $trim = true)
{
  if ($trim) {
    $value = trim($value);
  }
  return (empty($value) && $value !== '0') ? '—' : $value;
}

/**
 * Generate pagination HTML
 * * @param int $currentPage Current page number
 * @param int $totalPages Total number of pages
 * @param array $params Additional URL parameters to maintain
 * @param string $section Section identifier for multiple paginations on one page
 * @return string HTML for pagination controls
 */
function generatePagination($currentPage, $totalPages, $params = [], $section = '')
{
  if ($totalPages <= 1) {
    return '';
  }

  $html = '<div class="pagination-container">';
  $html .= '<ul class="pagination">';

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

  $range = 2;

  // Always show first page
  $params['page'] = 1;
  $queryString = http_build_query($params);
  $html .= '<li><a href="?' . $queryString . '" class="pagination-link ' . ($currentPage == 1 ? 'current' : '') . '">1</a></li>';

  // Add ellipsis if needed
  if ($currentPage - $range > 2) {
    $html .= '<li><span class="pagination-ellipsis">&hellip;</span></li>';
  }

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

/**
 * Send a standardized JSON error response
 * * @param string $message Error message
 * @param int $code HTTP status code
 * @param array $details Additional error details
 */
function sendJsonError($message, $code = 400, $details = [])
{
  http_response_code($code);
  header('Content-Type: application/json');
  echo json_encode([
    'success' => false,
    'error' => $message,
    'details' => $details
  ]);
  exit;
}

/**
 * Send a standardized JSON success response
 * * @param array $data Response data
 */
function sendJsonSuccess($data = [])
{
  header('Content-Type: application/json');
  echo json_encode(array_merge(['success' => true], $data));
  exit;
}

/**
 * Check if user is authorized and has required role
 * * @param array|int $requiredRoles Role(s) required for access
 * @return bool True if authorized
 */
function checkAuth($requiredRoles = [])
{
  $userObj = new User();

  if (!$userObj->isLoggedIn()) {
    sendJsonError('Unauthorized', 401);
    return false;
  }

  if (!empty($requiredRoles)) {
    if (!$userObj->hasRole($requiredRoles)) {
      sendJsonError('Insufficient permissions', 403);
      return false;
    }
  }

  return true;
}

/**
 * Generate a PDF of a stage plot
 * * @param array $data Plot data including elements, inputs, dimensions, etc.
 * @param Database $db Database connection
 * @param string $tempDir Directory to store temporary files
 * @param bool $autoPrint Whether to add JavaScript to auto-print
 * @return array Array with 'filepath' and 'filename' of the generated PDF
 */
function generatePlotPDF($data, $db, $tempDir, $autoPrint = false)
{
  // Ensure temp directory exists
  if (!is_dir($tempDir)) {
    mkdir($tempDir, 0755, true);
  }

  $plotId = isset($data['plotId']) ? (int)$data['plotId'] : null;

  require_once VENDOR_PATH . '/tecnickcom/tcpdf/tcpdf.php';

  $pdf = new TCPDF('P', 'mm', 'LETTER', true, 'UTF-8', false);

  $pdf->SetCreator('StageWrite');
  $pdf->SetAuthor('StageWrite User');
  $pdf->SetTitle($data['title'] ? $data['title'] : 'Stage Plot');
  $pdf->SetSubject('Stage Plot');

  $pdf->setPrintHeader(false);
  $pdf->setPrintFooter(false);

  $pdf->SetMargins(15, 15, 15);

  $pdf->SetAutoPageBreak(TRUE, 15);

  if ($autoPrint) {
    $pdf->IncludeJS("print();");
  }

  $pdf->AddPage();

  $pdf->SetFont('helvetica', 'B', 16);
  $pdf->Cell(0, 10, $data['title'] ? $data['title'] : 'Stage Plot', 0, 1, 'C');

  if (!empty($data['eventStart'])) {
    $pdf->SetFont('helvetica', '', 12);
    $dateText = date('F j, Y', strtotime($data['eventStart']));
    if (!empty($data['eventEnd']) && $data['eventEnd'] !== $data['eventStart']) {
      $dateText .= ' - ' . date('F j, Y', strtotime($data['eventEnd']));
    }
    $pdf->Cell(0, 7, $dateText, 0, 1, 'C');
  }

  if (!empty($data['venue'])) {
    $pdf->SetFont('helvetica', 'B', 12);
    $pdf->Cell(0, 10, 'Venue: ' . $data['venue'], 0, 1, 'C');

    // If address is not provided but we have a venue ID, try to fetch it
    if (empty($data['address']) || $data['address'] === 'N/A') {
      $venueId = null;
      $userVenueId = null;

      if (!empty($data['venueId'])) {
        if (strpos($data['venueId'], 'user_') === 0) {
          $userVenueId = (int)str_replace('user_', '', $data['venueId']);

          $venueInfo = $db->fetchOne(
            "
              SELECT 
                CONCAT_WS(', ', 
                  venue_street,
                  venue_city,
                  (SELECT state_abbr FROM states WHERE state_id = venue_state_id),
                  venue_zip
                ) as address
              FROM user_venues 
              WHERE user_venue_id = ?",
            [$userVenueId]
          );
        } else {
          $venueId = (int)$data['venueId'];

          $venueInfo = $db->fetchOne(
            "
              SELECT 
                CONCAT_WS(', ', 
                  venue_street,
                  venue_city,
                  (SELECT state_abbr FROM states WHERE state_id = venue_state_id),
                  venue_zip
                ) as address
              FROM venues 
              WHERE venue_id = ?",
            [$venueId]
          );
        }

        if ($venueInfo && !empty($venueInfo['address'])) {
          $data['address'] = $venueInfo['address'];
        }
      }
    }

    if (!empty($data['address']) && $data['address'] !== 'N/A') {
      $pdf->SetFont('helvetica', '', 10);
      $pdf->Cell(0, 5, $data['address'], 0, 1, 'C');
      $pdf->SetTextColor(0, 0, 0);
    }
    $pdf->Ln(2);
  }

  // Add stage plot image
  if ($plotId) {
    $snapshotInfo = $db->fetchOne(
      "SELECT snapshot_filename FROM saved_plots WHERE plot_id = ?",
      [$plotId]
    );

    if ($snapshotInfo && !empty($snapshotInfo['snapshot_filename'])) {
      $snapshotPath = PRIVATE_PATH . '/snapshots/' . $snapshotInfo['snapshot_filename'];

      if (file_exists($snapshotPath)) {
        $pdf->Image($snapshotPath, 15, null, 180, 0, '', '', '', false, 300);
      } else {
        $pdf->Cell(0, 10, 'Snapshot file not found', 0, 1, 'C');
        error_log('PDF snapshot file not found: ' . $snapshotPath);
      }
    } else {
      // Fall back to generating a snapshot if one doesn't exist
      $elements = $data['elements'];

      $venueId = null;
      $userVenueId = null;
      if (!empty($data['venueId'])) {
        if (strpos($data['venueId'], 'user_') === 0) {
          $userVenueId = (int)str_replace('user_', '', $data['venueId']);
        } else {
          $venueId = (int)$data['venueId'];
        }
      }

      $snapshotFilename = generatePlotSnapshot($plotId, $elements, $venueId, $userVenueId);
      if ($snapshotFilename) {
        $snapshotPath = PRIVATE_PATH . '/snapshots/' . $snapshotFilename;
        $pdf->Image($snapshotPath, 15, null, 180, 0, '', '', '', false, 300);
      } else {
        $pdf->Cell(0, 10, 'Unable to generate stage plot image', 0, 1, 'C');
      }
    }
  } else {
    $pdf->Cell(0, 10, 'No plot image available', 0, 1, 'C');
  }

  // Add a page for elements list
  $pdf->AddPage();
  $pdf->SetFont('helvetica', 'B', 14);
  $pdf->Cell(0, 10, 'Stage Elements List', 0, 1, 'L');
  $pdf->Ln(5);

  // Elements table
  if (!empty($data['elements'])) {
    $pdf->SetFont('helvetica', 'B', 10);
    $pdf->Cell(10, 7, '#', 1, 0, 'C');
    $pdf->Cell(50, 7, 'Element', 1, 0, 'C');
    $pdf->Cell(30, 7, 'Label', 1, 0, 'C');
    $pdf->Cell(90, 7, 'Notes', 1, 1, 'C');

    // Group elements by name to handle duplicates
    $elementGroups = [];
    $elementCounts = [];

    // First pass: count occurrences of each element name
    foreach ($data['elements'] as $element) {
      $name = isset($element['elementName']) ? $element['elementName'] : (isset($element['element_name']) ? $element['element_name'] : null);
      if (!$name) continue;

      if (!isset($elementCounts[$name])) {
        $elementCounts[$name] = 0;
      }
      $elementCounts[$name]++;
    }

    $pdf->SetFont('helvetica', '', 10);
    $i = 1;
    $nameCounts = [];

    foreach ($data['elements'] as $element) {
      $name = isset($element['elementName']) ? $element['elementName'] : (isset($element['element_name']) ? $element['element_name'] : 'Element ' . $i);

      // Add counter to name if there are multiple elements with this name
      if (isset($elementCounts[$name]) && $elementCounts[$name] > 1) {
        if (!isset($nameCounts[$name])) {
          $nameCounts[$name] = 1;
        } else {
          $nameCounts[$name]++;
        }
        $displayName = $name . ' ' . $nameCounts[$name];
      } else {
        $displayName = $name;
      }

      $pdf->Cell(10, 7, $i, 1, 0, 'C');
      $pdf->Cell(50, 7, $displayName, 1, 0, 'L');
      $pdf->Cell(30, 7, isset($element['label']) ? $element['label'] : '', 1, 0, 'L');

      // Handle multi-line notes
      $notes = isset($element['notes']) ? $element['notes'] : '';
      $pdf->MultiCell(90, 7, $notes, 1, 'L', false, 1);

      $i++;
    }
  } else {
    $pdf->Cell(0, 10, 'No elements placed', 0, 1, 'C');
  }

  // Add a page for input list
  $pdf->AddPage();
  $pdf->SetFont('helvetica', 'B', 14);
  $pdf->Cell(0, 10, 'Aux Input List', 0, 1, 'L');
  $pdf->Ln(5);

  // Input list table
  if (!empty($data['inputs'])) {
    $pdf->SetFont('helvetica', 'B', 10);
    $pdf->Cell(20, 7, 'Input #', 1, 0, 'C');
    $pdf->Cell(160, 7, 'Description', 1, 1, 'C');

    $pdf->SetFont('helvetica', '', 10);
    foreach ($data['inputs'] as $input) {
      $inputNumber = isset($input['number']) ? $input['number'] : (isset($input['input_number']) ? $input['input_number'] : '');
      $inputLabel = isset($input['label']) ? $input['label'] : (isset($input['input_name']) ? $input['input_name'] : '');

      // Add the "A" prefix to the input number
      $formattedInputNumber = 'A' . $inputNumber;

      $pdf->Cell(20, 7, $formattedInputNumber, 1, 0, 'C');
      $pdf->Cell(160, 7, $inputLabel, 1, 1, 'L');
    }
  } else {
    $pdf->Cell(0, 10, 'No inputs defined', 0, 1, 'C');
  }

  $filename = 'stage_plot_' . preg_replace('/[^a-z0-9_-]/i', '_', $data['title']) . '.pdf';
  $filepath = $tempDir . '/' . $filename;

  $pdf->Output($filepath, 'F');

  return [
    'filepath' => $filepath,
    'filename' => $filename
  ];
}
