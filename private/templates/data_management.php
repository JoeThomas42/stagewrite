<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

if (!isset($_SESSION['user_id']) || ($_SESSION['role_id'] != 2 && $_SESSION['role_id'] != 3)) {
  header('Location: /');
  exit;
}

$user_id = $_SESSION['user_id'];
$user = [
  'user_id'     => $user_id,
  'first_name'  => $_SESSION['first_name'],
  'last_name'   => $_SESSION['last_name'],
  'role_id'     => $_SESSION['role_id']
];

$db = Database::getInstance();

$explicitSort = isset($_GET['sort']);
$sortColumn = isset($_GET['sort']) ? $_GET['sort'] : 'last_name';
$sortOrder = isset($_GET['order']) ? $_GET['order'] : 'asc';

$allowedUserColumns = ['last_name', 'first_name', 'email', 'is_active'];
$allowedVenueColumns = ['venue_name', 'venue_city', 'state_name'];

if (!in_array($sortColumn, array_merge($allowedUserColumns, $allowedVenueColumns))) {
  $sortColumn = 'last_name';
  $explicitSort = false;
}
if ($sortOrder !== 'asc' && $sortOrder !== 'desc') {
  $sortOrder = 'asc';
}

$current_page = "Data Management";
include PRIVATE_PATH . '/templates/header.php';

$search_members = isset($_GET['search_members']) ? trim($_GET['search_members']) : '';
$search_admins = isset($_GET['search_admins']) ? trim($_GET['search_admins']) : '';
$search_venues = isset($_GET['search_venues']) ? trim($_GET['search_venues']) : '';

?>

