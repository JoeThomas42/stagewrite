<?php
/**
 * Enhanced Snapshot Generation
 * @package StageWrite
 */

/**
 * Generate a detailed snapshot image of a stage plot using element images
 * 
 * @param int $plotId - The ID of the plot
 * @param array $elements - Array of elements in the plot
 * @param int|null $venueId - The ID of the venue (if any)
 * @param int|null $userVenueId - The ID of the user venue (if any)
 * @return string|null - The filename of the generated snapshot, or null on failure
 */
function generatePlotSnapshot($plotId, $elements, $venueId, $userVenueId) {
    // Create directory if it doesn't exist
    $snapshotDir = PRIVATE_PATH . '/snapshots';
    if (!is_dir($snapshotDir)) {
        mkdir($snapshotDir, 0755, true);
    }
    
    // Connect to database
    $db = Database::getInstance();
    
    // Check if the plot already has a snapshot, and get its filename if it exists
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
    $snapshotBaseWidth = 1200; // Desired width for the snapshot image
    $aspectRatio = ($venueWidthFeet > 0) ? $venueDepthFeet / $venueWidthFeet : 3/4; // Calculate aspect ratio based on feet
    $snapshotCanvasHeight = round($snapshotBaseWidth * $aspectRatio);
    $snapshotCanvasHeight = max($snapshotCanvasHeight, 180); // Ensure minimum height

    // --- Reference UI Dimensions ---
    // This assumes the JS calculates stage height based on a 900px width
    $referenceUIWidth = 900; 
    $referenceUIHeight = round($referenceUIWidth * $aspectRatio); 
    
    // Create a blank image
    $image = imagecreatetruecolor($snapshotBaseWidth, $snapshotCanvasHeight);
    
    // Enable alpha blending
    imagealphablending($image, true);
    imagesavealpha($image, true);
    
    // Fill the background
    $bgColor = imagecolorallocate($image, 248, 249, 250); // Light gray background
    imagefill($image, 0, 0, $bgColor);
    
    // Draw a border
    $borderColor = imagecolorallocate($image, 221, 221, 221); // #DDD
    imagerectangle($image, 0, 0, $snapshotBaseWidth - 1, $snapshotCanvasHeight - 1, $borderColor);
    
    // Add grid lines (5 foot intervals)
    $gridColor = imagecolorallocate($image, 230, 230, 230); // Very light gray for grid lines
    $gridLineThickness = 1;

    // Calculate grid size in pixels (how many pixels per 5 feet)
    $gridSizeX = $snapshotBaseWidth / ($venueWidthFeet / 5);
    $gridSizeY = $snapshotCanvasHeight / ($venueDepthFeet / 5);

    // Draw vertical grid lines (left to right)
    for ($i = 1; $i < ($venueWidthFeet / 5); $i++) {
        $x = round($i * $gridSizeX);
        imageline($image, $x, 0, $x, $snapshotCanvasHeight, $gridColor);
    }

    // Draw horizontal grid lines (top to bottom)
    for ($i = 1; $i < ($venueDepthFeet / 5); $i++) {
        $y = round($i * $gridSizeY);
        imageline($image, 0, $y, $snapshotBaseWidth, $y, $gridColor);
    }

    // Add stage dimensions text at the top
    $dimensionsColor = imagecolorallocate($image, 120, 120, 120); // Darker than grid lines
    $dimensionsFont = 2; // Use a small built-in font
    $dimensionsText = "Stage: {$venueWidthFeet}' x {$venueDepthFeet}'";
    $dimensionsWidth = imagefontwidth($dimensionsFont) * strlen($dimensionsText);
    $dimensionsX = 10; // Position in top-left with padding
    $dimensionsY = 10;
    imagestring($image, $dimensionsFont, $dimensionsX, $dimensionsY, $dimensionsText, $dimensionsColor);
    
    // Add "FRONT OF STAGE" text
    $textColor = imagecolorallocate($image, 102, 102, 102); // #666
    $font = 2; 
    $text = "FRONT OF STAGE";
    $textWidth = imagefontwidth($font) * strlen($text);
    $textHeight = imagefontheight($font);
    $xText = ($snapshotBaseWidth - $textWidth) / 2;
    $yText = $snapshotCanvasHeight - $textHeight - 5;
    imagestring($image, $font, $xText, $yText, $text, $textColor);
    
    // Sort elements by z-index
    usort($elements, function($a, $b) {
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
            // Calculate relative position/size based on reference UI dimensions
            $relativeX = $element['x_position'] / $referenceUIWidth;
            $relativeY = $element['y_position'] / $referenceUIHeight;
            $relativeWidth = $element['width'] / $referenceUIWidth;
            $relativeHeight = $element['height'] / $referenceUIHeight; // Use relative height based on reference UI

            // Calculate actual pixel position/size on the snapshot canvas
            $x = $relativeX * $snapshotBaseWidth;
            $y = $relativeY * $snapshotCanvasHeight;
            $width = $relativeWidth * $snapshotBaseWidth;
            $height = $relativeHeight * $snapshotCanvasHeight; // Scale height relative to snapshot canvas

            // Attempt to load element image
            $elementImagePath = PUBLIC_PATH . '/images/elements/' . $elementDetails['element_image'];
            
            if (file_exists($elementImagePath)) {
                $imageInfo = getimagesize($elementImagePath);
                $elementImg = null;
                
                switch ($imageInfo[2]) {
                    case IMAGETYPE_JPEG: $elementImg = imagecreatefromjpeg($elementImagePath); break;
                    case IMAGETYPE_PNG: $elementImg = imagecreatefrompng($elementImagePath); break;
                    case IMAGETYPE_GIF: $elementImg = imagecreatefromgif($elementImagePath); break;
                }
                
                if ($elementImg) {
                    if ($imageInfo[2] == IMAGETYPE_PNG) {
                        imagealphablending($elementImg, true);
                        imagesavealpha($elementImg, true);
                    }

                    $resizedImg = imagecreatetruecolor(max(1, round($width)), max(1, round($height))); // Ensure dimensions are at least 1
                    imagealphablending($resizedImg, false); // Use false for better transparency handling
                    imagesavealpha($resizedImg, true);
                    $transparent = imagecolorallocatealpha($resizedImg, 255, 255, 255, 127);
                    imagefill($resizedImg, 0, 0, $transparent);
                    
                    imagecopyresampled(
                        $resizedImg, $elementImg,
                        0, 0, 0, 0,
                        max(1, round($width)), max(1, round($height)), // Use rounded dimensions >= 1
                        imagesx($elementImg), imagesy($elementImg)
                    );
                    
                    // Apply flip if needed
                    if ($element['flipped'] == 1) {
                      $resizedImg = flipImage($resizedImg, true);
                      
                    }
                    
                    imagecopy(
                        $image, $resizedImg,
                        round($x), round($y), 0, 0, // Use rounded positions
                        imagesx($resizedImg), imagesy($resizedImg)
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
        // Add label if present
        if (!empty($element['label'])) {
            // Define label properties
            $labelTextColor = imagecolorallocate($image, 30, 30, 30); // Dark grey text
            $labelFont = 3; // Use built-in GD font (1-5)

            $labelText = trim($element['label']);
            $labelWidth = imagefontwidth($labelFont) * strlen($labelText);
            $labelHeight = imagefontheight($labelFont);

            // Calculate position: Centered horizontally, slightly below the element
            // Use the calculated $x, $y, $width, $height for the element's snapshot representation
            $labelX = round($x + ($width / 2) - ($labelWidth / 2));
            $labelY = round($y + $height + 2); // Position 2px below the element

            // Ensure label doesn't go off the bottom edge
            if ($labelY + $labelHeight > $snapshotCanvasHeight - 2) {
                $labelY = round($y - $labelHeight - 2); // Position above if no space below
            }
            // Ensure label doesn't go off the top edge (if positioned above)
            if ($labelY < 2) {
                 $labelY = round($y + ($height / 2) - ($labelHeight / 2)); // Center vertically if no space above/below
            }
            // Ensure label doesn't go off the left/right edges
            $labelX = max(2, min($labelX, $snapshotBaseWidth - $labelWidth - 2));

            // Draw the label string
            imagestring($image, $labelFont, $labelX, $labelY, $labelText, $labelTextColor);
        }
        // --- ADD LABEL DRAWING CODE END ---
    }
    
    // Generate filename
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
    
    // Save the image
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
 * 
 * @param resource $image - The image resource
 * @param array $element - Element data
 * @param float $snapshotWidth - Snapshot canvas width
 * @param float $snapshotHeight - Snapshot canvas height
 * @param float $refWidth - Reference UI width
 * @param float $refHeight - Reference UI height
 */
function drawElementAsRectangle($image, $element, $snapshotWidth, $snapshotHeight, $refWidth, $refHeight) {
    // Calculate relative position/size based on reference UI dimensions
    $relativeX = $element['x_position'] / $refWidth;
    $relativeY = $element['y_position'] / $refHeight;
    $relativeWidth = $element['width'] / $refWidth;
    $relativeHeight = $element['height'] / $refHeight;

    // Calculate actual pixel position/size on the snapshot canvas
    $x = $relativeX * $snapshotWidth;
    $y = $relativeY * $snapshotHeight;
    $width = $relativeWidth * $snapshotWidth;
    $height = $relativeHeight * $snapshotHeight;
    
    $borderColor = imagecolorallocate($image, 82, 108, 129); 
    $fillColor = imagecolorallocatealpha($image, 103, 134, 159, 30); 
    
    imagefilledrectangle($image, round($x + 1), round($y + 1), round($x + $width - 1), round($y + $height - 1), $fillColor);
    imagerectangle($image, round($x), round($y), round($x + $width), round($y + $height), $borderColor);
}

/**
 * Rotates and flips an image resource.
 *
 * @param resource $image The image resource.
 * @param float $angle The rotation angle in degrees.
 * @param bool $flip Whether to flip the image horizontally.
 * @return resource The modified image resource.
 */
function flipImage($image, $flip) {
    if ($flip) {
        imageflip($image, IMG_FLIP_HORIZONTAL);
    }
    return $image;
}
?>
