<?php
/**
 * Plot Snapshot Generation
 * @package StageWrite
 */

/**
 * Generate a snapshot image of a stage plot
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
    
    // Get stage dimensions
    $stageWidth = 300;  // Default width for thumbnail
    $stageHeight = 180; // Default height for thumbnail
    
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
    
    // Ensure minimum height of 120px
    $stageHeight = max($stageHeight, 120);
    
    // Create a blank image
    $image = imagecreatetruecolor($stageWidth, $stageHeight);
    
    // Fill the background with light gray (stage background)
    $bgColor = imagecolorallocate($image, 248, 249, 250); // Light gray background
    imagefill($image, 0, 0, $bgColor);
    
    // Draw a border around the stage
    $borderColor = imagecolorallocate($image, 221, 221, 221); // #DDD
    imagerectangle($image, 0, 0, $stageWidth - 1, $stageHeight - 1, $borderColor);
    
    // Add "FRONT OF STAGE" text at the bottom
    $textColor = imagecolorallocate($image, 102, 102, 102); // #666
    $font = 1; // Built-in font - smaller for thumbnail
    $text = "FRONT OF STAGE";
    $textWidth = imagefontwidth($font) * strlen($text);
    $textHeight = imagefontheight($font);
    $x = ($stageWidth - $textWidth) / 2;
    $y = $stageHeight - $textHeight - 2;
    imagestring($image, $font, $x, $y, $text, $textColor);
    
    // Scale factor for plotting elements
    $scaleX = $stageWidth / 900; // Assuming stage is 900px wide in the UI
    $scaleY = $stageHeight / 700; // Assuming stage is 700px high in the UI
    
    // Draw each element on the image
    foreach ($elements as $element) {
        // Scale the element position and size to fit the snapshot
        $x = $element['x_position'] * $scaleX;
        $y = $element['y_position'] * $scaleY;
        $width = $element['width'] * $scaleX;
        $height = $element['height'] * $scaleY;
        
        // Draw a rectangle for each element
        $elementColor = imagecolorallocate($image, 82, 108, 129); // Primary color
        $fillColor = imagecolorallocate($image, 103, 134, 159); // Lighter fill
        
        // Draw rotated element if needed
        if ($element['rotation'] != 0) {
            // For simplicity in the thumbnail, just draw a rectangle without rotation
            imagefilledrectangle($image, $x, $y, $x + $width, $y + $height, $fillColor);
            imagerectangle($image, $x, $y, $x + $width, $y + $height, $elementColor);
        } else {
            // Draw regular element
            imagefilledrectangle($image, $x, $y, $x + $width, $y + $height, $fillColor);
            imagerectangle($image, $x, $y, $x + $width, $y + $height, $elementColor);
        }
        
        // Add label if present (only if element is large enough)
        if (!empty($element['label']) && $width > 20 && $height > 10) {
            $labelColor = imagecolorallocate($image, 255, 255, 255); // White
            $labelFont = 1; // Smallest built-in font for thumbnail
            $labelX = $x + 1;
            $labelY = $y + $height - imagefontheight($labelFont) - 1;
            imagestring($image, $labelFont, $labelX, $labelY, $element['label'], $labelColor);
        }
    }
    
    // Generate a unique filename based on plot ID and timestamp
    $filename = 'plot_' . $plotId . '_' . time() . '.png';
    $filePath = $snapshotDir . '/' . $filename;
    
    // Save the image
    imagepng($image, $filePath);
    imagedestroy($image);
    
    // Return the filename if successful
    return file_exists($filePath) ? $filename : null;
}
