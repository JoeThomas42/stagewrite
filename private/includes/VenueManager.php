<?php

/**
 * Venue management
 * @package StageWrite
 */
class VenueManager
{
  private $db;

  /**
   * Constructor
   */
  public function __construct()
  {
    $this->db = Database::getInstance();
  }

  /**
   * Get venue by ID
   * * @param int $venueId Venue ID
   * @return array|false Venue data or false
   */
  public function getVenue($venueId)
  {
    return $this->db->fetchOne(
      "SELECT * FROM venues WHERE venue_id = ?",
      [$venueId]
    );
  }

  /**
   * Create or update venue
   * * @param array $venueData Venue data
   * @return bool Success or failure
   */
  public function saveVenue($venueData)
  {
    $isNew = empty($venueData['venue_id']);
    
    error_log('Attempting to ' . ($isNew ? 'create' : 'update') . ' venue with data: ' . print_r($venueData, true));
  
    try {
      if ($isNew) {
        error_log('Executing INSERT query for new venue');
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
        
        $rowCount = $result->rowCount();
        error_log('INSERT query completed with ' . $rowCount . ' rows affected');
        return $rowCount > 0;
        
      } else {
        error_log('Executing UPDATE query for venue ID: ' . $venueData['venue_id']);
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
        
        // Check if any rows were affected
        $rowCount = $result->rowCount();
        error_log('UPDATE query completed with ' . $rowCount . ' rows affected');
        return $rowCount > 0;
      }
    } catch (Exception $e) {
      error_log('Error in VenueManager::saveVenue: ' . $e->getMessage());
      error_log('SQL State: ' . $e->getCode());
      error_log('Stack trace: ' . $e->getTraceAsString());
      throw $e;
    }
  }

  /**
   * Delete a venue and reassign its plots to a default venue.
   * * @param int $venueId Venue ID
   * @return bool Success or failure
   */
  public function deleteVenue($venueId)
  {
    try {
      $exists = $this->db->fetchOne(
        "SELECT venue_id FROM venues WHERE venue_id = ?",
        [$venueId]
      );

      if (!$exists) {
        return false;
      }

      $usageCount = $this->db->fetchOne(
        "SELECT COUNT(*) as count FROM saved_plots WHERE venue_id = ?",
        [$venueId]
      );

      if ($usageCount && $usageCount['count'] > 0) {
        $this->db->query(
          "UPDATE saved_plots SET venue_id = 1 WHERE venue_id = ?",
          [$venueId]
        );
      }

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
   * * @param array $data Venue data
   * @return array Array of errors or empty array if valid
   */
  public function validateVenueData($data)
  {
    error_log('Validating venue data: ' . print_r($data, true));
    $errors = [];
  
    if (empty($data['venue_name'])) {
      error_log('Validation error: venue_name is empty');
      $errors['venue_name'] = 'Venue name is required';
    }
  
    if (empty($data['stage_width'])) {
      error_log('Validation error: stage_width is empty');
      $errors['stage_width'] = 'Stage width is required';
    } else if (!filter_var($data['stage_width'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 200]])) {
      error_log('Validation error: stage_width is not a valid integer between 1-200: ' . $data['stage_width']);
      $errors['stage_width'] = 'Stage width must be between 1 and 200';
    }
  
    if (empty($data['stage_depth'])) {
      error_log('Validation error: stage_depth is empty');
      $errors['stage_depth'] = 'Stage depth is required';
    } else if (!filter_var($data['stage_depth'], FILTER_VALIDATE_INT, ['options' => ['min_range' => 1, 'max_range' => 200]])) {
      error_log('Validation error: stage_depth is not a valid integer between 1-200: ' . $data['stage_depth']);
      $errors['stage_depth'] = 'Stage depth must be between 1 and 200';
    }
  
    if (!empty($data['venue_zip']) && !preg_match('/^\d{5}$/', $data['venue_zip'])) {
      error_log('Validation error: venue_zip is not a valid 5-digit code: ' . $data['venue_zip']);
      $errors['venue_zip'] = 'ZIP code must be 5 digits';
    }
  
    error_log('Validation complete. Errors found: ' . count($errors));
    return $errors;
  }
}
