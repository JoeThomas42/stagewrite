<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Check if user is logged in and has admin privileges
if (!isset($_SESSION['user_id']) || ($_SESSION['role_id'] != 2 && $_SESSION['role_id'] != 3)) {
  header('Location: /');
  exit;
}

$db = Database::getInstance();
$error_message = isset($_SESSION['error_message']) ? $_SESSION['error_message'] : '';
$success_message = isset($_SESSION['success_message']) ? $_SESSION['success_message'] : '';

// Clear session messages after retrieving them
unset($_SESSION['error_message'], $_SESSION['success_message']);

// Function to sanitize sort parameters
function sanitizeSortParams($sort, $order, $allowed_columns)
{
  // Validate sort column
  if (!in_array($sort, $allowed_columns)) {
    $sort = $allowed_columns[0]; // Default to first allowed column
  }

  // Validate sort order
  $order = strtolower($order);
  if ($order !== 'asc' && $order !== 'desc') {
    $order = 'asc';
  }

  return ['sort' => $sort, 'order' => $order];
}

// Function to generate pagination links
function generatePaginationLinks($current_page, $total_pages, $sort = null, $order = null, $search = null, $target = 'users')
{
  $pagination = '<div class="pagination">';

  // First page link
  if ($current_page > 1) {
    $pagination .= '<a href="?page=1' .
      ($sort ? '&sort=' . $sort : '') .
      ($order ? '&order=' . $order : '') .
      ($search ? '&search=' . urlencode($search) : '') .
      ($target !== 'users' ? '&target=' . $target : '') .
      '" class="pagination-link">&laquo; First</a>';
  } else {
    $pagination .= '<span class="pagination-link disabled">&laquo; First</span>';
  }

  // Previous page link
  if ($current_page > 1) {
    $pagination .= '<a href="?page=' . ($current_page - 1) .
      ($sort ? '&sort=' . $sort : '') .
      ($order ? '&order=' . $order : '') .
      ($search ? '&search=' . urlencode($search) : '') .
      ($target !== 'users' ? '&target=' . $target : '') .
      '" class="pagination-link">&lsaquo; Prev</a>';
  } else {
    $pagination .= '<span class="pagination-link disabled">&lsaquo; Prev</span>';
  }

  // Page number links
  $start_page = max(1, $current_page - 2);
  $end_page = min($total_pages, $current_page + 2);

  for ($i = $start_page; $i <= $end_page; $i++) {
    if ($i == $current_page) {
      $pagination .= '<span class="pagination-link current">' . $i . '</span>';
    } else {
      $pagination .= '<a href="?page=' . $i .
        ($sort ? '&sort=' . $sort : '') .
        ($order ? '&order=' . $order : '') .
        ($search ? '&search=' . urlencode($search) : '') .
        ($target !== 'users' ? '&target=' . $target : '') .
        '" class="pagination-link">' . $i . '</a>';
    }
  }

  // Next page link
  if ($current_page < $total_pages) {
    $pagination .= '<a href="?page=' . ($current_page + 1) .
      ($sort ? '&sort=' . $sort : '') .
      ($order ? '&order=' . $order : '') .
      ($search ? '&search=' . urlencode($search) : '') .
      ($target !== 'users' ? '&target=' . $target : '') .
      '" class="pagination-link">Next &rsaquo;</a>';
  } else {
    $pagination .= '<span class="pagination-link disabled">Next &rsaquo;</span>';
  }

  // Last page link
  if ($current_page < $total_pages) {
    $pagination .= '<a href="?page=' . $total_pages .
      ($sort ? '&sort=' . $sort : '') .
      ($order ? '&order=' . $order : '') .
      ($search ? '&search=' . urlencode($search) : '') .
      ($target !== 'users' ? '&target=' . $target : '') .
      '" class="pagination-link">Last &raquo;</a>';
  } else {
    $pagination .= '<span class="pagination-link disabled">Last &raquo;</span>';
  }

  $pagination .= '</div>';

  return $pagination;
}

