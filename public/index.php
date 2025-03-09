<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

$current_page = "Home";
include PRIVATE_PATH . '/templates/header.php';
?>

<div class='page-wrapper'>

  <h2>Coming soon!</h1>
  <img src="<?= IMG_PATH . "/Wireframe.png" ?>" alt="An image of the wireframe concept of this site.">

</div>

<?php include PRIVATE_PATH . '/templates/footer.php'; ?>
