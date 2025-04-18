<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Check if user is logged in and has admin privileges
if (!isset($_SESSION['user_id']) || ($_SESSION['role_id'] != 2 && $_SESSION['role_id'] != 3)) {
    header('Location: /');
    exit;
}

// Get user information from session
$user_id = $_SESSION['user_id'];
$user = [
    'user_id'     => $user_id,
    'first_name'  => $_SESSION['first_name'],
    'last_name'   => $_SESSION['last_name'],
    'role_id'     => $_SESSION['role_id']
];

// Get database instance
$db = Database::getInstance();

// Check if sort parameters are explicitly set in the URL (vs. using defaults)
$explicitSort = isset($_GET['sort']);

$sortColumn = isset($_GET['sort']) ? $_GET['sort'] : 'last_name';
$sortOrder = isset($_GET['order']) ? $_GET['order'] : 'asc';

// Validate sort parameters
$allowedUserColumns = ['last_name', 'first_name', 'email', 'is_active'];
$allowedVenueColumns = ['venue_name', 'venue_city', 'state_name'];

if (!in_array($sortColumn, array_merge($allowedUserColumns, $allowedVenueColumns))) {
    $sortColumn = 'last_name';  // Default
    $explicitSort = false;
}

if ($sortOrder !== 'asc' && $sortOrder !== 'desc') {
    $sortOrder = 'asc';  // Default
}

// Set page title for header
$current_page = "Data Management";
include PRIVATE_PATH . '/templates/header.php';

echo "<div class='profile-container'>";

