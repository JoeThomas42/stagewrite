<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

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

// Update the page title based on role
if ($user['role_id'] == 2 || $user['role_id'] == 3) {
    $current_page = "Data Management";
} else {
    $current_page = "Profile";
}
include 'header.php';

// Role-based logic
if ($user['role_id'] == 1) {
    // Member Page
    $savedPlotsStmt = $pdo->prepare("
        SELECT 
            sp.plot_name,
            v.venue_name,
            v.venue_city,
            s.state_name,
            sp.event_date_start,
            sp.event_date_end
        FROM saved_plots sp
        JOIN venues v ON sp.venue_id = v.venue_id
        JOIN states s ON v.venue_state_id = s.state_id
        WHERE sp.user_id = :user_id
        ORDER BY sp.event_date_start DESC  /* Changed from event_start_date */
    ");
    $savedPlotsStmt->bindParam(':user_id', $user_id);
    $savedPlotsStmt->execute();
    $savedPlots = $savedPlotsStmt->fetchAll(PDO::FETCH_ASSOC);

    echo "<div class='profile-container'>";
    
    echo "<h2>Your Saved Stage Plots:</h2>";
    echo "<ul class='plots-list'>";
    foreach ($savedPlots as $plot) {
        $dateDisplay = formatEventDate($plot['event_date_start'], $plot['event_date_end']);
        echo "<li>";
        echo "<a href='#' class='plot-link'>";
        echo "<div class='plot-name'>{$plot['plot_name']}</div>";
        echo "<div class='plot-details'>";
        echo "<span class='venue'>{$plot['venue_name']}</span>";
        echo "<span class='location'>{$plot['venue_city']}, {$plot['state_name']}</span>";
        echo "<span class='date'>$dateDisplay</span>";
        echo "</div>";
        echo "</a>";
        echo "</li>";
    }
    echo "</ul>";
    echo "</div>";

} elseif ($user['role_id'] == 2) {
    // Admin Page
    echo "<div class='profile-container'>";
    
    // Fetch members
    $sortSQL = in_array($sortColumn, $allowedUserColumns) ? "ORDER BY $sortColumn $sortOrder" : "";
    $membersStmt = $pdo->query("SELECT user_id, first_name, last_name, email, is_active FROM users WHERE role_id = 1 $sortSQL");
    $members = $membersStmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch venues with state abbreviations
    if (in_array($sortColumn, $allowedVenueColumns)) {
        $venuesStmt = $pdo->query("
            SELECT v.*, s.state_abbr, s.state_name 
            FROM venues v
            LEFT JOIN states s ON v.venue_state_id = s.state_id
            ORDER BY $sortColumn $sortOrder
        ");
    } else {
        $venuesStmt = $pdo->query("
            SELECT v.*, s.state_abbr, s.state_name 
            FROM venues v
            LEFT JOIN states s ON v.venue_state_id = s.state_id
        ");
    }
    $venues = $venuesStmt->fetchAll(PDO::FETCH_ASSOC);

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
                <button id='add-venue-button' class='action-button'>+ Add New Venue</button>
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
    
    echo "</div>";

} elseif ($user['role_id'] == 3) {
    // Super Admin Page
    echo "<div class='profile-container'>";
    
    // Fetch admins
    $sortSQL = in_array($sortColumn, $allowedUserColumns) ? "ORDER BY $sortColumn $sortOrder" : "";
    $adminsStmt = $pdo->query("SELECT user_id, first_name, last_name, email, is_active FROM users WHERE role_id = 2 $sortSQL");
    $admins = $adminsStmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch members
    $membersStmt = $pdo->query("SELECT user_id, first_name, last_name, email, is_active FROM users WHERE role_id = 1 $sortSQL");
    $members = $membersStmt->fetchAll(PDO::FETCH_ASSOC);

    // Fetch venues with state abbreviations
    if (in_array($sortColumn, $allowedVenueColumns)) {
        $venuesStmt = $pdo->query("
            SELECT v.*, s.state_abbr, s.state_name 
            FROM venues v
            LEFT JOIN states s ON v.venue_state_id = s.state_id
            ORDER BY $sortColumn $sortOrder
        ");
    } else {
        $venuesStmt = $pdo->query("
            SELECT v.*, s.state_abbr, s.state_name 
            FROM venues v
            LEFT JOIN states s ON v.venue_state_id = s.state_id
        ");
    }
    $venues = $venuesStmt->fetchAll(PDO::FETCH_ASSOC);
    
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
                <button id='add-venue-button' class='action-button'>+ Add New Venue</button>
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

    echo "</div>";
    
} else {
    echo "Invalid role.";
}

// Venue Edit Modal
if ($user['role_id'] == 2 || $user['role_id'] == 3): ?>
<div id="venue-edit-modal" class="modal hidden">
  <div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Edit Venue</h2>
    <form id="venue-edit-form">
      <input type="hidden" id="venue_id" name="venue_id">
      
      <label for="venue_name">Venue Name:</label>
      <input type="text" id="venue_name" name="venue_name" required>
      
      <label for="venue_street">Street Address:</label>
      <input type="text" id="venue_street" name="venue_street">
      
      <label for="venue_city">City:</label>
      <input type="text" id="venue_city" name="venue_city">
      
      <label for="venue_state_id">State:</label>
      <select id="venue_state_id" name="venue_state_id">
        <option value="" selected disabled>Select State</option>
        <?php
        $statesStmt = $pdo->query("SELECT state_id, state_name FROM states ORDER BY state_name");
        $states = $statesStmt->fetchAll(PDO::FETCH_ASSOC);
        foreach ($states as $state) {
            echo "<option value='{$state['state_id']}'>{$state['state_name']}</option>";
        }
        ?>
      </select>
      
      <label for="venue_zip">ZIP Code:</label>
      <input type="text" id="venue_zip" name="venue_zip" pattern="[0-9]{5}" title="Five digit zip code">
      
      <label for="stage_width">Stage Width (ft):</label>
      <input type="number" id="stage_width" name="stage_width" min="1" max="200" required>
      
      <label for="stage_depth">Stage Depth (ft):</label>
      <input type="number" id="stage_depth" name="stage_depth" min="1" max="200" required>
      
      <div class="form-actions">
        <button type="submit" class="save-button">Save Changes</button>
        <button type="button" class="cancel-button">Cancel</button>
      </div>
    </form>
  </div>
</div>

<?php 
endif;
require_once 'footer.php';
?>
