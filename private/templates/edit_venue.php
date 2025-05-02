<?php

require_once $_SERVER['DOCUMENT_ROOT'] . '/private/bootstrap.php';

// Check if user is logged in and has admin privileges
if (!isset($_SESSION['user_id']) || ($_SESSION['role_id'] != 2 && $_SESSION['role_id'] != 3)) {
  header('Location: /');
  exit;
}

$db = Database::getInstance();
require_once INCLUDES_PATH . '/VenueManager.php';
$venueManager = new VenueManager();

$venue_id = isset($_GET['venue_id']) ? (int)$_GET['venue_id'] : null;
$is_editing = !is_null($venue_id);
$venue_data = null;
$page_title = "Add Official Venue";
$error_message = '';
$success_message = '';
$form_errors = [];

// Check for error message from session
if (isset($_SESSION['error_message'])) {
  $error_message = $_SESSION['error_message'];
  unset($_SESSION['error_message']);
}

if (isset($_SESSION['success_message'])) {
  $success_message = $_SESSION['success_message'];
  unset($_SESSION['success_message']);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
  error_log('Form submitted with data: ' . print_r($_POST, true));

  $submitted_data = [
    'venue_id' => !empty($_POST['venue_id']) ? (int)$_POST['venue_id'] : null,
    'venue_name' => trim($_POST['venue_name'] ?? ''),
    'venue_street' => trim($_POST['venue_street'] ?? ''),
    'venue_city' => trim($_POST['venue_city'] ?? ''),
    'venue_state_id' => !empty($_POST['venue_state_id']) ? (int)$_POST['venue_state_id'] : null,
    'venue_zip' => trim($_POST['venue_zip'] ?? ''),
    'stage_width' => trim($_POST['stage_width'] ?? ''),
    'stage_depth' => trim($_POST['stage_depth'] ?? '')
  ];

  error_log('Processed form data: ' . print_r($submitted_data, true));

  // First check the state field specifically
  if (empty($submitted_data['venue_state_id'])) {
    $form_errors['venue_state_id'] = 'required';
    $error_message = "State selection is required. Please select a state before submitting.";
    $venue_data = $submitted_data;
  } 
  else if ($is_editing && $submitted_data['venue_id'] !== $venue_id) {
    $error_message = "Venue ID mismatch. Cannot save changes to a different venue ID.";
    $_SESSION['error_message'] = $error_message;
    error_log('Venue ID mismatch error: submitted ' . $submitted_data['venue_id'] . ' vs expected ' . $venue_id);
  } 
  else {
    // Validate form data
    $form_errors = $venueManager->validateVenueData($submitted_data);

    if (!empty($form_errors)) {
      error_log('Validation errors: ' . print_r($form_errors, true));
      $error_message = "Please correct the errors below before submitting.";
      $venue_data = $submitted_data;
    } 
    else {
      try {
        error_log('Attempting to save venue...');
        $saveResult = $venueManager->saveVenue($submitted_data);
        error_log('Save result: ' . print_r($saveResult, true));

        if ($saveResult) {
          if ($is_editing) {
            $redirect_venue_id = $venue_id;
            $_SESSION['success_message'] = "Venue updated successfully.";
          } else {
            // Look up the venue that was just created
            $lookup = $db->fetchOne(
              "SELECT venue_id FROM venues WHERE venue_name = ? ORDER BY venue_id DESC LIMIT 1",
              [$submitted_data['venue_name']]
            );
            $redirect_venue_id = $lookup ? $lookup['venue_id'] : null;
            
            $_SESSION['success_message'] = "Venue added successfully.";
          }

          if ($redirect_venue_id) {
            header('Location: view_venue.php?venue_id=' . $redirect_venue_id);
          } else {
            header('Location: data_management.php');
          }
          exit;
        } else {
          $error_message = "Failed to save venue. Please check all required fields and try again.";
          error_log('Venue save returned false without throwing exception');
        }
      } catch (Exception $e) {
        $error_message = "An error occurred while saving the venue: " . $e->getMessage();
        error_log("Error saving venue: " . $e->getMessage());
        error_log("Exception details: " . print_r($e, true));
      }
    }
  }
}

