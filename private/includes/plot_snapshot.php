<?php

/**
 * Snapshot Generation
 * @package StageWrite
 */

/**
 * Generate a detailed snapshot image of a stage plot using element images
 * * @param int $plotId - The ID of the plot
 * @param array $elements - Array of elements in the plot
 * @param int|null $venueId - The ID of the venue (if any)
 * @param int|null $userVenueId - The ID of the user venue (if any)
 * @return string|null - The filename of the generated snapshot, or null on failure
 */
function generatePlotSnapshot($plotId, $elements, $venueId, $userVenueId)
{
  // Create directory if it doesn't exist
  $snapshotDir = PRIVATE_PATH . '/snapshots';
  if (!is_dir($snapshotDir)) {
    mkdir($snapshotDir, 0755, true);
  }

  $db = Database::getInstance();

  // Check if the plot already has a snapshot
  $existingSnapshot = $db->fetchOne(
    "SELECT snapshot_filename FROM saved_plots WHERE plot_id = ?",
    [$plotId]
  );

  // --- Determine Stage Dimensions based on Venue ---
  $venueWidthFeet = 40; // Default width in feet
  $venueDepthFeet = 30; // Default depth in feet

  if ($venueId) {
    $venue = $db->fetchOne("SELECT stage_width, stage_depth FROM venues WHERE venue_id = ?", [$venueId]);
    if ($venue && !empty($venue['stage_width']) && !empty($venue['stage_depth'])) {
      $venueWidthFeet = (int)$venue['stage_width'];
      $venueDepthFeet = (int)$venue['stage_depth'];
    }
  } elseif ($userVenueId) {
    $userVenue = $db->fetchOne(
      "SELECT stage_width, stage_depth FROM user_venues WHERE user_venue_id = ?",
      [$userVenueId]
    );
    if ($userVenue && !empty($userVenue['stage_width']) && !empty($userVenue['stage_depth'])) {
      $venueWidthFeet = (int)$userVenue['stage_width'];
      $venueDepthFeet = (int)$userVenue['stage_depth'];
    }
  }

  // --- Calculate Snapshot Canvas Dimensions ---
  $snapshotBaseWidth = 1200;
  $aspectRatio = ($venueWidthFeet > 0) ? $venueDepthFeet / $venueWidthFeet : 3 / 4;
  $snapshotCanvasHeight = round($snapshotBaseWidth * $aspectRatio);
  $snapshotCanvasHeight = max($snapshotCanvasHeight, 180); // Ensure minimum height

  // --- Reference UI Dimensions (for scaling) ---
  $referenceUIWidth = 900;
  $referenceUIHeight = round($referenceUIWidth * $aspectRatio);

  $image = imagecreatetruecolor($snapshotBaseWidth, $snapshotCanvasHeight);

  imagealphablending($image, true);
  imagesavealpha($image, true);

  $bgColor = imagecolorallocate($image, 255, 255, 255);
  imagefill($image, 0, 0, $bgColor);

  $borderColor = imagecolorallocate($image, 221, 221, 221);
  imagerectangle($image, 0, 0, $snapshotBaseWidth - 1, $snapshotCanvasHeight - 1, $borderColor);

  // Add grid lines (5 foot intervals)
  $gridColor = imagecolorallocate($image, 230, 230, 230);
  $gridLineThickness = 1;
  $gridSizeX = $snapshotBaseWidth / ($venueWidthFeet / 5);
  $gridSizeY = $snapshotCanvasHeight / ($venueDepthFeet / 5);

  for ($i = 1; $i < ($venueWidthFeet / 5); $i++) {
    $x = round($i * $gridSizeX);
    imageline($image, $x, 0, $x, $snapshotCanvasHeight, $gridColor);
  }

  for ($i = 1; $i < ($venueDepthFeet / 5); $i++) {
    $y = round($i * $gridSizeY);
    imageline($image, 0, $y, $snapshotBaseWidth, $y, $gridColor);
  }

  // Add stage dimensions text
  $dimensionsColor = imagecolorallocate($image, 120, 120, 120);
  $dimensionsFont = 4;
  $dimensionsText = "Stage: {$venueWidthFeet}' x {$venueDepthFeet}'";
  $dimensionsWidth = imagefontwidth($dimensionsFont) * strlen($dimensionsText);
  $dimensionsX = 10;
  $dimensionsY = 10;
  imagestring($image, $dimensionsFont, $dimensionsX, $dimensionsY, $dimensionsText, $dimensionsColor);

  // Add "FRONT OF STAGE" text
  $textColor = imagecolorallocate($image, 102, 102, 102);
  $font = 2;
  $text = "FRONT OF STAGE";
  $textWidth = imagefontwidth($font) * strlen($text);
  $textHeight = imagefontheight($font);
  $xText = ($snapshotBaseWidth - $textWidth) / 2;
  $yText = $snapshotCanvasHeight - $textHeight - 5;
  imagestring($image, $font, $xText, $yText, $text, $textColor);

  // Sort elements by z-index
  usort($elements, function ($a, $b) {
    return $a['z_index'] - $b['z_index'];
  });

  // Draw each element
  foreach ($elements as $element) {
    $elementDetails = $db->fetchOne(
      "SELECT e.element_name, e.element_image 
              FROM elements e 
              WHERE e.element_id = ?",
      [$element['element_id']]
    );

    if (!$elementDetails) {
      drawElementAsRectangle($image, $element, $snapshotBaseWidth, $snapshotCanvasHeight, $referenceUIWidth, $referenceUIHeight);
    } else {
      // --- Calculate Element Position and Size for Snapshot ---
      $relativeX = $element['x_position'] / $referenceUIWidth;
      $relativeY = $element['y_position'] / $referenceUIHeight;
      $relativeWidth = $element['width'] / $referenceUIWidth;
      $relativeHeight = $element['height'] / $referenceUIHeight;

      // Apply the relative positions to the snapshot dimensions
      // Add a small position offset (5px) to adjust for the apparent alignment issue
      $x = ($relativeX * $snapshotBaseWidth) + 18;
      $y = ($relativeY * $snapshotCanvasHeight) + 18;
      $width = max(1, $relativeWidth * $snapshotBaseWidth);
      $height = max(1, $relativeHeight * $snapshotCanvasHeight);

      // Attempt to load element image
      $elementImagePath = PUBLIC_PATH . '/images/elements/' . $elementDetails['element_image'];

      if (file_exists($elementImagePath)) {
        $imageInfo = getimagesize($elementImagePath);
        $elementImg = null;

        switch ($imageInfo[2]) {
          case IMAGETYPE_JPEG:
            $elementImg = imagecreatefromjpeg($elementImagePath);
            break;
          case IMAGETYPE_PNG:
            $elementImg = imagecreatefrompng($elementImagePath);
            break;
          case IMAGETYPE_GIF:
            $elementImg = imagecreatefromgif($elementImagePath);
            break;
        }

        if ($elementImg) {
          if ($imageInfo[2] == IMAGETYPE_PNG) {
            imagealphablending($elementImg, true);
            imagesavealpha($elementImg, true);
          }

          $resizedImg = imagecreatetruecolor(max(1, round($width)), max(1, round($height)));
          imagealphablending($resizedImg, false); // Better transparency handling
          imagesavealpha($resizedImg, true);
          $transparent = imagecolorallocatealpha($resizedImg, 255, 255, 255, 127);
          imagefill($resizedImg, 0, 0, $transparent);

          imagecopyresampled(
            $resizedImg,
            $elementImg,
            0,
            0,
            0,
            0,
            max(1, round($width)),
            max(1, round($height)),
            imagesx($elementImg),
            imagesy($elementImg)
          );

          // Apply flip if needed
          if ($element['flipped'] == 1) {
            $resizedImg = flipImage($resizedImg, true);
          }

          // Don't use round() here as it can cause position drift
          imagecopy(
            $image,
            $resizedImg,
            (int)$x,
            (int)$y,
            0,
            0,
            imagesx($resizedImg),
            imagesy($resizedImg)
          );

          imagedestroy($resizedImg);
          imagedestroy($elementImg);
        } else {
          drawElementAsRectangle($image, $element, $snapshotBaseWidth, $snapshotCanvasHeight, $referenceUIWidth, $referenceUIHeight);
        }
      } else {
        drawElementAsRectangle($image, $element, $snapshotBaseWidth, $snapshotCanvasHeight, $referenceUIWidth, $referenceUIHeight);
      }
    }

    // --- ADD LABEL DRAWING CODE START ---
    if (!empty($element['label'])) {
      $labelTextColor = imagecolorallocate($image, 30, 30, 30);
      $labelFont = 3;

      $labelText = trim($element['label']);
      $labelWidth = imagefontwidth($labelFont) * strlen($labelText);
      $labelHeight = imagefontheight($labelFont);

      // Adjust label position to match the updated element position
      // Center the label horizontally relative to the element
      $labelX = (int)($x + ($width / 2) - ($labelWidth / 2));
      // Place the label just below the element
      $labelY = (int)($y + $height + 2);

      // Ensure label doesn't go off edges
      if ($labelY + $labelHeight > $snapshotCanvasHeight - 2) {
        $labelY = (int)($y - $labelHeight - 2);
      }
      if ($labelY < 2) {
        $labelY = (int)($y + ($height / 2) - ($labelHeight / 2));
      }
      $labelX = max(2, min($labelX, $snapshotBaseWidth - $labelWidth - 2));

      imagestring($image, $labelFont, $labelX, $labelY, $labelText, $labelTextColor);
    }
    // --- ADD LABEL DRAWING CODE END ---
  }

  // Generate filename, overwriting existing if necessary
  if ($existingSnapshot && !empty($existingSnapshot['snapshot_filename'])) {
    $filename = $existingSnapshot['snapshot_filename'];
    $oldFilePath = $snapshotDir . '/' . $filename;
    if (file_exists($oldFilePath)) {
      unlink($oldFilePath);
    }
  } else {
    $filename = 'plot_' . $plotId . '.png';
  }

  $filePath = $snapshotDir . '/' . $filename;

  if (imagepng($image, $filePath, 8)) {
    imagedestroy($image);
    return $filename;
  } else {
    imagedestroy($image);
    return null;
  }
}

