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

// Get all venues for the save dialog
$venues = $db->fetchAll("SELECT venue_id, venue_name FROM venues ORDER BY venue_name");

// Get user's custom venues if logged in
$userVenues = [];
if ($isLoggedIn) {
    $userVenues = $db->fetchAll("SELECT user_venue_id, venue_name, stage_width, stage_depth FROM user_venues 
                               WHERE user_id = ? ORDER BY venue_name", 
                               [$_SESSION['user_id']]);
}
?>

<div id="stage-plot-container">
    <div id="elements-panel">
        <div id="elements-header">
            <h2>Stage Elements</h2>
            <select id="category-filter">
                <option value="0">All Categories</option>
                <?php foreach ($categories as $category): ?>
                    <option value="<?= $category['category_id'] ?>"><?= htmlspecialchars($category['category_name']) ?></option>
                <?php endforeach; ?>
            </select>
        </div>
        
        <div id="elements-list">
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
    
    <div id="stage-area">
        <div id="stage-controls">
            <h2 id="plot-title">New Plot</h2>
            
            <!-- Plot configuration panel -->
            <div class="plot-config-panel">
                <div class="config-field venue-select-container">
                    <label for="venue_select">Venue:</label>
                    <div class="select-with-button">
                        <select id="venue_select" name="venue_id">
                            <option value="" selected>No Venue</option>
                            <?php if (count($venues) > 0): ?>
                            <optgroup label="Official Venues">
                                <?php foreach ($venues as $venue): ?>
                                    <option value="<?= $venue['venue_id'] ?>">
                                        <?= htmlspecialchars($venue['venue_name']) ?>
                                    </option>
                                <?php endforeach; ?>
                            </optgroup>
                            <?php endif; ?>
                            
                            <?php if ($isLoggedIn && count($userVenues) > 0): ?>
                            <optgroup label="My Venues">
                                <?php foreach ($userVenues as $venue): ?>
                                    <option value="user_<?= $venue['user_venue_id'] ?>">
                                        <?= htmlspecialchars($venue['venue_name']) ?>
                                    </option>
                                <?php endforeach; ?>
                            </optgroup>
                            <?php endif; ?>
                        </select>
                        <?php if ($isLoggedIn): ?>
                        <button type="button" id="add-venue-button" class="small-button" title="Add Custom Venue"><i class="fa-solid fa-plus"></i></button>
                        <?php endif; ?>
                    </div>
                </div>
                
                <div class="config-field">
                    <label for="event_start">Event Start:</label>
                    <input type="date" id="event_start" name="event_date_start">
                </div>
                
                <div class="config-field">
                    <label for="event_end">Event End:</label>
                    <input type="date" id="event_end" name="event_date_end" min="">
                </div>
            </div>
        
            <div id="control-buttons">
              <button id="new-plot" class="action-button" title="New Plot"><i class="fa-solid fa-file-circle-plus"></i></button>
              <?php if ($isLoggedIn): ?>
                <button id="my-plots" class="action-button" title="My Plots"><i class="fa-solid fa-folder-open"></i></button>
                <button id="save-plot" class="action-button" title="Save As"><i class="fa-solid fa-floppy-disk"></i></button>
                <button id="save-changes" class="action-button hidden">Save Changes</button>
                <?php endif; ?>
                <button id="clear-plot" class="action-button" title="Clear Stage"><i class="fa-solid fa-trash"></i></button>
            </div>
        </div>
        <div id="stage"
              data-venue-id="<?= $venue['venue_id'] ?>"
              data-stage-width="<?= $venue['stage_width'] ?>"
              data-stage-depth="<?= $venue['stage_depth'] ?>">
            <div id="front-label">FRONT OF STAGE</div>
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
            
            <label for="element_notes">Notes:</label>
            <textarea id="element_notes" name="element_notes" rows="3"></textarea>
            
            <div class="form-actions">
                <button type="submit" class="save-button">Apply</button>
                <button type="button" class="delete-button" title="Delete Element">Delete</button>
                <button type="button" class="cancel-button">Cancel</button>
            </div>
        </form>
    </div>
</div>

<!-- Add Custom Venue Modal -->
<?php if ($isLoggedIn): ?>
<div id="add-venue-modal" class="modal hidden">
    <div class="modal-content">
        <span class="close-button">&times;</span>
        <h2>Add Custom Venue</h2>
        <form id="add-venue-form">
            <div class="form-group">
                <label for="venue_name">Venue Name:</label>
                <input type="text" id="venue_name" name="venue_name" maxlength="100" required>
            </div>
            
            <div class="form-group">
                <label for="venue_street">Street Address:</label>
                <input type="text" id="venue_street" name="venue_street" maxlength="100">
            </div>
            
            <div class="form-row">
                <div class="form-group">
                    <label for="venue_state_id">State:</label>
                    <select id="venue_state_id" name="venue_state_id">
                        <option value="" selected disabled>Select State</option>
                        <?php
                        $states = $db->fetchAll("SELECT state_id, state_name, state_abbr FROM states ORDER BY state_name");
                        foreach ($states as $state) {
                            echo "<option value='{$state['state_id']}'>{$state['state_name']}</option>";
                        }
                        ?>
                    </select>
                </div>

                <div class="form-group">
                    <label for="venue_city">City:</label>
                    <input type="text" id="venue_city" name="venue_city" maxlength="100">
                </div>
                
                <div class="form-group">
                    <label for="venue_zip">ZIP:</label>
                    <input type="text" id="venue_zip" name="venue_zip" maxlength="5">
                </div>
            </div>
            
            <div class="input-dimensions">
              <div class="form-group">
                  <label for="stage_width">Stage Width (feet):</label>
                  <input type="number" id="stage_width" name="stage_width" min="1" max="200" step="1">
              </div>
              
              <div class="form-group">
                  <label for="stage_depth">Stage Depth (feet):</label>
                  <input type="number" id="stage_depth" name="stage_depth" min="1" max="200" step="1">
              </div>
            </div>
            
            <div class="form-actions">
                <button type="submit" class="save-button">Save Venue</button>
                <button type="button" class="cancel-button">Cancel</button>
            </div>
        </form>
    </div>
</div>
<?php endif; ?>

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
                <input type="text" id="plot_name" name="plot_name" maxlength="20">
                <div class="form-actions">
                    <button type="submit" id="save-new-button">Save as New</button>
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
<div id="my-plots-modal" class="modal hidden">
    <div class="modal-content">
        <span class="close-button">&times;</span>
        <h2>My Plots</h2>
        <div class="saved-plots-list">
            <!-- Will be populated via Javascript -->
            <p class="loading-message">Loading your saved plots...</p>
        </div>
        <div class="form-actions">
            <button type="button" class="cancel-button">Cancel</button>
        </div>
    </div>
</div>

<?php 
endif;

include PRIVATE_PATH . '/templates/footer.php';
?>
