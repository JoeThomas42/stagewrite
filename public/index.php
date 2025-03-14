<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

$current_page = "Home";
include PRIVATE_PATH . '/templates/header.php';

// Create database connection
$db = Database::getInstance();

// Check if user is logged in
$userObj = new User();
$isLoggedIn = $userObj->isLoggedIn();

// Get elements and categories
$elements = $db->fetchAll("SELECT e.*, c.category_name FROM elements e 
                          JOIN element_categories c ON e.category_id = c.category_id 
                          ORDER BY c.category_name, e.element_name");

$categories = $db->fetchAll("SELECT * FROM element_categories ORDER BY category_name");

// Get default venue
$defaultVenue = $db->fetchOne("SELECT * FROM venues WHERE venue_id = 1");

// Get all venues for the save dialog
$venues = $db->fetchAll("SELECT venue_id, venue_name FROM venues ORDER BY venue_name");
?>

<div class='page-wrapper'>
    <div class="stage-plot-container">
        <div class="elements-panel">
            <div class="elements-header">
                <h2>Stage Elements</h2>
                <select id="category-filter">
                    <option value="0">All Categories</option>
                    <?php foreach ($categories as $category): ?>
                        <option value="<?= $category['category_id'] ?>"><?= htmlspecialchars($category['category_name']) ?></option>
                    <?php endforeach; ?>
                </select>
            </div>
            
            <div class="elements-list">
                <?php foreach ($categories as $category): ?>
                    <div class="category-section" data-category-id="<?= $category['category_id'] ?>">
                        <h3><?= htmlspecialchars($category['category_name']) ?></h3>
                        <div class="elements-grid">
                            <?php 
                            foreach ($elements as $element): 
                                if ($element['category_id'] == $category['category_id']):
                            ?>
                                <div class="draggable-element" 
                                     data-element-id="<?= $element['element_id'] ?>"
                                     data-element-name="<?= htmlspecialchars($element['element_name']) ?>"
                                     data-category-id="<?= $element['category_id'] ?>"
                                     data-image="<?= htmlspecialchars($element['element_image']) ?>">
                                    <img src="/images/elements/<?= htmlspecialchars($element['element_image']) ?>" 
                                         alt="<?= htmlspecialchars($element['element_name']) ?>">
                                    <div class="element-name"><?= htmlspecialchars($element['element_name']) ?></div>
                                </div>
                            <?php 
                                endif; 
                            endforeach; 
                            ?>
                        </div>
                    </div>
                <?php endforeach; ?>
            </div>
        </div>
        
        <div class="stage-area">
            <div class="stage-controls">
                <h2 id="plot-title">New Plot</h2>
                
                <!-- New: Plot configuration panel -->
                <div class="plot-config-panel">
                    <div class="config-field">
                        <label for="venue_select">Venue:</label>
                        <select id="venue_select" name="venue_id">
                            <?php foreach ($venues as $venue): ?>
                                <option value="<?= $venue['venue_id'] ?>" <?= ($venue['venue_id'] == $defaultVenue['venue_id']) ? 'selected' : '' ?>>
                                    <?= htmlspecialchars($venue['venue_name']) ?>
                                </option>
                            <?php endforeach; ?>
                        </select>
                    </div>
                    
                    <div class="config-field">
                        <label for="event_start">Event Start:</label>
                        <input type="date" id="event_start" name="event_date_start">
                    </div>
                    
                    <div class="config-field">
                        <label for="event_end">Event End:</label>
                        <input type="date" id="event_end" name="event_date_end">
                    </div>
                </div>
            
                <div class="control-buttons">
                    <?php if ($isLoggedIn): ?>
                        <button id="save-plot" class="action-button">Save Plot</button>
                        <button id="save-changes" class="action-button hidden">Save Changes</button>
                        <button id="load-plot" class="action-button">Load Plot</button>
                    <?php endif; ?>
                    <button id="clear-plot" class="action-button">Clear Stage</button>
                </div>
            </div>
            <div id="stage" class="stage" 
                 data-venue-id="<?= $defaultVenue['venue_id'] ?>"
                 data-stage-width="<?= $defaultVenue['stage_width'] ?>"
                 data-stage-depth="<?= $defaultVenue['stage_depth'] ?>">
                <div class="front-label">FRONT OF STAGE</div>
            </div>
        </div>
    </div>
    
    <!-- Element Properties Modal -->
    <div id="element-props-modal" class="modal hidden">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h2>Element Properties</h2>
            <form id="element-props-form">
                <input type="hidden" id="element_index" name="element_index">
                
                <label for="element_label">Label:</label>
                <input type="text" id="element_label" name="element_label" maxlength="10">
                
                <label for="element_rotation">Rotation: <span id="rotation_value">0°</span></label>
                <input type="range" id="element_rotation" name="element_rotation" min="0" max="359" value="0">
                
                <div class="checkbox-group">
                    <input type="checkbox" id="element_flipped" name="element_flipped">
                    <label for="element_flipped">Flip horizontally</label>
                </div>
                
                <label for="element_notes">Notes:</label>
                <textarea id="element_notes" name="element_notes" rows="3"></textarea>
                
                <div class="form-actions">
                    <button type="submit" class="save-button">Apply</button>
                    <button type="button" class="delete-button">Delete</button>
                    <button type="button" class="cancel-button">Cancel</button>
                </div>
            </form>
        </div>
    </div>
    
    <!-- Save Plot Modal -->
    <?php if ($isLoggedIn): ?>
    <div id="save-plot-modal" class="modal hidden">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h2>Save Plot</h2>
            
            <!-- New plot name input -->
            <div class="save-section new-plot-section">
                <form id="save-new-plot-form">
                    <label for="plot_name">Plot Name:</label>
                    <input type="text" id="plot_name" name="plot_name" maxlength="20" required>
                    <div class="form-actions">
                        <button type="submit" class="save-button">Save as New</button>
                    </div>
                </form>
            </div>
            
            <!-- Existing plots section -->
            <div class="save-section existing-plots-section">
                <h3>Overwrite Existing Plot</h3>
                <div class="existing-plots-list">
                    <!-- Will be populated via JavaScript -->
                    <p class="loading-message">Loading your saved plots...</p>
                </div>
            </div>
            
            <div class="form-actions modal-bottom-actions">
                <button type="button" class="cancel-button">Cancel</button>
            </div>
        </div>
    </div>
    
    <!-- Load Plot Modal -->
    <div id="load-plot-modal" class="modal hidden">
        <div class="modal-content">
            <span class="close-button">&times;</span>
            <h2>Load Saved Plot</h2>
            <div class="saved-plots-list">
                <!-- Will be populated via AJAX -->
                <p class="loading-message">Loading your saved plots...</p>
            </div>
            <div class="form-actions">
                <button type="button" class="cancel-button">Cancel</button>
            </div>
        </div>
    </div>
    <?php endif; ?>
</div>

<!-- Include the stage plot JavaScript -->
<script src="/js/stage-plot.js"></script>

<?php include PRIVATE_PATH . '/templates/footer.php'; ?>