// Fetch venue data if editing and no form data is available
if ($is_editing && !$venue_data) {
  $venue_data = $venueManager->getVenue($venue_id);
  if (!$venue_data) {
    $_SESSION['error_message'] = "Venue not found.";
    header('Location: data_management.php');
    exit;
  }
  $page_title = "Edit Official Venue";
} else if (!$venue_data) {
  $venue_data = [
    'venue_id' => null,
    'venue_name' => '',
    'venue_street' => '',
    'venue_city' => '',
    'venue_state_id' => '',
    'venue_zip' => '',
    'stage_width' => '',
    'stage_depth' => ''
  ];
}

// Set page title for header
$current_page = $page_title;
include PRIVATE_PATH . '/templates/header.php';
?>

<!-- Custom styling for required fields and error messages -->
<style>
  label[for="venue_state_id"]::after {
    color: var(--color-danger-light);
    content: " *";
    font-weight: bold;
  }
  
  .form-group.error select,
  .form-group.error .custom-dropdown {
    border-color: var(--color-danger) !important;
  }
  
  .form-group.error .field-error {
    display: block !important;
    visibility: visible !important;
    color: var(--color-danger);
    font-size: 0.85rem;
    margin-top: 0.25rem;
    position: relative;
    z-index: 1000;
  }
</style>

