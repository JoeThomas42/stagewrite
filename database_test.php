<?php

define('APP_RUNNING', true);

require_once 'config.php';
require_once 'includes/functions.php';

// Enable error reporting
// error_reporting(E_ALL);
// ini_set('display_errors', 1);

$is_ajax = isset($_SERVER['HTTP_X_REQUESTED_WITH']) && 
           strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';

// Create database connection
$conn = create_db_connection();

// Display connection information
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
} else {
    echo "Connected to database: " . $conn->host_info . "<br>";
    echo "Connection status: " . ($conn->ping() ? "Active" : "Inactive") . "<br>";
}

// Define tables to display with their primary key columns
$tables = [
    'elements' => 'element_id',
    'element_categories' => 'category_id',
    'placed_elements' => 'placed_id',
    'plot_inputs' => 'input_id',
    'saved_plots' => 'plot_id',
    'states' => 'state_id',
    'users' => 'user_id',
    'user_favorites' => 'favorite_id',
    'user_roles' => 'role_id',
    'venues' => 'venue_id'
];

// Pagination and sorting logic
$results_per_page = 10;
$output = '<div id="content">';

foreach ($tables as $table => $primary_key) {
    $page = isset($_GET['page_' . $table]) ? max(1, (int)$_GET['page_' . $table]) : 1;
    $sort_column = isset($_GET['sort_' . $table]) ? 
        $_GET['sort_' . $table] : 
        $primary_key;
    $offset = ($page - 1) * $results_per_page;

    // Validate sort column
    $sort_column = validate_sort_column($conn, $table, $sort_column, $primary_key);

    // Prepare and execute safe query
    $sql = $conn->prepare("SELECT * FROM `$table` ORDER BY `$sort_column` LIMIT ? OFFSET ?");
    $sql->bind_param("ii", $results_per_page, $offset);
    $sql->execute();
    $result = $sql->get_result();

    // Build table output
    $output .= "<h2>" . safe_htmlspecialchars(ucfirst(str_replace('_', ' ', $table))) . "</h2>";
    $output .= "<table class='data-table' id='table-$table'>";
    $output .= "<thead><tr>";
    
    // Table headers with sorting links
    $columns = $conn->query("SHOW COLUMNS FROM `$table`");
    $valid_columns = [];
    while ($column = $columns->fetch_assoc()) {
        $column_name = $column['Field'];
        $valid_columns[] = $column_name;
        $sort_link = "database_test.php?sort_$table=" . urlencode($column_name) . "&page_$table=$page";
        $output .= "<th><a href='$sort_link' data-table='$table' data-column='$column_name'>" . 
            safe_htmlspecialchars($column_name) . "</a></th>";
    }
    $output .= "</tr></thead><tbody>";

    // Fetch and display rows
    while ($row = $result->fetch_assoc()) {
        $output .= "<tr>";
        foreach ($row as $value) {
            $display_value = (safe_strlen($value) > 100) 
                ? mb_substr($value, 0, 100, 'UTF-8') . '...' 
                : $value;
            $output .= "<td>" . safe_htmlspecialchars($display_value) . "</td>";
        }
        $output .= "</tr>";
    }
    $output .= "</tbody></table>";

    // Pagination links
    $total_count = get_total_rows($conn, $table);
    $total_pages = ceil($total_count / $results_per_page);
    $output .= "<div class='pagination' id='pagination-$table'>";

    // Pages per group
    $pages_per_group = 8;
    $current_group = ceil($page / $pages_per_group);
    $start_page = ($current_group - 1) * $pages_per_group + 1;
    $end_page = min($start_page + $pages_per_group - 1, $total_pages);

    // Previous button
    if ($current_group > 1) {
        $prev_page = ($current_group - 1) * $pages_per_group;
        $output .= "<a href='database_test.php?page_$table=$prev_page&sort_$table=" . 
            urlencode($sort_column) . "' class='pagination-nav' data-table='$table' data-page='$prev_page'>Previous</a>";
    }

    // Display page numbers
    for ($i = $start_page; $i <= $end_page; $i++) {
        $active = ($i == $page) ? "active" : "";
        $output .= "<a href='database_test.php?page_$table=$i&sort_$table=" . 
            urlencode($sort_column) . "' class='$active' data-table='$table' data-page='$i'>$i</a>";
    }

    // Next button
    if ($current_group < ceil($total_pages / $pages_per_group)) {
        $next_page = $current_group * $pages_per_group + 1;
        $output .= "<a href='database_test.php?page_$table=$next_page&sort_$table=" . 
            urlencode($sort_column) . "' class='pagination-nav' data-table='$table' data-page='$next_page'>Next</a>";
    }

    $output .= "</div>";
}

$conn->close();

if ($is_ajax) {
    echo $output;
    exit;
}
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Test</title>
    <link rel="stylesheet" href="css/database.css">
</head>
<body>
    <div id="content">
        <?php echo $output; ?>
    </div>

    <script src="js/database.js"></script>
</body>
</html>