// Role-based logic
if ($user['role_id'] == 2) {
    // Admin Page
    
    // Fetch members
    $sortSQL = in_array($sortColumn, $allowedUserColumns) ? "ORDER BY $sortColumn $sortOrder" : "";
    $members = $db->fetchAll("SELECT user_id, first_name, last_name, email, is_active FROM users WHERE role_id = 1 $sortSQL");

    // Fetch venues with state abbreviations
    if (in_array($sortColumn, $allowedVenueColumns)) {
        $venues = $db->fetchAll("
            SELECT v.*, s.state_abbr, s.state_name 
            FROM venues v
            LEFT JOIN states s ON v.venue_state_id = s.state_id
            ORDER BY $sortColumn $sortOrder
        ");
    } else {
        $venues = $db->fetchAll("
            SELECT v.*, s.state_abbr, s.state_name 
            FROM venues v
            LEFT JOIN states s ON v.venue_state_id = s.state_id
        ");
    }

    echo "<div class='table-actions'>
            <h2>Manage Members:</h2>
            <div class='search-container'>
                <input type='text' class='search-input' id='member-search' placeholder='Search members...' autocomplete='off'>
                <span class='clear-icon'><i class='fa-solid fa-xmark'></i></span>
            </div>
          </div>";
    echo "<table id='members-table'>";
    echo "<tr>
            <th>ID</th>
            <th class='sortable' data-column='last_name' title='Click to cycle: ascending → descending → default'>Name <span class='sort-icon'>" . getSortIcon('last_name', $sortColumn, $sortOrder, $explicitSort) . "</span></th>
            <th class='sortable' data-column='email' title='Click to cycle: ascending → descending → default'>Email <span class='sort-icon'>" . getSortIcon('email', $sortColumn, $sortOrder, $explicitSort) . "</span></th>
            <th class='sortable' data-column='is_active' title='Click to cycle: ascending → descending → default'>Status <span class='sort-icon'>" . getSortIcon('is_active', $sortColumn, $sortOrder, $explicitSort) . "</span></th>
            <th>Actions</th>
          </tr>";
    foreach ($members as $member) {
        echo "<tr>
                <td data-label='ID'>{$member['user_id']}</td>
                <td data-label='Name'>{$member['first_name']} {$member['last_name']}</td>
                <td data-label='Email'>{$member['email']}</td>
                <td data-label='Status'>" . ($member['is_active'] ? "Active" : "Inactive") . "</td>
                <td data-label='Actions' class='action-cell'>
                    <div class='dropdown'>
                        <button class='dropdown-toggle'>Actions <span class='dropdown-arrow'>▼</span></button>
                        <div class='dropdown-menu'>
                            <a href='#' class='toggle-status' data-user-id='{$member['user_id']}' data-status='{$member['is_active']}'>Toggle Status</a>
                            <a href='#' class='remove-user' data-user-id='{$member['user_id']}' data-user-name='{$member['first_name']} {$member['last_name']}'>Remove</a>
                        </div>
                    </div>
                </td>
              </tr>";
    }
    echo "</table>";

    echo "<div class='table-actions'>
            <h2>Manage Venues:</h2>
            <div class='search-actions'>
                <div class='search-container'>
                    <input type='text' class='search-input' id='venue-search' placeholder='Search venues...' autocomplete='off'>
                    <span class='clear-icon'><i class='fa-solid fa-xmark'></i></span>
                </div>
                <button id='add-venue-button' class='small-button' title='Add a Venue'><i class='fa-solid fa-plus'></i></button>
            </div>
          </div>";
    echo "<table id='venues-table'>";
    echo "<tr>
            <th>ID</th>
            <th class='sortable' data-column='venue_name'>Name <span class='sort-icon'>" . getSortIcon('venue_name', $sortColumn, $sortOrder) . "</span></th>
            <th class='sortable' data-column='venue_city'>City <span class='sort-icon'>" . getSortIcon('venue_city', $sortColumn, $sortOrder) . "</span></th>
            <th class='sortable' data-column='state_name'>State <span class='sort-icon'>" . getSortIcon('state_name', $sortColumn, $sortOrder) . "</span></th>
            <th>Actions</th>
          </tr>";
    foreach ($venues as $venue) {
        echo "<tr>
                <td data-label='ID'>{$venue['venue_id']}</td>
                <td data-label='Name'>{$venue['venue_name']}</td>
                <td data-label='City'>" . (empty($venue['venue_city']) ? '—' : htmlspecialchars($venue['venue_city'])) . "</td>
                <td data-label='State'>" . (empty($venue['state_abbr']) ? '—' : htmlspecialchars($venue['state_abbr'])) . "</td>
                <td data-label='Actions' class='action-cell'>
                    <div class='dropdown'>
                        <button class='dropdown-toggle'>Actions <span class='dropdown-arrow'>▼</span></button>
                        <div class='dropdown-menu'>";
    
        // Only show edit option if venue_id is not 1
        if ($venue['venue_id'] != 1) {
            echo "<a href='#' class='edit-venue' data-venue-id='{$venue['venue_id']}'>Edit</a>";
            echo "<a href='#' class='remove-venue' data-venue-id='{$venue['venue_id']}' data-venue-name='{$venue['venue_name']}'>Delete</a>";
        } else {
            echo "<span class='disabled-action'>Default Venue (Cannot Edit)</span>";
        }
    
        echo "      </div>
                    </div>
                </td>
              </tr>";
    }
    echo "</table>";

} elseif ($user['role_id'] == 3) {
    // Super Admin Page
    
    // Fetch admins
    $sortSQL = in_array($sortColumn, $allowedUserColumns) ? "ORDER BY $sortColumn $sortOrder" : "";
    $admins = $db->fetchAll("SELECT user_id, first_name, last_name, email, is_active FROM users WHERE role_id = 2 $sortSQL");

    // Fetch members
    $members = $db->fetchAll("SELECT user_id, first_name, last_name, email, is_active FROM users WHERE role_id = 1 $sortSQL");

    // Fetch venues with state abbreviations
    if (in_array($sortColumn, $allowedVenueColumns)) {
        $venues = $db->fetchAll("
            SELECT v.*, s.state_abbr, s.state_name 
            FROM venues v
            LEFT JOIN states s ON v.venue_state_id = s.state_id
            ORDER BY $sortColumn $sortOrder
        ");
    } else {
        $venues = $db->fetchAll("
            SELECT v.*, s.state_abbr, s.state_name 
            FROM venues v
            LEFT JOIN states s ON v.venue_state_id = s.state_id
        ");
    }
    
    // Display Admins
    echo "<div class='table-actions'>
            <h2>Manage Admins:</h2>
            <div class='search-container'>
                <input type='text' class='search-input' id='admin-search' placeholder='Search admins...' autocomplete='off'>
                <span class='clear-icon'><i class='fa-solid fa-xmark'></i></span>
            </div>
          </div>";
    echo "<table id='admins-table'>";
    echo "<tr>
            <th>ID</th>
            <th class='sortable' data-column='last_name' title='Click to cycle: ascending → descending → default'>Name <span class='sort-icon'>" . getSortIcon('last_name', $sortColumn, $sortOrder, $explicitSort) . "</span></th>
            <th class='sortable' data-column='email' title='Click to cycle: ascending → descending → default'>Email <span class='sort-icon'>" . getSortIcon('email', $sortColumn, $sortOrder, $explicitSort) . "</span></th>
            <th class='sortable' data-column='is_active' title='Click to cycle: ascending → descending → default'>Status <span class='sort-icon'>" . getSortIcon('is_active', $sortColumn, $sortOrder, $explicitSort) . "</span></th>
            <th>Actions</th>
          </tr>";
    foreach ($admins as $admin) {
        echo "<tr>
                <td data-label='ID'>{$admin['user_id']}</td>
                <td data-label='Name'>{$admin['first_name']} {$admin['last_name']}</td>
                <td data-label='Email'>{$admin['email']}</td>
                <td data-label='Status'>" . ($admin['is_active'] ? "Active" : "Inactive") . "</td>
                <td data-label='Actions' class='action-cell'>
                    <div class='dropdown'>
                        <button class='dropdown-toggle'>Actions <span class='dropdown-arrow'>▼</span></button>
                        <div class='dropdown-menu'>
                            <a href='#' class='toggle-status' data-user-id='{$admin['user_id']}' data-status='{$admin['is_active']}'>Toggle Status</a>
                            <a href='#' class='demote-user' data-user-id='{$admin['user_id']}' data-user-name='{$admin['first_name']} {$admin['last_name']}'>Demote to Member</a>
                            <a href='#' class='remove-user' data-user-id='{$admin['user_id']}' data-user-name='{$admin['first_name']} {$admin['last_name']}'>Remove</a>
                        </div>
                    </div>
                </td>
              </tr>";
    }
    echo "</table>";
    
    // Display Members
    echo "<div class='table-actions'>
            <h2>Manage Members:</h2>
            <div class='search-container'>
                <input type='text' class='search-input' id='member-search' placeholder='Search members...' autocomplete='off'>
                <span class='clear-icon'><i class='fa-solid fa-xmark'></i></span>
            </div>
          </div>";
    echo "<table id='members-table'>";
    echo "<tr>
            <th>ID</th>
            <th class='sortable' data-column='last_name' title='Click to cycle: ascending → descending → default'>Name <span class='sort-icon'>" . getSortIcon('last_name', $sortColumn, $sortOrder, $explicitSort) . "</span></th>
            <th class='sortable' data-column='email' title='Click to cycle: ascending → descending → default'>Email <span class='sort-icon'>" . getSortIcon('email', $sortColumn, $sortOrder, $explicitSort) . "</span></th>
            <th class='sortable' data-column='is_active' title='Click to cycle: ascending → descending → default'>Status <span class='sort-icon'>" . getSortIcon('is_active', $sortColumn, $sortOrder, $explicitSort) . "</span></th>
            <th>Actions</th>
          </tr>";
    foreach ($members as $member) {
        echo "<tr>
                <td data-label='ID'>{$member['user_id']}</td>
                <td data-label='Name'>{$member['first_name']} {$member['last_name']}</td>
                <td data-label='Email'>{$member['email']}</td>
                <td data-label='Status'>" . ($member['is_active'] ? "Active" : "Inactive") . "</td>
                <td data-label='Actions' class='action-cell'>
                    <div class='dropdown'>
                        <button class='dropdown-toggle'>Actions <span class='dropdown-arrow'>▼</span></button>
                        <div class='dropdown-menu'>
                            <a href='#' class='toggle-status' data-user-id='{$member['user_id']}' data-status='{$member['is_active']}'>Toggle Status</a>";
        // Only show promote option for super admins                    
        if ($user['role_id'] == 3) {
            echo "<a href='#' class='promote-user' data-user-id='{$member['user_id']}' data-user-name='{$member['first_name']} {$member['last_name']}'>Promote to Admin</a>";
        }
        echo "      <a href='#' class='remove-user' data-user-id='{$member['user_id']}' data-user-name='{$member['first_name']} {$member['last_name']}'>Remove</a>
                        </div>
                    </div>
                </td>
              </tr>";
    }
    echo "</table>";
    
    // Display Venues
    echo "<div class='table-actions'>
            <h2>Manage Venues:</h2>
            <div class='search-actions'>
                <div class='search-container'>
                    <input type='text' class='search-input' id='venue-search' placeholder='Search venues...' autocomplete='off'>
                    <span class='clear-icon'><i class='fa-solid fa-xmark'></i></span>
                </div>
                <button id='add-venue-button' class='small-button' title='Add a Venue'><i class='fa-solid fa-plus'></i></button>
            </div>
          </div>";
    echo "<table id='venues-table'>";
    echo "<tr>
            <th>ID</th>
            <th class='sortable' data-column='venue_name'>Name <span class='sort-icon'>" . getSortIcon('venue_name', $sortColumn, $sortOrder) . "</span></th>
            <th class='sortable' data-column='venue_city'>City <span class='sort-icon'>" . getSortIcon('venue_city', $sortColumn, $sortOrder) . "</span></th>
            <th class='sortable' data-column='state_name'>State <span class='sort-icon'>" . getSortIcon('state_name', $sortColumn, $sortOrder) . "</span></th>
            <th>Actions</th>
          </tr>";
    foreach ($venues as $venue) {
        echo "<tr>
                <td data-label='ID'>{$venue['venue_id']}</td>
                <td data-label='Name'>{$venue['venue_name']}</td>
                <td data-label='City'>" . (empty($venue['venue_city']) ? '—' : htmlspecialchars($venue['venue_city'])) . "</td>
                <td data-label='State'>" . (empty($venue['state_abbr']) ? '—' : htmlspecialchars($venue['state_abbr'])) . "</td>
                <td data-label='Actions' class='action-cell'>
                    <div class='dropdown'>
                        <button class='dropdown-toggle'>Actions <span class='dropdown-arrow'>▼</span></button>
                        <div class='dropdown-menu'>";
    
        // Only show edit option if venue_id is not 1
        if ($venue['venue_id'] != 1) {
            echo "<a href='#' class='edit-venue' data-venue-id='{$venue['venue_id']}'>Edit</a>";
            echo "<a href='#' class='remove-venue' data-venue-id='{$venue['venue_id']}' data-venue-name='{$venue['venue_name']}'>Delete</a>";
        } else {
            echo "<span class='disabled-action'>Default Venue (Cannot Edit)</span>";
        }
    
        echo "      </div>
                    </div>
                </td>
              </tr>";
    }
    echo "</table>";
}
    
echo "<div id='notification-area' class='notification-area pinned'></div>";
echo "</div>"; // Close profile-container

// Include venue edit modal
?>
<div id="venue-edit-modal" class="modal hidden">
  <div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Edit Venue</h2>
    <form id="venue-edit-form">
      <input type="hidden" id="venue_id" name="venue_id">
      
      <div class="form-group">
        <label for="venue_name">Venue Name:</label>
        <input type="text" id="venue_name" name="venue_name" maxlength="100" required>
      </div>
      
      <div class="form-group">
        <label for="venue_street">Street Address:</label>
        <input type="text" id="venue_street" name="venue_street" maxlength="100" required>
      </div>
      
      <div class="form-row">
        <div class="form-group">
          <label for="venue_city">City:</label>
          <input type="text" id="venue_city" name="venue_city" maxlength="100" required>
        </div>
        
        <div class="form-group">
          <label for="venue_state_id">State:</label>
          <select id="venue_state_id" name="venue_state_id" required>
            <option value="" selected disabled>Select State</option>
            <?php
            $states = $db->fetchAll("SELECT state_id, state_name FROM states ORDER BY state_name");
            foreach ($states as $state) {
                echo "<option value='{$state['state_id']}'>{$state['state_name']}</option>";
            }
            ?>
          </select>
        </div>
        
        <div class="form-group">
          <label for="venue_zip">ZIP:</label>
          <input type="text" id="venue_zip" name="venue_zip" maxlength="5" required>
        </div>
      </div>
      
      <div class="input-dimensions">
        <div class="form-group">
          <label for="stage_width">Stage Width (feet):</label>
          <input type="number" id="stage_width" name="stage_width" min="1" max="200" step="1" required>
        </div>
        
        <div class="form-group">
          <label for="stage_depth">Stage Depth (feet):</label>
          <input type="number" id="stage_depth" name="stage_depth" min="1" max="200" step="1" required>
        </div>
      </div>
      
      <div class="form-actions">
        <button type="submit" class="save-button">Save Changes</button>
        <button type="button" class="cancel-button">Cancel</button>
      </div>
    </form>
    <div class="modal-notification-area"></div>
  </div>
</div>

<?php
include PRIVATE_PATH . '/templates/footer.php';
?>
