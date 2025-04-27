<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

$userObj = new User();
$userObj->logout();

?>
<!DOCTYPE html>
<html>

<head>
  <title>Logging Out</title>
</head>

<body>
  <p>Logging out...</p>
  <script>
    try {
      localStorage.removeItem('stageplot_state');
      localStorage.removeItem('gridVisible');
      localStorage.removeItem('detailedGrid');
      console.log('Stage plot data cleared successfully');
    } catch (e) {
      console.error('Error clearing stage plot data:', e);
    }

    window.location.href = '/';
  </script>
</body>

</html>
<?php
exit;