<div class="profile-container">

  <?php
  // ========================================
  // Super Admin (Role 3) Section
  // ========================================
  if ($user['role_id'] == 3) :
    // Fetch Admins (Role 2)
    $adminSortSQL = in_array($sortColumn, $allowedUserColumns) ? "ORDER BY $sortColumn $sortOrder" : "ORDER BY last_name asc";
    $adminSearchParams = [];
    $adminSearchSQL = '';
    if (!empty($search_admins)) {
      $adminSearchSQL = "AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
      $adminSearchParams = ["%$search_admins%", "%$search_admins%", "%$search_admins%"];
    }
    $admins = $db->fetchAll("SELECT user_id, first_name, last_name, email, is_active FROM users WHERE role_id = 2 $adminSearchSQL $adminSortSQL", $adminSearchParams);
  ?>
    <div class="table-actions">
      <h2>Manage Admins</h2>
      <form method="GET" action="data_management.php" class="search-form">
        <input type="hidden" name="sort" value="<?= htmlspecialchars($sortColumn) ?>">
        <input type="hidden" name="order" value="<?= htmlspecialchars($sortOrder) ?>">
        <div class="search-container">
          <input type="text" class="search-input" name="search_admins" placeholder="Search admins..." value="<?= htmlspecialchars($search_admins) ?>" autocomplete="off">
          <button type="submit" class="search-button"><i class="fa-solid fa-search"></i></button>
          <?php if (!empty($search_admins)) : ?>
            <a href="data_management.php?sort=<?= htmlspecialchars($sortColumn) ?>&order=<?= htmlspecialchars($sortOrder) ?>" class="clear-icon" title="Clear search"><i class="fa-solid fa-xmark"></i></a>
          <?php endif; ?>
        </div>
      </form>
    </div>
    <table id="admins-table">
      <thead>
        <tr>
          <th class="sortable" data-column="last_name" title="Click to sort">Name <?= getSortIcon('last_name', $sortColumn, $sortOrder, $explicitSort) ?></th>
          <th class="sortable" data-column="email" title="Click to sort">Email <?= getSortIcon('email', $sortColumn, $sortOrder, $explicitSort) ?></th>
          <th class="sortable" data-column="is_active" title="Click to sort">Status <?= getSortIcon('is_active', $sortColumn, $sortOrder, $explicitSort) ?></th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($admins as $admin) : ?>
          <tr>
            <td data-label="Name"><?= htmlspecialchars($admin['first_name']) ?> <?= htmlspecialchars($admin['last_name']) ?></td>
            <td data-label="Email"><?= htmlspecialchars($admin['email']) ?></td>
            <td data-label="Status"><?= $admin['is_active'] ? "Active" : "Inactive" ?></td>
            <td data-label="Actions" class="action-cell">
              <a href="view_user.php?user_id=<?= urlencode($admin['user_id']) ?>" class="button view-button">View</a>
            </td>
          </tr>
        <?php endforeach; ?>
        <?php if (empty($admins)) : ?>
          <tr>
            <td colspan="4" class="no-results-message">No admins found<?= !empty($search_admins) ? ' matching your search' : '' ?>.</td>
          </tr>
        <?php endif; ?>
      </tbody>
    </table>
  <?php endif; // End Super Admin only section 
  ?>


  <?php
  // ========================================
  // Admin & Super Admin Section (Members & Venues)
  // ========================================
  if ($user['role_id'] == 2 || $user['role_id'] == 3) :
    // Fetch Members (Role 1)
    $memberSortSQL = in_array($sortColumn, $allowedUserColumns) ? "ORDER BY $sortColumn $sortOrder" : "ORDER BY last_name asc";
    $memberSearchParams = [];
    $memberSearchSQL = '';
    if (!empty($search_members)) {
      $memberSearchSQL = "AND (first_name LIKE ? OR last_name LIKE ? OR email LIKE ?)";
      $memberSearchParams = ["%$search_members%", "%$search_members%", "%$search_members%"];
    }
    $members = $db->fetchAll("SELECT user_id, first_name, last_name, email, is_active FROM users WHERE role_id = 1 $memberSearchSQL $memberSortSQL", $memberSearchParams);

    // Fetch Official Venues
    $venueSortSQL = in_array($sortColumn, $allowedVenueColumns) ? "ORDER BY $sortColumn $sortOrder" : "ORDER BY venue_name asc";
    $venueSearchParams = [];
    $venueSearchSQL = '';
    if (!empty($search_venues)) {
      $venueSearchSQL = "AND (v.venue_name LIKE ? OR v.venue_city LIKE ? OR s.state_name LIKE ?)";
      $venueSearchParams = ["%$search_venues%", "%$search_venues%", "%$search_venues%"];
    }
    $venues = $db->fetchAll("
            SELECT v.venue_id, v.venue_name, v.venue_city, s.state_abbr, s.state_name
            FROM venues v
            LEFT JOIN states s ON v.venue_state_id = s.state_id
            WHERE 1=1 $venueSearchSQL $venueSortSQL
        ", $venueSearchParams);
  ?>
    <div class="table-actions">
      <h2>Manage Members</h2>
      <form method="GET" action="data_management.php" class="search-form">
        <input type="hidden" name="sort" value="<?= htmlspecialchars($sortColumn) ?>">
        <input type="hidden" name="order" value="<?= htmlspecialchars($sortOrder) ?>">
        <div class="search-container">
          <input type="text" class="search-input" name="search_members" placeholder="Search members..." value="<?= htmlspecialchars($search_members) ?>" autocomplete="off">
          <button type="submit" class="search-button"><i class="fa-solid fa-search"></i></button>
          <?php if (!empty($search_members)) : ?>
            <a href="data_management.php?sort=<?= htmlspecialchars($sortColumn) ?>&order=<?= htmlspecialchars($sortOrder) ?>" class="clear-icon" title="Clear search"><i class="fa-solid fa-xmark"></i></a>
          <?php endif; ?>
        </div>
      </form>
    </div>
    <table id="members-table">
      <thead>
        <tr>
          <th class="sortable" data-column="last_name" title="Click to sort">Name <?= getSortIcon('last_name', $sortColumn, $sortOrder, $explicitSort) ?></th>
          <th class="sortable" data-column="email" title="Click to sort">Email <?= getSortIcon('email', $sortColumn, $sortOrder, $explicitSort) ?></th>
          <th class="sortable" data-column="is_active" title="Click to sort">Status <?= getSortIcon('is_active', $sortColumn, $sortOrder, $explicitSort) ?></th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($members as $member) : ?>
          <tr>
            <td data-label="Name"><?= htmlspecialchars($member['first_name']) ?> <?= htmlspecialchars($member['last_name']) ?></td>
            <td data-label="Email"><?= htmlspecialchars($member['email']) ?></td>
            <td data-label="Status"><?= $member['is_active'] ? "Active" : "Inactive" ?></td>
            <td data-label="Actions" class="action-cell">
              <a href="view_user.php?user_id=<?= urlencode($member['user_id']) ?>" class="button view-button">View</a>
            </td>
          </tr>
        <?php endforeach; ?>
        <?php if (empty($members)) : ?>
          <tr>
            <td colspan="4" class="no-results-message">No members found<?= !empty($search_members) ? ' matching your search' : '' ?>.</td>
          </tr>
        <?php endif; ?>
      </tbody>
    </table>

    <div class="table-actions">
      <h2>Manage Official Venues</h2>
      <form method="GET" action="data_management.php" class="search-form">
        <input type="hidden" name="sort" value="<?= htmlspecialchars($sortColumn) ?>">
        <input type="hidden" name="order" value="<?= htmlspecialchars($sortOrder) ?>">
        <div class="search-actions">
          <div class="search-container">
            <input type="text" class="search-input" name="search_venues" placeholder="Search venues..." value="<?= htmlspecialchars($search_venues) ?>" autocomplete="off">
            <button type="submit" class="search-button"><i class="fa-solid fa-search"></i></button>
            <?php if (!empty($search_venues)) : ?>
              <a href="data_management.php?sort=<?= htmlspecialchars($sortColumn) ?>&order=<?= htmlspecialchars($sortOrder) ?>" class="clear-icon" title="Clear search"><i class="fa-solid fa-xmark"></i></a>
            <?php endif; ?>
          </div>
          <a href="edit_venue.php" class="add-button" title="Add Official Venue"><i class="fa-solid fa-plus"></i></a>
        </div>
      </form>
    </div>
    <table id="venues-table">
      <thead>
        <tr>
          <th class="sortable" data-column="venue_name" title="Click to sort">Name <?= getSortIcon('venue_name', $sortColumn, $sortOrder) ?></th>
          <th class="sortable" data-column="venue_city" title="Click to sort">City <?= getSortIcon('venue_city', $sortColumn, $sortOrder) ?></th>
          <th class="sortable" data-column="state_name" title="Click to sort">State <?= getSortIcon('state_name', $sortColumn, $sortOrder) ?></th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <?php foreach ($venues as $venue) : ?>
          <tr>
            <td data-label="Name"><?= htmlspecialchars($venue['venue_name']) ?></td>
            <td data-label="City"><?= formatEmpty(htmlspecialchars($venue['venue_city'])) ?></td>
            <td data-label="State"><?= formatEmpty(htmlspecialchars($venue['state_abbr'])) ?></td>
            <td data-label="Actions" class="action-cell"><a href="view_venue.php?venue_id=<?= urlencode($venue['venue_id']) ?>" class="button view-button">View</a></td>
          </tr>
        <?php endforeach; ?>
        <?php if (empty($venues)) : ?>
          <tr>
            <td colspan="4" class="no-results-message">No venues found<?= !empty($search_venues) ? ' matching your search' : '' ?>.</td>
          </tr>
        <?php endif; ?>
      </tbody>
    </table>

  <?php endif; // End Admin & Super Admin section 
  ?>

  <div id="notification-area" class="notification-area pinned"></div>
</div> 
