<?php
// This handler serves snapshot images from the private directory

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Forward to the private handler
require_once HANDLERS_PATH . '/production/get_snapshot.php';