// Get current target (users or venues)
$target = isset($_GET['target']) ? $_GET['target'] : 'users';
if ($target !== 'users' && $target !== 'venues') {
  $target = 'users';
}

// Get current page
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
if ($page < 1) {
  $page = 1;
}

// Items per page
$items_per_page = 20;
$offset = ($page - 1) * $items_per_page;

// Initialize user variables
$users = [];
$total_users = 0;
$allowed_user_sort_columns = ['first_name', 'last_name', 'role_name', 'is_active', 'created_at'];
$user_sort = isset($_GET['sort']) ? $_GET['sort'] : 'last_name';
$user_order = isset($_GET['order']) ? $_GET['order'] : 'asc';
$user_search = isset($_GET['search']) ? trim($_GET['search']) : '';

// Initialize venue variables
$venues = [];
$total_venues = 0;
$allowed_venue_sort_columns = ['venue_name', 'venue_city', 'state_name'];
$venue_sort = isset($_GET['sort']) ? $_GET['sort'] : 'venue_name';
$venue_order = isset($_GET['order']) ? $_GET['order'] : 'asc';
$venue_search = isset($_GET['search']) ? trim($_GET['search']) : '';

// Sanitize sort parameters based on the current target
if ($target === 'users') {
  $sort_params = sanitizeSortParams($user_sort, $user_order, $allowed_user_sort_columns);
  $user_sort = $sort_params['sort'];
  $user_order = $sort_params['order'];
} else {
  $sort_params = sanitizeSortParams($venue_sort, $venue_order, $allowed_venue_sort_columns);
  $venue_sort = $sort_params['sort'];
  $venue_order = $sort_params['order'];
}

// User listing with sorting and pagination
if ($target === 'users') {
  // Create the user search SQL
  $user_where_clause = "";
  $user_params = [];

  if (!empty($user_search)) {
    // Still include email in search, but don't display it
    $user_where_clause = " WHERE u.first_name LIKE ? OR u.last_name LIKE ? OR u.email LIKE ?";
    $search_term = "%{$user_search}%";
    $user_params = [$search_term, $search_term, $search_term];
  }

  // Count total users for pagination
  $count_sql = "SELECT COUNT(*) as count FROM users u" . $user_where_clause;
  $total_users = $db->fetchOne($count_sql, $user_params)['count'];
  $total_pages = ceil($total_users / $items_per_page);

  // Adjust page if it exceeds total pages
  if ($page > $total_pages && $total_pages > 0) {
    $page = $total_pages;
    $offset = ($page - 1) * $items_per_page;
  }

  // Generate SQL for user listing with sorting - removed email from selection
  $users_sql = "SELECT u.user_id, u.first_name, u.last_name, u.is_active, u.created_at, r.role_name 
                FROM users u 
                JOIN user_roles r ON u.role_id = r.role_id" .
    $user_where_clause .
    " ORDER BY " . $user_sort . " " . $user_order .
    " LIMIT " . $items_per_page . " OFFSET " . $offset;

  // Fetch users
  $users = $db->fetchAll($users_sql, $user_params);
}

// Venue listing with sorting and pagination
if ($target === 'venues') {
  // Create the venue search SQL
  $venue_where_clause = "";
  $venue_params = [];

  if (!empty($venue_search)) {
    $venue_where_clause = " WHERE v.venue_name LIKE ? OR v.venue_city LIKE ? OR s.state_name LIKE ?";
    $search_term = "%{$venue_search}%";
    $venue_params = [$search_term, $search_term, $search_term];
  }

  // Count total venues for pagination
  $count_sql = "SELECT COUNT(*) as count FROM venues v LEFT JOIN states s ON v.venue_state_id = s.state_id" . $venue_where_clause;
  $total_venues = $db->fetchOne($count_sql, $venue_params)['count'];
  $total_pages = ceil($total_venues / $items_per_page);

  // Adjust page if it exceeds total pages
  if ($page > $total_pages && $total_pages > 0) {
    $page = $total_pages;
    $offset = ($page - 1) * $items_per_page;
  }

  // Generate SQL for venue listing with sorting - simplified to only include necessary columns
  $venues_sql = "SELECT v.venue_id, v.venue_name, v.venue_city, s.state_name 
                FROM venues v 
                LEFT JOIN states s ON v.venue_state_id = s.state_id" .
    $venue_where_clause .
    " ORDER BY " . $venue_sort . " " . $venue_order .
    " LIMIT " . $items_per_page . " OFFSET " . $offset;

  // Fetch venues
  $venues = $db->fetchAll($venues_sql, $venue_params);
}

