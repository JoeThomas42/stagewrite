<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Use User class for logout
$userObj = new User();
$userObj->logout();

// Send a response that clears LocalStorage before redirecting
// This ensures stage plot data doesn't persist between users
?>
<!DOCTYPE html>
<html>
<head>
    <title>Logging Out</title>
</head>
<body>
    <p>Logging out...</p>
    <script>
        // Clear all stage plot related data from localStorage
        try {
            localStorage.removeItem('stageplot_state');
            localStorage.removeItem('gridVisible');
            localStorage.removeItem('detailedGrid');
            console.log('Stage plot data cleared successfully');
        } catch (e) {
            console.error('Error clearing stage plot data:', e);
        }
        
        // Redirect to homepage after clearing data
        window.location.href = '/';
    </script>
</body>
</html>
<?php
exit;
