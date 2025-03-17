<?php
/**
 * Venue management
 * @package StageWrite
 */
class VenueManager {
    private $db;
    
    /**
     * Constructor
     */
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Get venue by ID
     * 
     * @param int $venueId Venue ID
     * @return array|false Venue data or false
     */
    public function getVenue($venueId) {
        return $this->db->fetchOne(
            "SELECT * FROM venues WHERE venue_id = ?",
            [$venueId]
        );
    }
    
    /**
     * Create or update venue
     * 
     * @param array $venueData Venue data
     * @return bool Success or failure
     */
    public function saveVenue($venueData) { 
        // Determine if this is an update or insert
        $isNew = empty($venueData['venue_id']);
        
        try {
            if ($isNew) {
                // Insert new venue
                $result = $this->db->query(
                    "INSERT INTO venues (venue_name, venue_street, venue_city, venue_state_id, venue_zip, stage_width, stage_depth) 
                     VALUES (?, ?, ?, ?, ?, ?, ?)",
                    [
                        $venueData['venue_name'],
                        $venueData['venue_street'] ?? '',
                        $venueData['venue_city'] ?? '',
                        $venueData['venue_state_id'] ?: null,
                        $venueData['venue_zip'] ?? '',
                        $venueData['stage_width'],
                        $venueData['stage_depth']
                    ]
                );
            } else {
                // Update existing venue
                $result = $this->db->query(
                    "UPDATE venues SET 
                        venue_name = ?,
                        venue_street = ?,
                        venue_city = ?,
                        venue_state_id = ?,
                        venue_zip = ?,
                        stage_width = ?,
                        stage_depth = ?
                     WHERE venue_id = ?",
                    [
                        $venueData['venue_name'],
                        $venueData['venue_street'] ?? '',
                        $venueData['venue_city'] ?? '',
                        $venueData['venue_state_id'] ?: null,
                        $venueData['venue_zip'] ?? '',
                        $venueData['stage_width'],
                        $venueData['stage_depth'],
                        $venueData['venue_id']
                    ]
                );
            }
            
            return true;
        } catch (Exception $e) {
            error_log('Error saving venue: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Delete a venue and reassign its events
     * 
     * @param int $venueId Venue ID
     * @return bool Success or failure
     */
    public function deleteVenue($venueId) {     
        try {
            // Check if venue exists
            $exists = $this->db->fetchOne(
                "SELECT venue_id FROM venues WHERE venue_id = ?",
                [$venueId]
            );
            
            if (!$exists) {
                return false;
            }
            
            // First check if venue is used in any plots
            $usageCount = $this->db->fetchOne(
                "SELECT COUNT(*) as count FROM saved_plots WHERE venue_id = ?",
                [$venueId]
            );
            
            if ($usageCount && $usageCount['count'] > 0) {
                // Update saved plots to use default venue (ID 1)
                $this->db->query(
                    "UPDATE saved_plots SET venue_id = 1 WHERE venue_id = ?",
                    [$venueId]
                );
            }
            
            // Delete the venue
            $result = $this->db->query(
                "DELETE FROM venues WHERE venue_id = ?",
                [$venueId]
            );
            
            return $result->rowCount() > 0;
        } catch (Exception $e) {
            error_log('Error deleting venue: ' . $e->getMessage());
            return false;
        }
    }
    
    /**
     * Validate venue data
     * 
     * @param array $data Venue data
     * @return array Array of errors or empty array if valid
     */
    public function validateVenueData($data) {
        $errors = [];
        
        if (empty($data['venue_name'])) {
            $errors['venue_name'] = 'Venue name is required';
        }
        
        if (empty($data['stage_width'])) {
            $errors['stage_width'] = 'Stage width is required';
        } else if (!filter_var($data['stage_width'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 200]])) {
            $errors['stage_width'] = 'Stage width must be between 1 and 200';
        }
        
        if (empty($data['stage_depth'])) {
            $errors['stage_depth'] = 'Stage depth is required';
        } else if (!filter_var($data['stage_depth'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 200]])) {
            $errors['stage_depth'] = 'Stage depth must be between 1 and 200';
        }
        
        // ZIP code validation if provided
        if (!empty($data['venue_zip']) && !preg_match('/^\d{5}$/', $data['venue_zip'])) {
            $errors['venue_zip'] = 'ZIP code must be 5 digits';
        }
        
        return $errors;
    }
}