// Set page title for header
$current_page = "Data Management";
include PRIVATE_PATH . '/templates/header.php';

// Function to generate column header with sort links
function columnHeader($label, $column, $current_sort, $current_order, $search = '', $target = 'users')
{
  $sort_indicator = '';
  $next_order = 'asc';

  if ($current_sort === $column) {
    $sort_indicator = $current_order === 'asc' ? ' ▲' : ' ▼';
    $next_order = $current_order === 'asc' ? 'desc' : 'asc';
  }

  $url = "?target=" . $target .
    "&sort=" . $column .
    "&order=" . $next_order .
    ($search ? "&search=" . urlencode($search) : "");

  return '<th class="sortable" data-column="' . $column . '">
            <a href="' . $url . '" class="sort-link">' . $label . $sort_indicator . '</a>
          </th>';
}
?>

<div class="profile-container">
  <?php if ($error_message): ?>
    <div class="error-message"><?= htmlspecialchars($error_message) ?></div>
  <?php endif; ?>

  <?php if ($success_message): ?>
    <div class="success-message"><?= htmlspecialchars($success_message) ?></div>
  <?php endif; ?>

  <div class="table-actions">
    <div class="data-controls">
      <h2>Data Management</h2>
      <div class="buttons-group">
        <a href="?target=users" class="button <?= $target === 'users' ? 'active' : '' ?>">Manage Users</a>
        <a href="?target=venues" class="button <?= $target === 'venues' ? 'active' : '' ?>">Manage Venues</a>
      </div>
    </div>

    <div class="search-actions">
      <form method="GET" class="search-form">
        <input type="hidden" name="target" value="<?= $target ?>">
        <?php if ($target === 'users' && isset($_GET['sort'])): ?>
          <input type="hidden" name="sort" value="<?= htmlspecialchars($user_sort) ?>">
        <?php endif; ?>
        <?php if ($target === 'users' && isset($_GET['order'])): ?>
          <input type="hidden" name="order" value="<?= htmlspecialchars($user_order) ?>">
        <?php endif; ?>
        <?php if ($target === 'venues' && isset($_GET['sort'])): ?>
          <input type="hidden" name="sort" value="<?= htmlspecialchars($venue_sort) ?>">
        <?php endif; ?>
        <?php if ($target === 'venues' && isset($_GET['order'])): ?>
          <input type="hidden" name="order" value="<?= htmlspecialchars($venue_order) ?>">
        <?php endif; ?>

        <div class="search-container">
          <input type="text" name="search" class="search-input" placeholder="Search <?= $target === 'users' ? 'users' : 'venues' ?>..." value="<?= htmlspecialchars($target === 'users' ? $user_search : $venue_search) ?>">
          <button type="submit" class="search-button"><i class="fas fa-search"></i></button>
          <?php if (($target === 'users' && !empty($user_search)) || ($target === 'venues' && !empty($venue_search))): ?>
            <a href="?target=<?= $target ?>" class="clear-search"><i class="fas fa-times clear-icon"></i></a>
          <?php endif; ?>
        </div>
      </form>

      <?php if ($target === 'venues'): ?>
        <a href="edit_venue.php" class="button add-button"><i class="fas fa-plus"></i></a>
      <?php endif; ?>
    </div>
  </div>

  <?php if ($target === 'users'): ?>
    <!-- Users Table -->
    <?php if (!empty($users)): ?>
      <div class="pagination-container">
        <?= generatePaginationLinks($page, $total_pages, $user_sort, $user_order, $user_search, 'users') ?>
      </div>

      <table id="users-table">
        <thead>
          <tr>
            <?= columnHeader('First Name', 'first_name', $user_sort, $user_order, $user_search, 'users') ?>
            <?= columnHeader('Last Name', 'last_name', $user_sort, $user_order, $user_search, 'users') ?>
            <?= columnHeader('Role', 'role_name', $user_sort, $user_order, $user_search, 'users') ?>
            <?= columnHeader('Status', 'is_active', $user_sort, $user_order, $user_search, 'users') ?>
            <?= columnHeader('Created', 'created_at', $user_sort, $user_order, $user_search, 'users') ?>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($users as $user): ?>
            <tr>
              <td data-label="First Name"><?= htmlspecialchars($user['first_name']) ?></td>
              <td data-label="Last Name"><?= htmlspecialchars($user['last_name']) ?></td>
              <td data-label="Role"><?= htmlspecialchars($user['role_name']) ?></td>
              <td data-label="Status">
                <span class="status-indicator <?= $user['is_active'] ? 'active' : 'inactive' ?>">
                  <?= $user['is_active'] ? 'Active' : 'Inactive' ?>
                </span>
              </td>
              <td data-label="Created"><?= date('M j, Y', strtotime($user['created_at'])) ?></td>
              <td class="action-cell">
                <a href="view_user.php?user_id=<?= $user['user_id'] ?>" class="button view-button">View</a>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>

      <div class="pagination-container">
        <?= generatePaginationLinks($page, $total_pages, $user_sort, $user_order, $user_search, 'users') ?>
      </div>
    <?php else: ?>
      <div class="no-results-message">
        <p><?= empty($user_search) ? 'No users found.' : 'No users found matching "' . htmlspecialchars($user_search) . '".' ?></p>
      </div>
    <?php endif; ?>
  <?php else: ?>
    <!-- Venues Table - Simplified -->
    <?php if (!empty($venues)): ?>
      <div class="pagination-container">
        <?= generatePaginationLinks($page, $total_pages, $venue_sort, $venue_order, $venue_search, 'venues') ?>
      </div>

      <table id="venues-table">
        <thead>
          <tr>
            <?= columnHeader('Name', 'venue_name', $venue_sort, $venue_order, $venue_search, 'venues') ?>
            <?= columnHeader('City', 'venue_city', $venue_sort, $venue_order, $venue_search, 'venues') ?>
            <?= columnHeader('State', 'state_name', $venue_sort, $venue_order, $venue_search, 'venues') ?>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          <?php foreach ($venues as $venue): ?>
            <tr>
              <td data-label="Name"><?= htmlspecialchars($venue['venue_name']) ?></td>
              <td data-label="City"><?= htmlspecialchars($venue['venue_city']) ?></td>
              <td data-label="State"><?= htmlspecialchars($venue['state_name']) ?></td>
              <td class="action-cell">
                <a href="view_venue.php?venue_id=<?= $venue['venue_id'] ?>" class="button view-button">View</a>
              </td>
            </tr>
          <?php endforeach; ?>
        </tbody>
      </table>

      <div class="pagination-container">
        <?= generatePaginationLinks($page, $total_pages, $venue_sort, $venue_order, $venue_search, 'venues') ?>
      </div>
    <?php else: ?>
      <div class="no-results-message">
        <p><?= empty($venue_search) ? 'No venues found.' : 'No venues found matching "' . htmlspecialchars($venue_search) . '".' ?></p>
      </div>
    <?php endif; ?>
  <?php endif; ?>
</div>

<?php include PRIVATE_PATH . '/templates/footer.php'; ?>