<div class="admin-container view-container edit-container">
  <div class="view-header">
    <h1><?= htmlspecialchars($page_title) ?></h1>
    <?php
      if ($is_editing) {
        header('Location: view_venue.php?venue_id=' . $venue_id);
      } else {
        header('Location: data_management.php');
      }
    ?>
  </div>

  <?php if ($error_message): ?>
    <div class="error-message">
      <p><?= htmlspecialchars($error_message) ?></p>
    </div>
  <?php endif; ?>

  <?php if ($success_message): ?>
    <div class="success-message">
      <p><?= htmlspecialchars($success_message) ?></p>
    </div>
  <?php endif; ?>

  <form method="POST" action="edit_venue.php<?= $is_editing ? '?venue_id=' . urlencode($venue_id) : '' ?>">
    <input type="hidden" name="venue_id" value="<?= htmlspecialchars($venue_data['venue_id'] ?? '') ?>">

    <div class="form-group <?= isset($form_errors['venue_name']) ? 'error' : '' ?>">
      <label for="venue_name">Venue Name:</label>
      <input type="text" id="venue_name" name="venue_name" maxlength="100" value="<?= htmlspecialchars($venue_data['venue_name'] ?? '') ?>" required>
      <?php if (isset($form_errors['venue_name'])): ?>
        <span class="field-error">
          <?php
          if ($form_errors['venue_name'] === 'required') {
            echo 'Venue name is required.';
          } elseif ($form_errors['venue_name'] === 'max_length') {
            echo 'Venue name must be less than 100 characters.';
          } elseif ($form_errors['venue_name'] === 'exists') {
            echo 'A venue with this name already exists.';
          } else {
            echo $form_errors['venue_name'];
          }
          ?>
        </span>
      <?php endif; ?>
    </div>

    <div class="form-group <?= isset($form_errors['venue_street']) ? 'error' : '' ?>">
      <label for="venue_street">Street Address:</label>
      <input type="text" id="venue_street" name="venue_street" maxlength="100" value="<?= htmlspecialchars($venue_data['venue_street'] ?? '') ?>" required>
      <?php if (isset($form_errors['venue_street'])): ?>
        <span class="field-error">
          <?php
          if ($form_errors['venue_street'] === 'required') {
            echo 'Street address is required.';
          } elseif ($form_errors['venue_street'] === 'max_length') {
            echo 'Street address must be less than 100 characters.';
          } else {
            echo $form_errors['venue_street'];
          }
          ?>
        </span>
      <?php endif; ?>
    </div>

    <div class="form-row">
      <div class="form-group <?= isset($form_errors['venue_city']) ? 'error' : '' ?>">
        <label for="venue_city">City:</label>
        <input type="text" id="venue_city" name="venue_city" maxlength="100" value="<?= htmlspecialchars($venue_data['venue_city'] ?? '') ?>" required>
        <?php if (isset($form_errors['venue_city'])): ?>
          <span class="field-error">
            <?php
            if ($form_errors['venue_city'] === 'required') {
              echo 'City is required.';
            } elseif ($form_errors['venue_city'] === 'max_length') {
              echo 'City must be less than 100 characters.';
            } else {
              echo $form_errors['venue_city'];
            }
            ?>
          </span>
        <?php endif; ?>
      </div>

      <div class="form-group <?= isset($form_errors['venue_state_id']) ? 'error' : '' ?>">
        <label for="venue_state_id">State:</label>
        
        <select id="venue_state_id" name="venue_state_id_visible">
          <option value="">Select State</option>
          <?php
          $states = $db->fetchAll("SELECT state_id, state_name FROM states ORDER BY state_name");
          foreach ($states as $state) {
            $selected = isset($venue_data['venue_state_id']) && $venue_data['venue_state_id'] == $state['state_id'] ? 'selected' : '';
            echo "<option value='{$state['state_id']}' {$selected}>" . htmlspecialchars($state['state_name']) . "</option>";
          }
          ?>
        </select>
        
        <!-- Hidden field that will always be submitted with the form -->
        <input type="hidden" name="venue_state_id" id="hidden_state_id" value="<?= htmlspecialchars($venue_data['venue_state_id'] ?? '') ?>">
        
        <?php if (isset($form_errors['venue_state_id'])): ?>
          <span class="field-error">
            <?php
            if ($form_errors['venue_state_id'] === 'required') {
              echo 'State selection is required.';
            } elseif ($form_errors['venue_state_id'] === 'invalid') {
              echo 'Please select a valid state.';
            } else {
              echo $form_errors['venue_state_id'];
            }
            ?>
          </span>
        <?php endif; ?>
      </div>

      <div class="form-group <?= isset($form_errors['venue_zip']) ? 'error' : '' ?>">
        <label for="venue_zip">ZIP:</label>
        <input type="text" id="venue_zip" name="venue_zip" maxlength="5" pattern="\d{5}" title="Enter a 5-digit ZIP code" value="<?= htmlspecialchars($venue_data['venue_zip'] ?? '') ?>" required>
        <?php if (isset($form_errors['venue_zip'])): ?>
          <span class="field-error">
            <?php
            if ($form_errors['venue_zip'] === 'required') {
              echo 'ZIP code is required.';
            } elseif ($form_errors['venue_zip'] === 'format') {
              echo 'ZIP code must be 5 digits.';
            } else {
              echo $form_errors['venue_zip'];
            }
            ?>
          </span>
        <?php endif; ?>
      </div>
    </div>

    <div class="input-dimensions">
      <div class="form-group <?= isset($form_errors['stage_width']) ? 'error' : '' ?>">
        <label for="stage_width">Stage Width (feet):</label>
        <input type="number" id="stage_width" name="stage_width" min="1" max="200" step="1" value="<?= htmlspecialchars($venue_data['stage_width'] ?? '') ?>" required>
        <?php if (isset($form_errors['stage_width'])): ?>
          <span class="field-error">
            <?php
            if ($form_errors['stage_width'] === 'required') {
              echo 'Stage width is required.';
            } elseif ($form_errors['stage_width'] === 'min') {
              echo 'Stage width must be at least 1 foot.';
            } elseif ($form_errors['stage_width'] === 'max') {
              echo 'Stage width cannot exceed 200 feet.';
            } elseif ($form_errors['stage_width'] === 'numeric') {
              echo 'Stage width must be a number.';
            } else {
              echo $form_errors['stage_width'];
            }
            ?>
          </span>
        <?php endif; ?>
      </div>

      <div class="form-group <?= isset($form_errors['stage_depth']) ? 'error' : '' ?>">
        <label for="stage_depth">Stage Depth (feet):</label>
        <input type="number" id="stage_depth" name="stage_depth" min="1" max="200" step="1" value="<?= htmlspecialchars($venue_data['stage_depth'] ?? '') ?>" required>
        <?php if (isset($form_errors['stage_depth'])): ?>
          <span class="field-error">
            <?php
            if ($form_errors['stage_depth'] === 'required') {
              echo 'Stage depth is required.';
            } elseif ($form_errors['stage_depth'] === 'min') {
              echo 'Stage depth must be at least 1 foot.';
            } elseif ($form_errors['stage_depth'] === 'max') {
              echo 'Stage depth cannot exceed 200 feet.';
            } elseif ($form_errors['stage_depth'] === 'numeric') {
              echo 'Stage depth must be a number.';
            } else {
              echo $form_errors['stage_depth'];
            }
            ?>
          </span>
        <?php endif; ?>
      </div>
    </div>

    <div class="venue-form-actions">
      <button type="submit" class="button save-button"><?= $is_editing ? 'Save Changes' : 'Add Venue' ?></button>
      <?php if ($is_editing): ?>
        <!-- If editing, return to view_venue.php -->
        <a href="view_venue.php?venue_id=<?= urlencode($venue_id) ?>" class="button cancel-button">Cancel</a>
      <?php else: ?>
        <!-- If adding a new venue, return to data_management.php -->
        <a href="data_management.php" class="button cancel-button">Cancel</a>
      <?php endif; ?>
    </div>
  </form>
