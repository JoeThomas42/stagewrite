<?php
require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Check if this is a 404 redirect and store in session
if (isset($_GET['notfound']) && $_GET['notfound'] == 1) {
  $_SESSION['show_not_found_notification'] = true;
  $cleanUrl = strtok($_SERVER['REQUEST_URI'], '?');
  if ($cleanUrl !== '/') {
    header("Location: /");
    exit;
  }
}

$current_page = "Plotter";
include PRIVATE_PATH . '/templates/header.php';

// Create database connection
$db = Database::getInstance();

// Check if user is logged in
$userObj = new User();
$isLoggedIn = $userObj->isLoggedIn();

// Get elements and categories, including sub_category_id for elements
$elements = $db->fetchAll("SELECT e.*, c.category_name, e.sub_category_id
                          FROM elements e
                          JOIN element_categories c ON e.category_id = c.category_id
                          ORDER BY c.category_name, e.element_name");

// Fetch categories, ensuring Favorites (ID 1) is handled separately
$allCategories = $db->fetchAll("SELECT * FROM element_categories ORDER BY category_name");
$favoritesCategory = null;
$otherCategories = [];

// Define Instrument Subcategories (Map ID to Title)
$instrumentSubcategories = [
  1 => "String",
  2 => "Percussion",
  3 => "Keys",
  4 => "Brass",
  5 => "Wood Wind",
  6 => "DJ",
  10 => "Other"
];
$instrumentsCategoryId = 3;

foreach ($allCategories as $category) {
  if ($category['category_id'] == 1) {
    $favoritesCategory = $category;
  } else {
    $otherCategories[] = $category;
  }
}

// Get all venues for the save dialog
$venues = $db->fetchAll("SELECT venue_id, venue_name FROM venues ORDER BY venue_name");

// Get user's custom venues if logged in
$userVenues = [];
if ($isLoggedIn) {
  $userVenues = $db->fetchAll(
    "SELECT user_venue_id, venue_name, stage_width, stage_depth FROM user_venues
                                WHERE user_id = ? ORDER BY venue_name",
    [$_SESSION['user_id']]
  );
}
?>

<div id="mobile-restriction-message">
  <h2>Desktop Or Tablet Required</h2>
  <p>The stage plotting feature requires a larger screen for optimal use.</p>
  <p>Please access this feature from a tablet (landscape mode) or desktop computer.</p>
  <p>You can still view and manage your saved plots in the Portfolio section.</p>
  <?php if ($isLoggedIn): ?>
    <button class="primary-button"><a href="portfolio.php" style="color: inherit; text-decoration: none;">Go to Portfolio</a></button>
  <?php else: ?>
    <button id="mobile-login-trigger" class="primary-button">Login or Signup</button>
  <?php endif; ?>
</div>

<div id="stage-plot-container">
  <div id="elements-panel">
    <h2>Stage Elements</h2>
    <p>Drag elements to the stage</p>

    <div id="elements-list" class="accordion-container">
      <?php
      // Render Favorites category first if it exists and set it as initially expanded
      if ($favoritesCategory):
        $currentCategory = $favoritesCategory;
        $isExpanded = true; // Favorites is expanded by default
      ?>
        <div class="category-section favorites-section accordion-item" data-category-id="<?= $currentCategory['category_id'] ?>">
          <h3 class="accordion-header <?= $isExpanded ? 'active' : '' ?>">
            <?= htmlspecialchars($currentCategory['category_name']) ?>
            <span class="accordion-icon"></span>
          </h3>
          <div class="accordion-content elements-grid <?= $isExpanded ? 'expanded' : '' ?>">
            <p class="no-favorites-message">No favorites yet. Click the ☆ icon on any element.</p>
          </div>
        </div>
      <?php endif; ?>

      <?php
      // Render other categories - all collapsed initially
      foreach ($otherCategories as $currentCategory):
        $isExpanded = false; // Other categories start collapsed
        $categoryId = $currentCategory['category_id'];
      ?>
        <div class="category-section accordion-item" data-category-id="<?= $categoryId ?>">
          <h3 class="accordion-header <?= $isExpanded ? 'active' : '' ?>">
            <?= htmlspecialchars($currentCategory['category_name']) ?>
            <span class="accordion-icon"></span>
          </h3>
          <div class="accordion-content elements-grid <?= $isExpanded ? 'expanded' : '' ?>">
            <?php
            // Filter elements for the current category
            $categoryElements = array_filter($elements, function ($el) use ($categoryId) {
              return $el['category_id'] == $categoryId;
            });

            // Special handling for Instruments category (ID 3)
            if ($categoryId == $instrumentsCategoryId) {
              // Group elements by subcategory
              $elementsBySubcategory = [];
              foreach ($categoryElements as $element) {
                $subCatId = $element['sub_category_id'] ?? 10; // Default to 'Other' if null
                if (!isset($elementsBySubcategory[$subCatId])) {
                  $elementsBySubcategory[$subCatId] = [];
                }
                $elementsBySubcategory[$subCatId][] = $element;
              }

              // Iterate through defined subcategories and render if elements exist
              foreach ($instrumentSubcategories as $subCatId => $subCatTitle) {
                if (isset($elementsBySubcategory[$subCatId]) && count($elementsBySubcategory[$subCatId]) > 0) {
                  echo '<h4 class="subcategory-header">' . htmlspecialchars($subCatTitle) . '</h4>';
                  foreach ($elementsBySubcategory[$subCatId] as $element):
            ?>
                    <div class="draggable-element"
                      data-element-id="<?= $element['element_id'] ?>"
                      data-element-name="<?= htmlspecialchars($element['element_name']) ?>"
                      data-category-id="<?= $element['category_id'] ?>"
                      data-image="<?= htmlspecialchars($element['element_image']) ?>"
                      data-sub-category-id="<?= $element['sub_category_id'] ?? '' ?>">
                      <img src="/images/elements/<?= htmlspecialchars($element['element_image']) ?>"
                        alt="<?= htmlspecialchars($element['element_name']) ?>">
                      <div class="element-name"><?= htmlspecialchars($element['element_name']) ?></div>
                    </div>
                <?php
                  endforeach;
                }
              }
            } else {
              // Default rendering for other categories
              foreach ($categoryElements as $element):
                ?>
                <div class="draggable-element"
                  data-element-id="<?= $element['element_id'] ?>"
                  data-element-name="<?= htmlspecialchars($element['element_name']) ?>"
                  data-category-id="<?= $element['category_id'] ?>"
                  data-image="<?= htmlspecialchars($element['element_image']) ?>"
                  data-sub-category-id="<?= $element['sub_category_id'] ?? '' ?>">
                  <img src="/images/elements/<?= htmlspecialchars($element['element_image']) ?>"
                    alt="<?= htmlspecialchars($element['element_name']) ?>">
                  <div class="element-name"><?= htmlspecialchars($element['element_name']) ?></div>
                </div>
            <?php
              endforeach;
            } // End of category type check
            ?>
          </div>
        </div> <?php endforeach; ?>
    </div>
  </div>
  <div id="stage-area">
    <div id="stage-controls">
      <h2 id="plot-title">New Plot</h2>

      <div id="venue-info-container">
        <div class="venue-config-panel">
          <div class="config-field venue-select-container">
            <label for="venue_select">Venue Select:</label>
            <div class="select-with-button">
              <select id="venue_select" name="venue_select">
                <option value="" selected>Select Venue</option>

                <?php if ($isLoggedIn && count($userVenues) > 0): ?>
                  <optgroup label="My Venues">
                    <?php foreach ($userVenues as $venue): ?>
                      <option value="user_<?= $venue['user_venue_id'] ?>">
                        <?= htmlspecialchars($venue['venue_name']) ?>
                      </option>
                    <?php endforeach; ?>
                  </optgroup>
                <?php endif; ?>

                <?php if (count($venues) > 0): ?>
                  <optgroup label="Official Venues">
                    <?php foreach ($venues as $venue): ?>
                      <option value="<?= $venue['venue_id'] ?>">
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

          <div id="date-container">
            <div class="config-field">
              <label for="event_start">Event Start:</label>
              <input type="date" id="event_start" name="event_date_start">
            </div>
            <div class="config-field">
              <label for="event_end">Event End:</label>
              <input type="date" id="event_end" name="event_date_end" min="">
            </div>
          </div>
        </div>
        <div id="venue-info-panel" class="venue-info-panel">
          <h3>Venue Information</h3>
          <div class="venue-details">
            <p><strong>Name:</strong> <span id="venue-info-name">N/A</span></p>
            <p><strong>Address:</strong> <span id="venue-info-address">N/A</span></p>
            <p><strong>Stage:</strong> <span id="venue-info-stage">N/A</span></p>
          </div>
          <p class="no-venue-selected">No venue selected.</p>
        </div>
      </div>
    </div>

    <div id="control-buttons">
      <div id="edit-buttons">
        <button id="new-plot" class="action-button" title="New Plot"><i class="fa-solid fa-file-circle-plus"></i></button>
        <?php if ($isLoggedIn): ?>
          <button id="my-plots" class="action-button" title="Load Plot"><i class="fa-solid fa-folder-open"></i></button>
          <button id="share-plot" class="action-button" title="Print / Share"><i class="fa-solid fa-share-from-square"></i></button>
          <button id="save-plot" class="action-button" title="Save As"><i class="fa-solid fa-floppy-disk"></i></button>
          <button id="save-changes" class="action-button hidden">Save Changes</button>
        <?php else: ?>
          <span id="login-prompt">Log in or sign up to save and share your plot!</span>
        <?php endif; ?>
      </div>
      <div id="delete-buttons">
        <button id="delete-selected" class="action-button hidden" title="">Delete Selected</button>
        <button id="clear-plot" class="action-button" title="Clear Stage"><i class="fa-solid fa-trash"></i></button>
      </div>
    </div>

    <div id="stage"
      data-venue-id="<?= $venue['venue_id'] ?? '' ?>"
      data-stage-width="<?= $venue['stage_width'] ?? '20' ?>"
      data-stage-depth="<?= $venue['stage_depth'] ?? '15' ?>">
      <div id="stage-tips">
        <div class="tip-item">Lasso or <kbd>Shift</kbd> + <span class="action-icon"><i class="fa-solid fa-hand-pointer"></i></span> = Multi-select</div>
        <div class="tip-item"> | </div>
        <div class="tip-item"><kbd>Ctrl</kbd> + <span class="action-icon"><i class="fa-solid fa-hand"></i></span> + <span class="action-icon"><i class="fa-solid fa-arrows-up-down-left-right"></i></span> = Duplicate</div>
      </div>
      <div id="front-label">FRONT OF STAGE</div>
    </div>
  </div>
</div>
<div id="stage-info-container">
  <div class="input-list-section">
    <h2>Aux Input List</h2>
    <p>Keep track of additional a/v inputs</p>

    <div id="input-list" class="input-grid"></div>
    <datalist id="input-suggestions"></datalist>
    <button id="add-input-line" class="primary-button add-line-button">
      <i class="fa-solid fa-plus"></i> Add Line
    </button>
  </div>

  <div class="element-info">
    <h2>Stage Element List</h2>
    <p>Click on an element to edit or remove</p>

    <ol id="element-info-list">
      <li class="no-elements-message">No elements placed yet.</li>
    </ol>
  </div>
</div>

<div id="element-props-modal" class="modal hidden">
  <div class="modal-content">
    <span class="close-button">&times;</span>
    <h2>Element Properties</h2>
    <form id="element-props-form">
      <input type="hidden" id="element_index" name="element_index">

      <div>
        <label for="element_label">Label:</label>
        <input type="text" id="element_label" name="element_label" maxlength="10">
      </div>

      <div>
        <label for="element_notes">Notes:</label>
        <textarea id="element_notes" name="element_notes" rows="3"></textarea>
      </div>

      <div class="form-actions">
        <button type="submit" class="save-button">Apply</button>
        <button type="button" class="delete-button" title="Delete Element">Delete</button>
        <button type="button" class="cancel-button">Cancel</button>
      </div>
    </form>
    <div class="modal-notification-area"></div>
  </div>
</div>

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
            <label for="venue_city">City:</label>
            <input type="text" id="venue_city" name="venue_city" maxlength="100">
          </div>

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
      <div class="modal-notification-area"></div>
    </div>
  </div>
<?php endif; ?>

<?php if ($isLoggedIn): ?>
  <div id="save-plot-modal" class="modal hidden">
    <div class="modal-content">
      <span class="close-button">&times;</span>
      <h2>Save Plot</h2>

      <div class="new-plot-section">
        <form id="save-new-plot-form">
          <label for="plot_name">Plot Name:</label>
          <input type="text" id="plot_name" name="plot_name" maxlength="20">
          <div class="form-actions">
            <button type="submit" id="save-new-button">Save as New</button>
          </div>
        </form>
      </div>

      <div class="existing-plots-section">
        <h2>Overwrite Existing Plot</h2>
        <p>Use new name entered above or leave empty to reuse existing name</p>
        <div class="existing-plots-list">
          <p class="loading-message">Loading your saved plots...</p>
        </div>
      </div>

      <div class="form-actions modal-bottom-actions">
        <button type="button" class="cancel-button">Cancel</button>
      </div>
      <div class="modal-notification-area"></div>
    </div>
  </div>

  <div id="my-plots-modal" class="modal hidden">
    <div class="modal-content">
      <span class="close-button">&times;</span>
      <h2>My Plots</h2>
      <div class="saved-plots-list">
        <p class="loading-message">Loading your saved plots...</p>
      </div>
      <div class="form-actions">
        <button type="button" class="cancel-button">Cancel</button>
      </div>
      <div class="modal-notification-area"></div>
    </div>
  </div>

  <div id="share-plot-modal" class="modal hidden">
    <div class="modal-content">
      <span class="close-button">&times;</span>
      <h2>Print & Share Options</h2>

      <div class="share-options-container">
        <div class="share-option">
          <button id="print-plot-btn" class="share-action-button">
            <i class="fa-solid fa-print"></i>
            <span>Print Stage Plot</span>
          </button>
          <p class="option-description">Print a detailed version of your stage plot with elements list and input list.</p>
        </div>

        <div class="share-option">
          <button id="pdf-download-btn" class="share-action-button">
            <i class="fa-solid fa-file-pdf"></i>
            <span>Download as PDF</span>
          </button>
          <p class="option-description">Download your stage plot as a PDF document.</p>
        </div>

        <div class="share-option">
          <button id="email-share-btn" class="share-action-button">
            <i class="fa-solid fa-envelope"></i>
            <span>Share via Email</span>
          </button>
          <p class="option-description">Share your stage plot with others via email.</p>
        </div>
      </div>

      <div id="email-share-form" class="hidden">
        <div class="form-group">
          <label for="share_email">Recipient Email:</label>
          <input type="email" id="share_email" name="share_email" required>
        </div>
        <div class="form-group">
          <label for="share_message">Message (Optional):</label>
          <textarea id="share_message" name="share_message" rows="3"></textarea>
        </div>
        <div class="form-actions">
          <button type="button" id="send-email-btn" class="primary-button">Send</button>
          <button type="button" id="back-to-options-btn" class="secondary-button">Back</button>
          <button type="button" class="cancel-button">Cancel</button>
        </div>
      </div>

      <div class="modal-notification-area"></div>
    </div>
  </div>

<?php
endif;

include PRIVATE_PATH . '/templates/footer.php';
?>
