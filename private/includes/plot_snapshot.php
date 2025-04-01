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
    
    // Get stage dimensions
    $stageWidth = 600;  // Default width for thumbnail (increased for better detail)
    $stageHeight = 360; // Default height for thumbnail
    
    // If venue is specified, get its dimensions
    if ($venueId) {
        $venue = $db->fetchOne("SELECT stage_width, stage_depth FROM venues WHERE venue_id = ?", [$venueId]);
        if ($venue) {
            // Use the venue dimensions to calculate the aspect ratio
            $aspectRatio = $venue['stage_depth'] / $venue['stage_width'];
            $stageHeight = round($stageWidth * $aspectRatio);
        }
    } elseif ($userVenueId) {
        $userVenue = $db->fetchOne(
            "SELECT stage_width, stage_depth FROM user_venues WHERE user_venue_id = ?", 
            [$userVenueId]
        );
        if ($userVenue && $userVenue['stage_width'] && $userVenue['stage_depth']) {
            // Use the user venue dimensions
            $aspectRatio = $userVenue['stage_depth'] / $userVenue['stage_width'];
            $stageHeight = round($stageWidth * $aspectRatio);
        }
    }
    
    // Ensure minimum height of 180px
    $stageHeight = max($stageHeight, 180);
    
    // Create a blank image with a slightly larger canvas to accommodate rotations
    $image = imagecreatetruecolor($stageWidth, $stageHeight);
    
    // Enable alpha blending
    imagealphablending($image, true);
    imagesavealpha($image, true);
    
    // Fill the background with light gray (stage background)
    $bgColor = imagecolorallocate($image, 248, 249, 250); // Light gray background
    imagefill($image, 0, 0, $bgColor);
    
    // Draw a border around the stage
    $borderColor = imagecolorallocate($image, 221, 221, 221); // #DDD
    imagerectangle($image, 0, 0, $stageWidth - 1, $stageHeight - 1, $borderColor);
    
    // Add "FRONT OF STAGE" text at the bottom
    $textColor = imagecolorallocate($image, 102, 102, 102); // #666
    $font = 2; // Slightly larger font
    $text = "FRONT OF STAGE";
    $textWidth = imagefontwidth($font) * strlen($text);
    $textHeight = imagefontheight($font);
    $x = ($stageWidth - $textWidth) / 2;
    $y = $stageHeight - $textHeight - 5;
    imagestring($image, $font, $x, $y, $text, $textColor);
    
    // Scale factor for plotting elements
    $scaleX = $stageWidth / 900; // Assuming stage is 900px wide in the UI
    $scaleY = $stageHeight / 700; // Assuming stage is 700px high in the UI
    
    // Sort elements by z-index to maintain proper layering
    usort($elements, function($a, $b) {
        return $a['z_index'] - $b['z_index'];
    });
    
    // Draw each element on the image
    foreach ($elements as $element) {
        // Get element details from the database to get the image filename
        $elementDetails = $db->fetchOne(
            "SELECT e.element_name, e.element_image 
             FROM elements e 
             WHERE e.element_id = ?",
            [$element['element_id']]
        );
        
        if (!$elementDetails) {
            // Fallback to rectangle if element not found
            drawElementAsRectangle($image, $element, $scaleX, $scaleY);
            continue;
        }
        
        // Scale the element position and size to fit the snapshot
        $x = $element['x_position'] * $scaleX;
        $y = $element['y_position'] * $scaleY;
        $width = $element['width'] * $scaleX;
        $height = $element['height'] * $scaleY;
        
        // Attempt to load element image
        $elementImagePath = PUBLIC_PATH . '/images/elements/' . $elementDetails['element_image'];
        
        if (file_exists($elementImagePath)) {
            // Determine image type and load accordingly
            $imageInfo = getimagesize($elementImagePath);
            $elementImg = null;
            
            switch ($imageInfo[2]) {
                case IMAGETYPE_JPEG:
                    $elementImg = imagecreatefromjpeg($elementImagePath);
                    break;
                case IMAGETYPE_PNG:
                    $elementImg = imagecreatefrompng($elementImagePath);
                    // Enable alpha blending for PNG
                    imagealphablending($elementImg, true);
                    imagesavealpha($elementImg, true);
                    break;
                case IMAGETYPE_GIF:
                    $elementImg = imagecreatefromgif($elementImagePath);
                    break;
            }
            
            if ($elementImg) {
                // Resize the element image to match the desired dimensions
                $resizedImg = imagecreatetruecolor($width, $height);
                // Enable alpha blending for transparency
                imagealphablending($resizedImg, true);
                imagesavealpha($resizedImg, true);
                // Fill with transparent background
                $transparent = imagecolorallocatealpha($resizedImg, 255, 255, 255, 127);
                imagefill($resizedImg, 0, 0, $transparent);
                
                // Resize the element image
                imagecopyresampled(
                    $resizedImg, $elementImg,
                    0, 0, 0, 0,
                    $width, $height,
                    imagesx($elementImg), imagesy($elementImg)
                );
                
                // Handle rotation if needed
                if ($element['rotation'] != 0 || $element['flipped'] == 1) {
                    $resizedImg = rotateAndFlipImage(
                        $resizedImg, 
                        $element['rotation'], 
                        $element['flipped'] == 1
                    );
                    
                    // Recalculate dimensions after rotation
                    $newWidth = imagesx($resizedImg);
                    $newHeight = imagesy($resizedImg);
                    
                    // Adjust position to center the rotated image
                    $x = $x - ($newWidth - $width) / 2;
                    $y = $y - ($newHeight - $height) / 2;
                }
                
                // Place the element on the stage
                imagecopy(
                    $image, $resizedImg,
                    $x, $y, 0, 0,
                    imagesx($resizedImg), imagesy($resizedImg)
                );
                
                // Clean up temporary images
                imagedestroy($resizedImg);
                imagedestroy($elementImg);
            } else {
                // Fallback to rectangle if image couldn't be loaded
                drawElementAsRectangle($image, $element, $scaleX, $scaleY);
            }
        } else {
            // Fallback to rectangle if image file doesn't exist
            drawElementAsRectangle($image, $element, $scaleX, $scaleY);
        }
        
        // Add label if present
        if (!empty($element['label'])) {
            // Create semi-transparent label background
            $labelBgColor = imagecolorallocatealpha($image, 82, 108, 129, 30); // Semi-transparent blue
            $labelTextColor = imagecolorallocate($image, 255, 255, 255); // White text
            $labelFont = 1; // Small font for label
            
            // Calculate label position (bottom of element)
            $labelX = $x + 2;
            $labelY = $y + $height - imagefontheight($labelFont) - 2;
            $labelWidth = imagefontwidth($labelFont) * strlen($element['label']) + 4;
            $labelHeight = imagefontheight($labelFont) + 2;
            
            // Draw label background
            imagefilledrectangle(
                $image,
                $labelX - 1, $labelY - 1,
                $labelX + $labelWidth, $labelY + $labelHeight,
                $labelBgColor
            );
            
            // Draw label text
            imagestring($image, $labelFont, $labelX + 1, $labelY, $element['label'], $labelTextColor);
        }
    }
    
    // Add a drop shadow effect to make the stage pop
    $shadow = imagecreatetruecolor($stageWidth, $stageHeight);
    $shadowColor = imagecolorallocate($shadow, 0, 0, 0);
    $transparent = imagecolorallocate($shadow, 255, 255, 255);
    imagefilledrectangle($shadow, 0, 0, $stageWidth - 1, $stageHeight - 1, $transparent);
    imagefilledrectangle($shadow, 3, 3, $stageWidth - 1, $stageHeight - 1, $shadowColor);
    
    // Apply shadow with transparency
    imagecopymerge($image, $shadow, 0, 0, 0, 0, $stageWidth, $stageHeight, 15); // 15% opacity
    imagedestroy($shadow);
    
    // Generate filename - either use existing or create new one
    if ($existingSnapshot && !empty($existingSnapshot['snapshot_filename'])) {
        $filename = $existingSnapshot['snapshot_filename'];
        // Delete the existing file if it exists
        $oldFilePath = $snapshotDir . '/' . $filename;
        if (file_exists($oldFilePath)) {
            unlink($oldFilePath);
        }
    } else {
        // No existing snapshot, create a new consistent filename (without timestamp)
        $filename = 'plot_' . $plotId . '.png';
    }
    
    $filePath = $snapshotDir . '/' . $filename;
    
    // Save the image
    if (imagepng($image, $filePath, 8)) { // 8 is compression level (0-9)
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
 * @param float $scaleX - X scale factor
 * @param float $scaleY - Y scale factor
 */
function drawElementAsRectangle($image, $element, $scaleX, $scaleY) {
    // Scale the element position and size
    $x = $element['x_position'] * $scaleX;
    $y = $element['y_position'] * $scaleY;
    $width = $element['width'] * $scaleX;
    $height = $element['height'] * $scaleY;
    
    // Draw a stylish rectangle for each element
    $borderColor = imagecolorallocate($image, 82, 108, 129); // Primary color
    $fillColor = imagecolorallocatealpha($image, 103, 134, 159, 30); // Lighter fill with transparency
    
    // Create a slightly rounded effect with multiple rectangles
    imagefilledrectangle($image, $x + 1, $y + 1, $x + $width - 1, $y + $height - 1, $fillColor);
    imagerectangle($image, $x, $y, $x + $width, $y + $height, $borderColor);
    
    // Add a slight 3D effect
    $highlightColor = imagecolorallocatealpha($image, 255, 255, 255, 70);
    $shadowColor = imagecolorallocatealpha($image, 0, 0, 0, 70);
    
    // Top and left highlight
    imageline($image, $x + 1, $y + 1, $x + $width - 1, $y + 1, $highlightColor);
    imageline($image, $x + 1, $y + 1, $x + 1, $y + $height - 1, $highlightColor);
    
    // Bottom and right shadow
    imageline($image, $x + 1, $y + $height - 1, $x + $width - 1, $y + $height - 1, $shadowColor);
    imageline($image, $x + $width - 1, $y + 1, $x + $width - 1, $y + $height - 1, $shadowColor);
}
?>