</div>

<!-- Script to sync the visible dropdown with the hidden field -->
<script>
document.addEventListener('DOMContentLoaded', function() {
  const visibleSelect = document.getElementById('venue_state_id');
  const hiddenInput = document.getElementById('hidden_state_id');
  
  if (visibleSelect && hiddenInput) {
    if (visibleSelect.value) {
      hiddenInput.value = visibleSelect.value;
    }
    
    visibleSelect.addEventListener('change', function() {
      hiddenInput.value = this.value;
    });
    
    document.addEventListener('click', function(e) {
      if (e.target && e.target.classList && 
          e.target.classList.contains('custom-dropdown-option') && 
          !e.target.classList.contains('disabled')) {
        
        const value = e.target.getAttribute('data-value');
        if (value !== null) {
          hiddenInput.value = value;
        }
      }
    });
  }
  
  // Form submission handler
  const venueForm = document.querySelector('form');
  const stateFormGroup = hiddenInput ? hiddenInput.closest('.form-group') : null;
  
  if (venueForm && hiddenInput && stateFormGroup) {
    venueForm.addEventListener('submit', function(e) {
      // Check if state is selected
      if (!hiddenInput.value) {
        e.preventDefault();
        
        stateFormGroup.classList.add('error');
        
        let errorSpan = stateFormGroup.querySelector('.field-error');
        if (!errorSpan) {
          errorSpan = document.createElement('span');
          errorSpan.className = 'field-error';
          errorSpan.textContent = 'State selection is required.';
          stateFormGroup.appendChild(errorSpan);
        } else {
          errorSpan.textContent = 'State selection is required.';
          errorSpan.style.display = 'block';
        }
        
        // Make the error visible over any custom dropdown
        errorSpan.style.display = 'block';
        errorSpan.style.visibility = 'visible';
        errorSpan.style.position = 'relative';
        errorSpan.style.zIndex = '1000';
        
        let generalError = document.querySelector('.error-message');
        if (!generalError) {
          generalError = document.createElement('div');
          generalError.className = 'error-message';
          const errorP = document.createElement('p');
          errorP.textContent = 'State selection is required. Please select a state before submitting.';
          generalError.appendChild(errorP);
          venueForm.parentNode.insertBefore(generalError, venueForm);
        } else {
          generalError.querySelector('p').textContent = 'State selection is required. Please select a state before submitting.';
          generalError.style.display = 'block';
        }
        
        stateFormGroup.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
    
    // monitor the custom dropdown for changes
    document.addEventListener('click', function(e) {
      if (e.target && e.target.classList && 
          e.target.classList.contains('custom-dropdown-option') && 
          !e.target.classList.contains('disabled')) {
        
        if (hiddenInput.value) {
          stateFormGroup.classList.remove('error');
          const errorSpan = stateFormGroup.querySelector('.field-error');
          if (errorSpan) {
            errorSpan.style.display = 'none';
          }
          
          const generalError = document.querySelector('.error-message');
          if (generalError) {
            generalError.style.display = 'none';
          }
        }
      }
    });
  }
});
</script>

<?php include PRIVATE_PATH . '/templates/footer.php'; ?>