/**
 * Draw element as a colored rectangle (fallback method)
 * * @param \GdImage $image - The image resource
 * @param array $element - Element data
 * @param float $snapshotWidth - Snapshot canvas width
 * @param float $snapshotHeight - Snapshot canvas height
 * @param float $refWidth - Reference UI width
 * @param float $refHeight - Reference UI height
 */
function drawElementAsRectangle($image, $element, $snapshotWidth, $snapshotHeight, $refWidth, $refHeight)
{
  // Calculate position/size relative to reference UI dimensions
  $relativeX = $element['x_position'] / $refWidth;
  $relativeY = $element['y_position'] / $refHeight;
  $relativeWidth = $element['width'] / $refWidth;
  $relativeHeight = $element['height'] / $refHeight;

  // Calculate actual pixel position/size on the snapshot canvas
  // Add the same small position offset (5px) for consistency
  $x = ($relativeX * $snapshotWidth) + 5;
  $y = ($relativeY * $snapshotHeight) + 5;
  $width = $relativeWidth * $snapshotWidth;
  $height = $relativeHeight * $snapshotHeight;

  $borderColor = imagecolorallocate($image, 82, 108, 129);
  $fillColor = imagecolorallocatealpha($image, 103, 134, 159, 30);

  // Use integer casting instead of round() to maintain positioning consistency
  imagefilledrectangle(
    $image,
    (int)$x + 1,
    (int)$y + 1,
    (int)($x + $width - 1),
    (int)($y + $height - 1),
    $fillColor
  );
  imagerectangle(
    $image,
    (int)$x,
    (int)$y,
    (int)($x + $width),
    (int)($y + $height),
    $borderColor
  );
}

/**
 * Flips an image resource horizontally.
 *
 * @param \GdImage $image The image resource.
 * @param bool $flip Whether to flip the image horizontally.
 * @return \GdImage The modified image resource.
 */
function flipImage($image, $flip)
{
  if ($flip) {
    imageflip($image, IMG_FLIP_HORIZONTAL);
  }
  return $image;
}
