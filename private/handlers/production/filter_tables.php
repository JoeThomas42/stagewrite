<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

$currentUser = new User();
if (!$currentUser->hasRole([2, 3])) {
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Unauthorized']);
  exit;
}

$query = trim($_GET['query'] ?? '');
$tableType = $_GET['table'] ?? '';

$db = Database::getInstance();

$validTables = ['members', 'admins', 'venues'];
if (!in_array($tableType, $validTables)) {
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Invalid table type']);
  exit;
}

try {
  $data = [];

  if ($tableType === 'members') {
    $searchCondition = '';
    if (!empty($query)) {
      $searchCondition = "AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
      $searchParams = ["%$query%", "%$query%", "%$query%"];
    } else {
      $searchParams = [];
    }

    $dataQuery = "SELECT user_id, first_name, last_name, email, is_active
                    FROM users
                    WHERE role_id = 1 $searchCondition
                    ORDER BY last_name";
    $data = $db->fetchAll($dataQuery, $searchParams);
  } elseif ($tableType === 'admins') {
    $searchCondition = '';
    if (!empty($query)) {
      $searchCondition = "AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
      $searchParams = ["%$query%", "%$query%", "%$query%"];
    } else {
      $searchParams = [];
    }

    $dataQuery = "SELECT user_id, first_name, last_name, email, is_active
                    FROM users
                    WHERE role_id = 2 $searchCondition
                    ORDER BY last_name";
    $data = $db->fetchAll($dataQuery, $searchParams);
  } elseif ($tableType === 'venues') {
    $searchCondition = '';
    if (!empty($query)) {
      $searchCondition = "AND (v.venue_name LIKE ? OR v.venue_city LIKE ? OR s.state_name LIKE ?)";
      $searchParams = ["%$query%", "%$query%", "%$query%"];
    } else {
      $searchParams = [];
    }

    $dataQuery = "SELECT v.*, s.state_abbr, s.state_name
                    FROM venues v
                    LEFT JOIN states s ON v.venue_state_id = s.state_id
                    WHERE 1=1 $searchCondition
                    ORDER BY v.venue_name";
    $data = $db->fetchAll($dataQuery, $searchParams);
  }

  header('Content-Type: application/json');
  echo json_encode([
    'success' => true,
    'data' => $data
  ]);
} catch (Exception $e) {
  error_log('Error filtering table: ' . $e->getMessage());
  header('Content-Type: application/json');
  echo json_encode(['success' => false, 'error' => 'Database error: ' . $e->getMessage()]);
}
