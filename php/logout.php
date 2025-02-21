<?php
session_start();
session_destroy();
header('Location: /stagewrite/index.html');
exit;
?>
