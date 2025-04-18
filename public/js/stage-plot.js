/**
 * StageWrite Stage Plot Editor
 * Main entry point for the stage plot editing functionality
 */

/**
 * Initialize stage plot editor
 */
function initStageEditor() {
  // Skip if not on a page with the stage plot editor
  if (!document.getElementById('stage')) return;

  // Initialize the plot state
  const plotState = {
    elements: [],
    nextZIndex: 1,
    currentDragId: null,
    selectedElement: null,
    selectedElements: [],
    currentPlotName: null,
    currentPlotId: null,
    isModified: false,
    isLoading: false,
    favorites: [],
    favoritesData: [],
    renderInputList: null,
    clearInputList: null,
  };

  window.plotState = plotState;

  // Initialize components
  initPlotControls(plotState);
  initDragAndDrop(plotState);
  initModalControls(plotState);
  initCategoryFilter();
  initFavorites(plotState);
  moveFavoritesToTop();
  initLoadPlotModal(plotState);
  initPageNavigation(plotState);
  initStageGrid();
  checkUrlParameters(plotState);
  initLassoSelection(plotState);
  initInputList(plotState);
  initElementInfoListEvents(plotState);

  // Expose render function to plotState
  plotState.renderElementInfoList = () => renderElementInfoList(plotState);

  // Try to restore state from localStorage first
  const stateRestored = restoreStateFromStorage(plotState);
  if (!stateRestored) {
    setupInitialState(plotState); // Setup default stage size, dates etc.
    // If state wasn't restored, ensure the input list has the default 6 rows
    if (plotState.renderInputList) {
      plotState.renderInputList([]);
    }
  }

  // Only set up initial state if not restored from storage
  if (!stateRestored) {
    setupInitialState(plotState);
  }

  // Setup change tracking AFTER restoring state
  setupChangeTracking(plotState);

  // Check for URL parameters
  checkUrlParameters(plotState);

  // Initialize venue select change handler
  setupVenueSelectHandler(plotState);

  // Initialize date change handlers
  setupDateHandlers(plotState);

  // Initialize date validation
  setupDateValidation(plotState);

  // Render the initial list
  renderElementInfoList(plotState);
}

/**
 * Calculate stage dimensions based on venue dimensions
 * @param {number} venueWidth - Venue width in feet
 * @param {number} venueDepth - Venue depth in feet
 * @param {number} maxStageWidth - Maximum stage width in pixels
 * @returns {Object} Object with calculated width, height, and grid size
 */
function calculateStageDimensions(venueWidth, venueDepth, maxStageWidth = 900) {
  // Default values if dimensions are invalid
  if (!venueWidth || !venueDepth || venueWidth <= 0 || venueDepth <= 0) {
    venueWidth = 20;
    venueDepth = 15;
  }

  // Calculate aspect ratio
  const aspectRatio = venueDepth / venueWidth;

  // Calculate stage dimensions in pixels
  const stageWidth = maxStageWidth;
  const stageHeight = Math.round(stageWidth * aspectRatio);

  // Calculate grid size (each grid square is 5' x 5')
  const gridSizeWidth = stageWidth / (venueWidth / 5);
  const gridSizeHeight = stageHeight / (venueDepth / 5);

  // Use the smaller of the two to ensure squares
  const gridSize = Math.min(gridSizeWidth, gridSizeHeight);

  return {
    width: stageWidth,
    height: stageHeight,
    gridSize: gridSize,
    widthInFeet: venueWidth,
    depthInFeet: venueDepth,
    gridSquaresX: Math.ceil(venueWidth / 5),
    gridSquaresY: Math.ceil(venueDepth / 5),
  };
}

/**
 * Update stage dimensions based on venue selection
 * @param {Object} dimensions - The calculated dimensions
 * @param {HTMLElement} stage - The stage element
 */
function updateStageDimensions(dimensions, stage) {
  if (!stage) return;

  // Update stage dimensions
  stage.style.width = `${dimensions.width}px`;
  stage.style.height = `${dimensions.height}px`;

  // Update data attributes
  stage.setAttribute('data-stage-width', dimensions.widthInFeet);
  stage.setAttribute('data-stage-depth', dimensions.depthInFeet);

  // Update grid overlay
  updateGridOverlay(dimensions, stage);

  // Update dimensions label
  updateDimensionsLabel(dimensions, stage);
}

/**
 * Update the grid overlay with proper scaling
 * @param {Object} dimensions - The calculated dimensions
 * @param {HTMLElement} stage - The stage element
 */
function updateGridOverlay(dimensions, stage) {
  // Find or create grid overlay
  let gridOverlay = stage.querySelector('.grid-overlay');

  if (!gridOverlay) {
    // Create grid overlay if it doesn't exist
    gridOverlay = document.createElement('div');
    gridOverlay.className = 'grid-overlay';
    gridOverlay.style.position = 'absolute';
    gridOverlay.style.top = '0';
    gridOverlay.style.left = '0';
    gridOverlay.style.width = '100%';
    gridOverlay.style.height = '100%';
    gridOverlay.style.pointerEvents = 'none';
    gridOverlay.style.zIndex = '1';
    gridOverlay.style.opacity = '0'; // Start hidden
    gridOverlay.style.transition = 'opacity 0.3s ease';
    stage.appendChild(gridOverlay);
  }

  // Calculate foot size in pixels (1/5 of the grid size)
  const footSize = dimensions.gridSize / 5;

  // Create a complex background with both 5-foot and 1-foot lines
  // The 5-foot lines are darker (rgba opacity 0.15) than the 1-foot lines (rgba opacity 0.05)
  gridOverlay.style.backgroundImage = `
    linear-gradient(to right, rgba(82, 108, 129, 0.15) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(82, 108, 129, 0.15) 1px, transparent 1px),
    linear-gradient(to right, rgba(82, 108, 129, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(82, 108, 129, 0.05) 1px, transparent 1px)
  `;

  // Set the background sizes for both types of grid lines
  gridOverlay.style.backgroundSize = `
    ${dimensions.gridSize}px ${dimensions.gridSize}px,
    ${dimensions.gridSize}px ${dimensions.gridSize}px,
    ${footSize}px ${footSize}px,
    ${footSize}px ${footSize}px
  `;

  // Store grid size in data attribute for reference
  gridOverlay.setAttribute('data-grid-size', dimensions.gridSize);
  gridOverlay.setAttribute('data-foot-size', footSize);
  gridOverlay.setAttribute('data-grid-squares-x', dimensions.gridSquaresX);
  gridOverlay.setAttribute('data-grid-squares-y', dimensions.gridSquaresY);
}

/**
 * Update dimensions label on the stage
 * @param {Object} dimensions - The calculated dimensions
 * @param {HTMLElement} stage - The stage element
 */
function updateDimensionsLabel(dimensions, stage) {
  // Find existing dimensions label or create one
  let dimensionsLabel = stage.querySelector('.stage-dimensions');

  if (!dimensionsLabel) {
    dimensionsLabel = document.createElement('div');
    dimensionsLabel.className = 'stage-dimensions';
    stage.appendChild(dimensionsLabel);
  }

  // Update label with dimensions and grid squares
  // Format: Width × Depth (grid squares) | pixels
  dimensionsLabel.textContent = `${dimensions.widthInFeet}' × ${dimensions.depthInFeet}' (${dimensions.gridSquaresX}×${dimensions.gridSquaresY} grid)`;

  // Add a tooltip with more detailed information
  dimensionsLabel.title = `Stage dimensions: ${dimensions.widthInFeet}' × ${dimensions.depthInFeet}'
  Grid size: ${dimensions.gridSquaresX} × ${dimensions.gridSquaresY} of 5' squares
  Pixel dimensions: ${dimensions.width}px × ${dimensions.height}px
  Scale: 1 foot = ${dimensions.gridSize / 5}px`;
}

/**
 * Setup date validation to make sure end date is after start date
 * @param {Object} plotState - The current plot state
 */
function setupDateValidation(plotState) {
  const eventStartInput = document.getElementById('event_start');
  const eventEndInput = document.getElementById('event_end');

  if (!eventStartInput || !eventEndInput) return;

  // Set min date for end date when start date changes
  eventStartInput.addEventListener('change', function () {
    // Set min end date to match start
    eventEndInput.min = this.value;

    // If the end date is before start date update it
    if (eventEndInput.value && eventEndInput.value < this.value) {
      eventEndInput.value = this.value;

      // Mark as modified if editing an existing plot
      if (typeof showNotification === 'function') {
        showNotification('End date changed.', 'info');
      }
    }
  });

  // Prevent end date from being before start date
  eventEndInput.addEventListener('change', function () {
    const startDate = eventStartInput.value;

    if (startDate && this.value < startDate) {
      this.value = startDate;

      // Show notification
      if (typeof showNotification === 'function') {
        showNotification('End date must be after start.', 'warning');
      }
    }

    // Mark as modified if editing a new plot
    if (plotState.currentPlotId) {
      markPlotAsModified(plotState);
    }
  });

  // Set initial min date for the end date based off start date
  if (eventStartInput.value) {
    eventEndInput.min = eventStartInput.value;
  }
}

/**
 * Initialize favorites functionality
 * @param {Object} plotState - The current plot state
 */
function initFavorites(plotState) {
  // Initialize favorites array in plot state
  plotState.favorites = [];
  plotState.favoritesData = [];

  // Get user's favorited elements
  fetchUserFavorites(plotState).then(() => {
    // Add favorite buttons to elements
    addFavoriteButtons(plotState);

    // Update favorites category
    updateFavoritesCategory(plotState);
  });
}

/**
 * Fetch user's favorite elements
 * @param {Object} plotState - The current plot state
 * @returns {Promise} - Promise that resolves when favorites are loaded
 */
function fetchUserFavorites(plotState) {
  return fetch('/handlers/get_favorites.php')
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Store favorite element IDs in plot state
        plotState.favorites = data.favorites.map((fav) => parseInt(fav.element_id));

        // Store complete favorite data for creating elements
        plotState.favoritesData = data.favorites;
      }
    })
    .catch((error) => {
      console.error('Error fetching favorites:', error);
    });
}

/**
 * Add favorite buttons to all elements
 * @param {Object} plotState - The current plot state
 */
function addFavoriteButtons(plotState) {
  const elements = document.querySelectorAll('.draggable-element:not(.favorite-element)');

  elements.forEach((element) => {
    const elementId = parseInt(element.getAttribute('data-element-id'));
    const isFavorite = plotState.favorites.includes(elementId);

    // Only add button if it doesn't already exist
    if (!element.querySelector('.favorite-button')) {
      // Create favorite button
      const favoriteBtn = document.createElement('button');
      favoriteBtn.className = 'favorite-button';
      favoriteBtn.setAttribute('type', 'button');
      favoriteBtn.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
      favoriteBtn.innerHTML = isFavorite ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';

      // Add click handler to toggle favorite
      favoriteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(elementId, plotState);
      });

      // Add button to element
      element.appendChild(favoriteBtn);
    }
  });
}

/**
 * Toggle element's favorite status
 * @param {number} elementId - The element ID to toggle
 * @param {Object} plotState - The current plot state
 */
function toggleFavorite(elementId, plotState) {
  // Prevent toggling if another toggle operation is already in progress
  if (plotState.favoriteToggleInProgress) {
    return;
  }

  // Create form data for the request
  const formData = new FormData();
  formData.append('element_id', elementId);

  // Set the flag to indicate a toggle is in progress
  plotState.favoriteToggleInProgress = true;

  // Check if we're removing a favorite
  const isRemoving = plotState.favorites.includes(elementId);

  // If removing, find the element in the favorites section to animate
  if (isRemoving) {
    const favoriteElement = document.querySelector(`.favorite-element[data-element-id="${elementId}"]`);
    if (favoriteElement) {
      // Use requestAnimationFrame to ensure DOM is updated before animation starts
      requestAnimationFrame(() => {
        // Add removing class to trigger animation
        favoriteElement.classList.add('removing');

        // Create a flag variable to track if request has been sent
        let requestSent = false;

        // Set up animation end listener
        const handleAnimationEnd = () => {
          if (requestSent) return; // Prevent duplicate calls
          requestSent = true;
          favoriteElement.removeEventListener('animationend', handleAnimationEnd);
          // Now send the server request
          sendToggleRequest();
        };

        // Add event listener for animation end
        favoriteElement.addEventListener('animationend', handleAnimationEnd);

        // Fallback: If animation doesn't complete after 500ms, proceed anyway
        setTimeout(() => {
          if (requestSent) return; // Don't send if already sent
          requestSent = true;
          favoriteElement.classList.remove('removing'); // Ensure class is removed
          sendToggleRequest();
        }, 500);
      });

      return; // Exit early, the sendToggleRequest will be called after animation
    }
  }

  // If not removing or element not found, proceed normally
  sendToggleRequest();

  function sendToggleRequest() {
    // Rest of your existing code (unchanged)
    fetch('/handlers/toggle_favorite.php', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          // Update favorites in state
          const isFavorite = data.action === 'added';

          if (isFavorite) {
            // Add to favorites if not already there
            if (!plotState.favorites.includes(elementId)) {
              plotState.favorites.push(elementId);

              // Get element data for the favorites category
              const elementData = getElementData(elementId);
              if (elementData) {
                plotState.favoritesData.push(elementData);
              }
            }
          } else {
            // Remove from favorites
            plotState.favorites = plotState.favorites.filter((id) => id !== elementId);
            plotState.favoritesData = plotState.favoritesData.filter((fav) => fav.element_id !== elementId);
          }

          // Update all instances of this element's favorite button
          updateElementFavoriteButtons(elementId, isFavorite);

          // Update favorites category
          updateFavoritesCategory(plotState);

          // Show notification
          if (typeof showNotification === 'function') {
            showNotification(data.message, 'success');
          }
        } else {
          if (typeof showNotification === 'function') {
            showNotification(data.error || 'Error toggling favorite', 'error');
          }
        }

        // IMPORTANT: Clear the toggle in progress flag
        plotState.favoriteToggleInProgress = false;
      })
      .catch((error) => {
        console.error('Error toggling favorite:', error);
        if (typeof showNotification === 'function') {
          showNotification('Error toggling favorite', 'error');
        }

        // IMPORTANT: Clear the toggle in progress flag even on error
        plotState.favoriteToggleInProgress = false;
      });
  }
}

/**
 * Update all instances of an element's favorite button
 * @param {number} elementId - The element ID
 * @param {boolean} isFavorite - Whether the element is favorited
 */
function updateElementFavoriteButtons(elementId, isFavorite) {
  const buttons = document.querySelectorAll(`.draggable-element[data-element-id="${elementId}"] .favorite-button`);

  buttons.forEach((button) => {
    button.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
    button.innerHTML = isFavorite ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
  });
}

/**
 * Get element data for an element ID
 * @param {number} elementId - The element ID
 * @returns {Object|null} - Element data or null if not found
 */
function getElementData(elementId) {
  const element = document.querySelector(`.draggable-element[data-element-id="${elementId}"]`);

  if (element) {
    return {
      element_id: elementId,
      element_name: element.getAttribute('data-element-name'),
      category_id: parseInt(element.getAttribute('data-category-id')),
      element_image: element.getAttribute('data-image'),
    };
  }

  return null;
}

/**
 * Update the Favorites category content.
 * @param {Object} plotState - The current plot state
 */
function updateFavoritesCategory(plotState) {
  const elementsPanel = document.getElementById('elements-list');
  if (!elementsPanel) return;

  // Find existing favorites section if it exists
  let favoritesSection = elementsPanel.querySelector('.category-section.favorites-section');

  // Initialize previousFavorites array if it doesn't exist
  if (!plotState.previousFavorites) {
    plotState.previousFavorites = [];
  }

  // Track which elements are new
  const newFavorites = plotState.favorites.filter((id) => !plotState.previousFavorites.includes(id));

  // Create favorites section if it doesn't exist yet
  if (!favoritesSection) {
    favoritesSection = document.createElement('div');
    favoritesSection.className = 'category-section favorites-section';
    favoritesSection.setAttribute('data-category-id', '1');
    const heading = document.createElement('h3');
    heading.textContent = 'Favorites';
    favoritesSection.appendChild(heading);
    const grid = document.createElement('div');
    grid.className = 'elements-grid';
    favoritesSection.appendChild(grid);
    elementsPanel.insertBefore(favoritesSection, elementsPanel.firstChild);
  }

  let favoritesGrid = favoritesSection.querySelector('.elements-grid');
  if (!favoritesGrid) {
    favoritesGrid = document.createElement('div');
    favoritesGrid.className = 'elements-grid';
    favoritesSection.appendChild(favoritesGrid);
  }

  favoritesGrid.innerHTML = ''; // Clear existing grid content

  // Handle empty favorites state
  if (!plotState.favorites || plotState.favorites.length === 0) {
    const noFavorites = document.createElement('p');
    noFavorites.className = 'no-favorites-message';
    noFavorites.textContent = 'No favorites yet. Click the ☆ icon on any element.';
    favoritesGrid.appendChild(noFavorites);
  } else {
    // Populate grid with favorite elements
    plotState.favorites.forEach((elementId) => {
      const elementData = plotState.favoritesData.find((fav) => parseInt(fav.element_id) === elementId);
      if (elementData) {
        const favoriteElement = document.createElement('div');
        favoriteElement.className = 'draggable-element favorite-element';
        favoriteElement.setAttribute('draggable', true);
        favoriteElement.setAttribute('data-element-id', elementData.element_id);
        favoriteElement.setAttribute('data-element-name', elementData.element_name);
        favoriteElement.setAttribute('data-category-id', elementData.category_id);
        favoriteElement.setAttribute('data-image', elementData.element_image);

        // Add animation class if it's a new favorite
        if (newFavorites.includes(elementId)) {
          favoriteElement.classList.add('adding');
          // Remove the class after animation completes
          favoriteElement.addEventListener('animationend', () => {
            favoriteElement.classList.remove('adding');
          });
        }

        const img = document.createElement('img');
        img.src = `/images/elements/${elementData.element_image}`;
        img.alt = elementData.element_name;
        favoriteElement.appendChild(img);

        const nameDiv = document.createElement('div');
        nameDiv.className = 'element-name';
        nameDiv.textContent = elementData.element_name;
        favoriteElement.appendChild(nameDiv);

        const favoriteBtn = document.createElement('button');
        favoriteBtn.className = 'favorite-button';
        favoriteBtn.setAttribute('type', 'button');
        favoriteBtn.title = 'Remove from favorites';
        favoriteBtn.innerHTML = '<i class="fa-solid fa-star"></i>';
        favoriteBtn.addEventListener('click', (e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleFavorite(elementId, plotState);
        });
        favoriteElement.appendChild(favoriteBtn);

        favoriteElement.addEventListener('dragstart', (e) => handleDragStart(e, plotState));
        favoritesGrid.appendChild(favoriteElement);
      }
    });
  }

  // Update previous favorites for next time
  plotState.previousFavorites = [...plotState.favorites];

  // Ensure Favorites section is still at the top
  moveFavoritesToTop();
}

/**
 * Ensures Favorites section is at the top of the elements list.
 */
function moveFavoritesToTop() {
  const elementsPanel = document.getElementById('elements-list');
  if (!elementsPanel) return;

  // Find the Favorites section
  const favoritesSection = elementsPanel.querySelector('.category-section[data-category-id="1"], .category-section.favorites-section');
  if (!favoritesSection) return; // Exit if no Favorites section

  // Ensure it has the class for consistency
  favoritesSection.classList.add('favorites-section');

  // Move Favorites section to the top if it's not already there
  const firstChild = elementsPanel.firstChild;
  if (favoritesSection !== firstChild) {
    elementsPanel.insertBefore(favoritesSection, firstChild);
  }
}

/**
 * Initialize drag and drop functionality
 * @param {Object} plotState - The current plot state
 */
function initDragAndDrop(plotState) {
  const stage = document.getElementById('stage');
  if (!stage) return;

  // Make elements from the list draggable
  const draggableElements = document.querySelectorAll('.draggable-element');

  draggableElements.forEach((element) => {
    // Modify the dragstart listener
    element.addEventListener('dragstart', (e) => {
      handleDragStart(e, plotState); // Call your existing handler
    });
    element.setAttribute('draggable', true);
  });

  // Set up the stage as drop target
  stage.addEventListener('dragover', handleDragOver);
  stage.addEventListener('drop', (e) => handleDrop(e, plotState));
}

/**
 * Handle drag start event
 * @param {DragEvent} e - The drag event
 * @param {Object} plotState - The current plot state
 */
function handleDragStart(e, plotState) {
  // Store element ID in the dataTransfer object
  e.dataTransfer.setData('text/plain', e.target.getAttribute('data-element-id'));

  // Get the source element dimensions
  const sourceElement = e.target;
  const sourceRect = sourceElement.getBoundingClientRect();

  // Calculate where the user clicked relative to the element's center
  const clickOffsetX = e.clientX - (sourceRect.left + sourceRect.width / 3);
  const clickOffsetY = e.clientY - (sourceRect.top + sourceRect.height / 3);

  // Store in plotState
  plotState.currentDragId = sourceElement.getAttribute('data-element-id');
  plotState.dragSourceRect = {
    width: sourceRect.width,
    height: sourceRect.height,
    offsetX: clickOffsetX,
    offsetY: clickOffsetY,
  };

  // Set drag image and effect
  e.dataTransfer.effectAllowed = 'copy';
}

/**
 * Handle drag over event to allow dropping
 * @param {DragEvent} e - The drag event
 */
function handleDragOver(e) {
  // Prevent default to allow drop
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
}

/**
 * Handle drop event
 * @param {DragEvent} e - The drop event
 * @param {Object} plotState - The current plot state
 */
function handleDrop(e, plotState) {
  const stage = document.getElementById('stage');
  if (!stage) return;

  // Prevent default action
  e.preventDefault();

  // Get the element ID from dataTransfer
  const elementId = e.dataTransfer.getData('text/plain');

  if (!elementId) return;

  // Find the element in the list
  const sourceElement = document.querySelector(`.draggable-element[data-element-id="${elementId}"]`);

  if (!sourceElement) return;

  // Get element data
  const elementName = sourceElement.getAttribute('data-element-name');
  const categoryId = sourceElement.getAttribute('data-category-id');
  const imageSrc = sourceElement.getAttribute('data-image');

  // Calculate position relative to the stage
  const stageRect = stage.getBoundingClientRect();

  // Default element dimensions
  const elementWidth = 75;
  const elementHeight = 75;

  // Calculate position that centers the element where the drag source was
  // rather than where the cursor is
  let x, y;

  if (plotState.dragSourceRect) {
    // Use the drag offsets to center the element properly
    x = Math.max(0, Math.min(e.clientX - stageRect.left - plotState.dragSourceRect.offsetX - elementWidth / 2, stageRect.width - elementWidth));

    y = Math.max(0, Math.min(e.clientY - stageRect.top - plotState.dragSourceRect.offsetY - elementHeight / 2, stageRect.height - elementHeight));
  } else {
    // Fallback to the original cursor-based positioning if no drag data
    x = Math.max(0, Math.min(e.clientX - stageRect.left - elementWidth / 1.5, stageRect.width - elementWidth));
    y = Math.max(0, Math.min(e.clientY - stageRect.top - elementHeight / 1.5, stageRect.height - elementHeight));
  }

  // Create a new element object
  const newElement = {
    id: plotState.elements.length + 1, // Unique ID for this instance
    elementId: parseInt(elementId),
    elementName: elementName,
    categoryId: parseInt(categoryId),
    image: imageSrc,
    x: x,
    y: y,
    width: 75,
    height: 75,
    flipped: false,
    zIndex: plotState.nextZIndex++,
    label: '',
    notes: '',
  };

  // Add to state and create DOM element
  plotState.elements.push(newElement);

  // Clear drag source data after use
  plotState.dragSourceRect = null;

  createPlacedElement(newElement, plotState).then(() => {
    // Apply drop animation to the newly created element
    const domElement = document.querySelector(`.placed-element[data-id="${newElement.id}"]`);
    if (domElement) {
      requestAnimationFrame(() => {
        domElement.classList.add('dropping');

        // Remove animation class after animation completes
        domElement.addEventListener(
          'animationend',
          () => {
            domElement.classList.remove('dropping');
          },
          { once: true }
        );
      });
    }

    renderElementInfoList(plotState); // Update the info list
  });

  markPlotAsModified(plotState);
}

/**
 * Create a placed element on the stage
 * @param {Object} elementData - The element data object
 * @param {Object} plotState - The current plot state
 * @returns {Promise} - Resolves when the element's image (if any) is loaded
 */
function createPlacedElement(elementData, plotState) {
  return new Promise((resolve) => {
    // <<< MODIFIED: Return a Promise
    const stage = document.getElementById('stage');
    if (!stage) {
      resolve(); // Resolve immediately if stage not found
      return;
    }

    // Create element
    const element = document.createElement('div');
    element.className = 'placed-element';
    element.setAttribute('data-id', elementData.id);
    element.setAttribute('data-element-id', elementData.elementId);

    // Position element
    element.style.left = `${elementData.x}px`;
    element.style.top = `${elementData.y}px`;
    element.style.height = `${elementData.height}px`;
    element.style.zIndex = elementData.zIndex;

    // Initially set width, will be adjusted when image loads
    element.style.width = `${elementData.width}px`;

    // Create image
    const img = document.createElement('img');
    img.src = `/images/elements/${elementData.image}`;
    img.alt = elementData.elementName;

    // Apply flip state to the image initially
    if (elementData.flipped) {
      img.style.transform = 'scaleX(-1)';
    }

    img.onload = function () {
      // Calculate the appropriate width based on the image's aspect ratio
      const aspectRatio = this.naturalWidth / this.naturalHeight;
      const newWidth = Math.round(elementData.height * aspectRatio);

      // Update the element width in the DOM
      element.style.width = `${newWidth}px`;

      // Update the element width in state
      const elementIndex = plotState.elements.findIndex((el) => el.id === elementData.id);
      if (elementIndex !== -1) {
        plotState.elements[elementIndex].width = newWidth;
      }

      resolve();
    };
    // Handle image loading errors
    img.onerror = function () {
      console.warn(`Failed to load image for element ${elementData.elementName}`);
      resolve();
    };

    element.appendChild(img);

    // Add label if present
    if (elementData.label) {
      const label = document.createElement('div');
      label.className = 'element-label';
      label.textContent = elementData.label;
      element.appendChild(label);
    }

    // ------------- Add actions to the element ----------------
    // Add edit button
    const editAction = document.createElement('div');
    editAction.className = 'element-actions';
    editAction.id = 'edit-action';

    const editBtn = document.createElement('button');
    editBtn.className = 'edit-element';
    editBtn.innerHTML = '<i class="fa-regular fa-pen-to-square"></i>';
    editBtn.title = 'Edit properties';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openPropertiesModal(elementData.id, plotState);
    });

    // Add button event handlers (mousedown/up/leave for visual feedback)
    editBtn.addEventListener('mousedown', function (e) {
      this.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.3)';
    });
    editBtn.addEventListener('mouseup', function () {
      this.style.boxShadow = '';
    });
    editBtn.addEventListener('mouseleave', function () {
      this.style.boxShadow = '';
    });

    editAction.appendChild(editBtn);
    element.appendChild(editAction);

    // Add delete button
    const deleteAction = document.createElement('div');
    deleteAction.className = 'element-actions';
    deleteAction.id = 'delete-action';

    // Setup delete button confirmation
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'edit-element';
    deleteBtn.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
    deleteBtn.title = 'Delete Element';
    deleteBtn.id = 'delete-action-btn';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setupConfirmButton(
        deleteBtn,
        () => {
          deleteElement(elementData.id, plotState);
        },
        {
          confirmText: 'Delete',
          confirmTitle: 'Permanent',
          stopPropagation: true,
          event: e,
        }
      );
    });

    // Add button event handlers (mousedown/up/leave for visual feedback)
    deleteBtn.addEventListener('mousedown', function (e) {
      this.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.3)';
    });
    deleteBtn.addEventListener('mouseup', function () {
      this.style.boxShadow = '';
    });
    deleteBtn.addEventListener('mouseleave', function () {
      this.style.boxShadow = '';
    });

    deleteAction.appendChild(deleteBtn);
    element.appendChild(deleteAction);

    // Add flip button
    const flipAction = document.createElement('div');
    flipAction.className = 'element-actions';
    flipAction.id = 'flip-action';

    const flipBtn = document.createElement('button');
    flipBtn.className = 'edit-element flip-btn';
    flipBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
    flipBtn.title = 'Flip Horizontally';
    if (elementData.flipped) {
      flipBtn.classList.add('flipped'); // Add class if initially flipped
    }

    flipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const elementId = parseInt(element.getAttribute('data-id'));
      const elementIndex = plotState.elements.findIndex((el) => el.id === elementId);

      if (elementIndex === -1) return;

      // Prevent multiple flips by checking if element is already flipping
      if (element.classList.contains('flipping')) return;

      // Get current flip state
      const currentlyFlipped = plotState.elements[elementIndex].flipped;

      // IMMEDIATELY hide controls before adding any animation classes
      const controls = element.querySelectorAll('.element-actions, .element-label');
      controls.forEach((control) => {
        control.style.opacity = '0';
        control.style.pointerEvents = 'none';
        control.style.transition = 'none'; // Disable transitions to prevent flicker
      });

      // Add an overlay to prevent interactions during flip
      const flipOverlay = document.createElement('div');
      flipOverlay.className = 'flip-overlay';
      element.appendChild(flipOverlay);

      // Small delay to ensure controls are hidden before animation starts
      requestAnimationFrame(() => {
        // Apply the flipping class and direction class
        element.classList.add('flipping');
        element.classList.add(currentlyFlipped ? 'to-left' : 'to-right');

        // Set up animation end handler for the image
        const imageElement = element.querySelector('img');
        if (!imageElement) {
          // Clean up if no image is found
          finishFlip();
          return;
        }

        const handleAnimationEnd = () => {
          // Toggle state in data
          plotState.elements[elementIndex].flipped = !currentlyFlipped;

          // Apply the final transform state
          imageElement.style.transform = !currentlyFlipped ? 'scaleX(-1)' : '';

          // Update button appearance
          flipBtn.classList.toggle('flipped', !currentlyFlipped);
          flipBtn.title = !currentlyFlipped ? 'Unflip Horizontally' : 'Flip Horizontally';

          // Clean up animation classes
          element.classList.remove('flipping', 'to-right', 'to-left');

          // Clean up event listener
          imageElement.removeEventListener('animationend', handleAnimationEnd);

          // Remove the overlay
          if (flipOverlay && flipOverlay.parentNode) {
            flipOverlay.remove();
          }

          // Fade the controls back in
          setTimeout(() => {
            controls.forEach((control) => {
              control.removeAttribute('style');
            });
          }, 50);

          // Mark plot as modified
          markPlotAsModified(plotState);
        };

        // Add animation end listener
        imageElement.addEventListener('animationend', handleAnimationEnd);

        // Fallback in case animation end doesn't fire
        const fallbackTimeout = setTimeout(() => {
          if (element.classList.contains('flipping')) {
            imageElement.removeEventListener('animationend', handleAnimationEnd);
            handleAnimationEnd();
          }
        }, 500); // Slightly longer than animation duration
      });
    });

    // Add button event handlers
    flipBtn.addEventListener('mousedown', function (e) {
      this.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.3)';
    });
    flipBtn.addEventListener('mouseup', function () {
      this.style.boxShadow = '';
    });
    flipBtn.addEventListener('mouseleave', function () {
      this.style.boxShadow = '';
    });

    flipAction.appendChild(flipBtn);
    element.appendChild(flipAction);

    // Make draggable within stage
    makeDraggableOnStage(element, plotState);

    // Add to stage
    stage.appendChild(element);

    if (!img.src || img.complete) {
      // Manually trigger the logic if needed, or just resolve
      if (img.complete && img.naturalWidth > 0) {
        img.onload(); // Call onload manually if image is already loaded
      } else if (!img.src) {
        resolve(); // Resolve if there's no image src
      }
    }

    if (plotState.updateInputSuggestions) plotState.updateInputSuggestions();
  }); // End of Promise constructor
}

/**
 * Make an element draggable within the stage
 * @param {HTMLElement} element - The element to make draggable
 * @param {Object} plotState - The current plot state
 */
function makeDraggableOnStage(element, plotState) {
  let startX, startY, startLeft, startTop;
  let isDraggingGroup = false;
  let groupOffsets = []; // Store offsets AND dimensions for group dragging

  element.addEventListener('mousedown', startDrag);
  element.addEventListener('touchstart', startDrag, { passive: false });

  function startDrag(e) {
    // If clicked on a button or action element, don't start dragging
    if (e.target.closest('.element-actions') || e.target.classList.contains('edit-element')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const elementId = parseInt(element.getAttribute('data-id'));

    // Check if the dragged element is part of the selection
    isDraggingGroup = plotState.selectedElements.includes(elementId);

    if (!isDraggingGroup) {
      // If not dragging a group, clear selection unless Shift is held
      if (!e.shiftKey) {
        clearElementSelection(plotState);
      }
      bringToFront(elementId, plotState); // Bring single element to front
    } else {
      bringToFront(elementId, plotState);

      // Calculate offsets AND cache dimensions for all elements in the group
      // FIX: Use DOM positions instead of state positions
      groupOffsets = [];
      plotState.selectedElements.forEach((id) => {
        const domEl = document.querySelector(`.placed-element[data-id="${id}"]`);
        if (domEl) {
          const rect = domEl.getBoundingClientRect();
          
          // Get positions directly from DOM
          const elLeft = parseInt(window.getComputedStyle(domEl).left);
          const elTop = parseInt(window.getComputedStyle(domEl).top);
          const primaryLeft = parseInt(window.getComputedStyle(element).left);
          const primaryTop = parseInt(window.getComputedStyle(element).top);
          
          // Calculate offset using DOM positions
          const offsetX = id === elementId ? 0 : elLeft - primaryLeft;
          const offsetY = id === elementId ? 0 : elTop - primaryTop;
          
          groupOffsets.push({
            id: id,
            offsetX: offsetX,
            offsetY: offsetY,
            width: rect.width,
            height: rect.height,
          });
        }
      });
    }

    // Track initial positions of the primary dragged element
    if (e.type === 'touchstart') {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    } else {
      startX = e.clientX;
      startY = e.clientY;
    }

    startLeft = parseInt(window.getComputedStyle(element).left);
    startTop = parseInt(window.getComputedStyle(element).top);

    document.body.classList.add('dragging-on-stage');

    // Add move and end events
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
  }

  function dragMove(e) {
    e.preventDefault();

    let clientX, clientY;
    if (e.type === 'touchmove') {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const dx = clientX - startX;
    const dy = clientY - startY;

    // Calculate the potential new primary position
    const nextPrimaryLeft = startLeft + dx;
    const nextPrimaryTop = startTop + dy;

    let constrainedPrimaryLeft = nextPrimaryLeft;
    let constrainedPrimaryTop = nextPrimaryTop;

    const stage = document.getElementById('stage');
    const stageRect = stage.getBoundingClientRect();
    const stageWidth = stageRect.width;
    const stageHeight = stageRect.height;
    const boundaryBuffer = 30;

    if (isDraggingGroup && groupOffsets.length > 0) {
      // Calculate the bounding box of the entire group based on potential new positions
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      groupOffsets.forEach((offsetData) => {
        const memberNextX = nextPrimaryLeft + offsetData.offsetX;
        const memberNextY = nextPrimaryTop + offsetData.offsetY;
        const memberWidth = offsetData.width;
        const memberHeight = offsetData.height;

        minX = Math.min(minX, memberNextX);
        minY = Math.min(minY, memberNextY);
        maxX = Math.max(maxX, memberNextX + memberWidth);
        maxY = Math.max(maxY, memberNextY + memberHeight);
      });

      // Calculate necessary adjustments to keep the group within stage bounds
      let deltaX = 0;
      if (minX < 0) {
        deltaX = -minX; // Adjust right
      } else if (maxX > stageWidth - boundaryBuffer) {
        // Check against width minus buffer
        deltaX = stageWidth - boundaryBuffer - maxX; // Adjust left (negative value)
      }

      let deltaY = 0;
      if (minY < 0) {
        deltaY = -minY; // Adjust down
      } else if (maxY > stageHeight - boundaryBuffer) {
        // Check against height minus buffer
        deltaY = stageHeight - boundaryBuffer - maxY; // Adjust up (negative value)
      }

      // Apply adjustments to the primary element's potential position
      constrainedPrimaryLeft = nextPrimaryLeft + deltaX;
      constrainedPrimaryTop = nextPrimaryTop + deltaY;
    } else {
      // Apply constraints for a single element (keeping the original logic for single elements)
      const elementRect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      const marginRight = parseInt(computedStyle.marginRight) || 0;
      const marginBottom = parseInt(computedStyle.marginBottom) || 0;
      const marginLeft = parseInt(computedStyle.marginLeft) || 0;
      const marginTop = parseInt(computedStyle.marginTop) || 0;

      // Calculate max allowed positions considering margins for single element
      const maxLeft = stageWidth - elementRect.width - marginRight - marginLeft;
      const maxTop = stageHeight - elementRect.height - marginBottom - marginTop;

      // Apply constraints for single element (0 to max)
      constrainedPrimaryLeft = Math.max(0, Math.min(maxLeft, nextPrimaryLeft));
      constrainedPrimaryTop = Math.max(0, Math.min(maxTop, nextPrimaryTop));
    }

    // Calculate the actual delta applied after constraints
    const actualDx = constrainedPrimaryLeft - startLeft;
    const actualDy = constrainedPrimaryTop - startTop;

    if (isDraggingGroup) {
      // Move all elements in the group using the constrained delta
      groupOffsets.forEach((offsetData) => {
        const groupElement = document.querySelector(`.placed-element[data-id="${offsetData.id}"]`);
        const elementStateIndex = plotState.elements.findIndex((el) => el.id === offsetData.id); // Find original state

        if (groupElement && elementStateIndex !== -1) {
          // Calculate new position based on the DOM positions + actual constrained delta
          const targetLeft = startLeft + offsetData.offsetX + actualDx;
          const targetTop = startTop + offsetData.offsetY + actualDy;

          // Apply position visually during drag
          groupElement.style.left = `${targetLeft}px`;
          groupElement.style.top = `${targetTop}px`;
        }
      });
    } else {
      // Move just the single element
      element.style.left = `${constrainedPrimaryLeft}px`;
      element.style.top = `${constrainedPrimaryTop}px`;
    }
  }

  function dragEnd(e) {
    document.body.classList.remove('dragging-on-stage');

    // Final position update in state - Calculate based on the *actual* final position of the primary element
    const finalPrimaryRect = element.getBoundingClientRect();
    const stageRect = document.getElementById('stage').getBoundingClientRect();
    const finalPrimaryLeft = finalPrimaryRect.left - stageRect.left;
    const finalPrimaryTop = finalPrimaryRect.top - stageRect.top;

    if (isDraggingGroup) {
      // Update all elements based on the final position
      groupOffsets.forEach((offsetData) => {
        const elementStateIndex = plotState.elements.findIndex((el) => el.id === offsetData.id);
        if (elementStateIndex !== -1) {
          plotState.elements[elementStateIndex].x = finalPrimaryLeft + offsetData.offsetX;
          plotState.elements[elementStateIndex].y = finalPrimaryTop + offsetData.offsetY;
        }
      });
    } else {
      // Update single element state
      const elementId = parseInt(element.getAttribute('data-id'));
      const elementIndex = plotState.elements.findIndex((el) => el.id === elementId);
      if (elementIndex !== -1) {
        plotState.elements[elementIndex].x = finalPrimaryLeft;
        plotState.elements[elementIndex].y = finalPrimaryTop;
      }
    }

    markPlotAsModified(plotState); // Mark modified after drag ends

    // Clean up listeners
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('touchmove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchend', dragEnd);

    // Reset group drag state
    isDraggingGroup = false;
    groupOffsets = [];
  }
}

/**
 * Make an element draggable within the stage
 * @param {HTMLElement} element - The element to make draggable
 * @param {Object} plotState - The current plot state
 */
function makeDraggableOnStage(element, plotState) {
  let startX, startY, startLeft, startTop;
  let isDraggingGroup = false;
  let groupOffsets = []; // Store offsets AND dimensions for group dragging

  element.addEventListener('mousedown', startDrag);
  element.addEventListener('touchstart', startDrag, { passive: false });

  function startDrag(e) {
    // If shift key is pressed, don't start dragging - let the selection logic handle it
    if (e.shiftKey) {
      return;
    }

    // If clicked on a button or action element, don't start dragging
    if (e.target.closest('.element-actions') || e.target.classList.contains('edit-element')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const elementId = parseInt(element.getAttribute('data-id'));

    // Check if the dragged element is part of the selection
    isDraggingGroup = plotState.selectedElements.includes(elementId);

    if (!isDraggingGroup) {
      // If not dragging a group, clear selection unless Shift is held
      if (!e.shiftKey) {
        clearElementSelection(plotState);
      }
      bringToFront(elementId, plotState); // Bring single element to front
    } else {
      bringToFront(elementId, plotState);

      // Calculate offsets AND cache dimensions for all elements in the group
      // FIX: Use DOM positions instead of state positions
      groupOffsets = [];
      plotState.selectedElements.forEach((id) => {
        const domEl = document.querySelector(`.placed-element[data-id="${id}"]`);
        if (domEl) {
          const rect = domEl.getBoundingClientRect();
          
          // Get positions directly from DOM
          const elLeft = parseInt(window.getComputedStyle(domEl).left);
          const elTop = parseInt(window.getComputedStyle(domEl).top);
          const primaryLeft = parseInt(window.getComputedStyle(element).left);
          const primaryTop = parseInt(window.getComputedStyle(element).top);
          
          // Calculate offset using DOM positions
          const offsetX = id === elementId ? 0 : elLeft - primaryLeft;
          const offsetY = id === elementId ? 0 : elTop - primaryTop;
          
          groupOffsets.push({
            id: id,
            offsetX: offsetX,
            offsetY: offsetY,
            width: rect.width,
            height: rect.height,
          });
        }
      });
    }

    // Track initial positions of the primary dragged element
    if (e.type === 'touchstart') {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    } else {
      startX = e.clientX;
      startY = e.clientY;
    }

    startLeft = parseInt(window.getComputedStyle(element).left);
    startTop = parseInt(window.getComputedStyle(element).top);

    document.body.classList.add('dragging-on-stage');

    // Add move and end events
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
  }

  // Rest of the function remains the same
  function dragMove(e) {
    e.preventDefault();
    
    // Rest of dragMove implementation
    // ...
  }

  function dragEnd(e) {
    // Rest of dragEnd implementation
    // ...
  }
}

/**
 * Initializes lasso selection functionality
 * @param {Object} plotState - The current plot state
 */
function initLassoSelection(plotState) {
  const stage = document.getElementById('stage');
  let lassoActive = false;
  let lassoStartX, lassoStartY;
  let lassoElement = null;

  // Handler for element selection via shift+click
  // This gets called BEFORE the element's own drag handler
  stage.addEventListener('mousedown', (e) => {
    const clickedElement = e.target.closest('.placed-element');
    
    // Case 1: Shift+Click on an element (for selection)
    if (e.shiftKey && clickedElement) {
      // Skip if clicking on a button
      if (e.target.closest('.element-actions') || 
          e.target.classList.contains('edit-element') || 
          e.target.classList.contains('favorite-button')) {
        return; // Let the button's handler take over
      }
      
      e.stopPropagation();
      
      // Toggle selection for this element
      const elementId = parseInt(clickedElement.getAttribute('data-id'));
      const selectionIndex = plotState.selectedElements.indexOf(elementId);
      
      if (selectionIndex !== -1) {
        // Remove from selection
        plotState.selectedElements.splice(selectionIndex, 1);
        clickedElement.classList.remove('selected');
      } else {
        // Add to selection
        plotState.selectedElements.push(elementId);
        clickedElement.classList.add('selected');
      }
      
      // Important: we set a flag on the event to tell the drag handler to ignore this event
      e._handledBySelection = true;
      return;
    }
    
    // Case 2: Click directly on the stage (for lasso selection)
    if ((e.target === stage || e.target.classList.contains('grid-overlay')) && !clickedElement) {
      // Clear previous selection if not holding Shift
      if (!e.shiftKey) {
        clearElementSelection(plotState);
      }

      lassoActive = true;
      lassoStartX = e.clientX - stage.getBoundingClientRect().left;
      lassoStartY = e.clientY - stage.getBoundingClientRect().top;

      // Create visual lasso element
      lassoElement = document.createElement('div');
      lassoElement.className = 'lasso-box';
      lassoElement.style.left = `${lassoStartX}px`;
      lassoElement.style.top = `${lassoStartY}px`;
      stage.appendChild(lassoElement);

      document.addEventListener('mousemove', handleLassoMove);
      document.addEventListener('mouseup', handleLassoEnd, { once: true });
    } 
    // Case 3: Click on empty space but not on stage (outside any element)
    else if (!clickedElement && !e.shiftKey) {
      clearElementSelection(plotState);
    }
  }, true); // Use capturing phase to handle before element's own listeners

  function handleLassoMove(e) {
    if (!lassoActive || !lassoElement) return;
    e.preventDefault();

    const stageRect = stage.getBoundingClientRect();
    const currentX = e.clientX - stageRect.left;
    const currentY = e.clientY - stageRect.top;

    const width = Math.abs(currentX - lassoStartX);
    const height = Math.abs(currentY - lassoStartY);
    const left = Math.min(currentX, lassoStartX);
    const top = Math.min(currentY, lassoStartY);

    lassoElement.style.width = `${width}px`;
    lassoElement.style.height = `${height}px`;
    lassoElement.style.left = `${left}px`;
    lassoElement.style.top = `${top}px`;
  }

  function handleLassoEnd(e) {
    if (!lassoActive || !lassoElement) return;
    lassoActive = false;

    const lassoRect = lassoElement.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();

    // Adjust lassoRect to be relative to the stage
    const relativeLassoRect = {
      left: lassoRect.left - stageRect.left,
      top: lassoRect.top - stageRect.top,
      right: lassoRect.right - stageRect.left,
      bottom: lassoRect.bottom - stageRect.top,
      width: lassoRect.width,
      height: lassoRect.height,
    };

    stage.querySelectorAll('.placed-element').forEach((el) => {
      const elRect = el.getBoundingClientRect();
      // Adjust elRect to be relative to the stage
      const relativeElRect = {
        left: elRect.left - stageRect.left,
        top: elRect.top - stageRect.top,
        right: elRect.right - stageRect.left,
        bottom: elRect.bottom - stageRect.top,
        width: elRect.width,
        height: elRect.height,
      };

      // Simple intersection check
      const intersects = !(relativeElRect.right < relativeLassoRect.left || 
                          relativeElRect.left > relativeLassoRect.right || 
                          relativeElRect.bottom < relativeLassoRect.top || 
                          relativeElRect.top > relativeLassoRect.bottom);

      if (intersects) {
        const elementId = parseInt(el.getAttribute('data-id'));
        if (!plotState.selectedElements.includes(elementId)) {
          plotState.selectedElements.push(elementId);
          el.classList.add('selected');
        }
      }
    });

    // Remove lasso visual element
    lassoElement.remove();
    lassoElement = null;

    document.removeEventListener('mousemove', handleLassoMove);
  }
}

/**
 * Make an element draggable within the stage
 * @param {HTMLElement} element - The element to make draggable
 * @param {Object} plotState - The current plot state
 */
function makeDraggableOnStage(element, plotState) {
  let startX, startY, startLeft, startTop;
  let isDraggingGroup = false;
  let groupOffsets = []; // Store offsets AND dimensions for group dragging

  element.addEventListener('mousedown', startDrag);
  element.addEventListener('touchstart', startDrag, { passive: false });

  function startDrag(e) {
    // Skip if this event was already handled by our selection logic
    if (e._handledBySelection === true) {
      return;
    }
    
    // If clicked on a button or action element, don't start dragging
    if (e.target.closest('.element-actions') || e.target.classList.contains('edit-element')) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const elementId = parseInt(element.getAttribute('data-id'));

    // Check if the dragged element is part of the selection
    isDraggingGroup = plotState.selectedElements.includes(elementId);

    if (!isDraggingGroup) {
      // If not dragging a group, clear selection unless Shift is held
      if (!e.shiftKey) {
        clearElementSelection(plotState);
      }
      bringToFront(elementId, plotState); // Bring single element to front
    } else {
      bringToFront(elementId, plotState);

      // Calculate offsets AND cache dimensions for all elements in the group
      groupOffsets = [];
      plotState.selectedElements.forEach((id) => {
        const domEl = document.querySelector(`.placed-element[data-id="${id}"]`);
        if (domEl) {
          const rect = domEl.getBoundingClientRect();
          
          // Get positions directly from DOM
          const elLeft = parseInt(window.getComputedStyle(domEl).left);
          const elTop = parseInt(window.getComputedStyle(domEl).top);
          const primaryLeft = parseInt(window.getComputedStyle(element).left);
          const primaryTop = parseInt(window.getComputedStyle(element).top);
          
          // Calculate offset using DOM positions
          const offsetX = id === elementId ? 0 : elLeft - primaryLeft;
          const offsetY = id === elementId ? 0 : elTop - primaryTop;
          
          groupOffsets.push({
            id: id,
            offsetX: offsetX,
            offsetY: offsetY,
            width: rect.width,
            height: rect.height,
          });
        }
      });
    }

    // Track initial positions of the primary dragged element
    if (e.type === 'touchstart') {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    } else {
      startX = e.clientX;
      startY = e.clientY;
    }

    startLeft = parseInt(window.getComputedStyle(element).left);
    startTop = parseInt(window.getComputedStyle(element).top);

    document.body.classList.add('dragging-on-stage');

    // Add move and end events
    document.addEventListener('mousemove', dragMove);
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
  }

  function dragMove(e) {
    e.preventDefault();

    let clientX, clientY;
    if (e.type === 'touchmove') {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const dx = clientX - startX;
    const dy = clientY - startY;

    // Calculate the potential new primary position
    const nextPrimaryLeft = startLeft + dx;
    const nextPrimaryTop = startTop + dy;

    let constrainedPrimaryLeft = nextPrimaryLeft;
    let constrainedPrimaryTop = nextPrimaryTop;

    const stage = document.getElementById('stage');
    const stageRect = stage.getBoundingClientRect();
    const stageWidth = stageRect.width;
    const stageHeight = stageRect.height;
    const boundaryBuffer = 30;

    if (isDraggingGroup && groupOffsets.length > 0) {
      // Calculate the bounding box of the entire group based on potential new positions
      let minX = Infinity,
        minY = Infinity,
        maxX = -Infinity,
        maxY = -Infinity;

      groupOffsets.forEach((offsetData) => {
        const memberNextX = nextPrimaryLeft + offsetData.offsetX;
        const memberNextY = nextPrimaryTop + offsetData.offsetY;
        const memberWidth = offsetData.width;
        const memberHeight = offsetData.height;

        minX = Math.min(minX, memberNextX);
        minY = Math.min(minY, memberNextY);
        maxX = Math.max(maxX, memberNextX + memberWidth);
        maxY = Math.max(maxY, memberNextY + memberHeight);
      });

      // Calculate necessary adjustments to keep the group within stage bounds
      let deltaX = 0;
      if (minX < 0) {
        deltaX = -minX; // Adjust right
      } else if (maxX > stageWidth - boundaryBuffer) {
        // Check against width minus buffer
        deltaX = stageWidth - boundaryBuffer - maxX; // Adjust left (negative value)
      }

      let deltaY = 0;
      if (minY < 0) {
        deltaY = -minY; // Adjust down
      } else if (maxY > stageHeight - boundaryBuffer) {
        // Check against height minus buffer
        deltaY = stageHeight - boundaryBuffer - maxY; // Adjust up (negative value)
      }

      // Apply adjustments to the primary element's potential position
      constrainedPrimaryLeft = nextPrimaryLeft + deltaX;
      constrainedPrimaryTop = nextPrimaryTop + deltaY;
    } else {
      // Apply constraints for a single element (keeping the original logic for single elements)
      const elementRect = element.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(element);
      const marginRight = parseInt(computedStyle.marginRight) || 0;
      const marginBottom = parseInt(computedStyle.marginBottom) || 0;
      const marginLeft = parseInt(computedStyle.marginLeft) || 0;
      const marginTop = parseInt(computedStyle.marginTop) || 0;

      // Calculate max allowed positions considering margins for single element
      const maxLeft = stageWidth - elementRect.width - marginRight - marginLeft;
      const maxTop = stageHeight - elementRect.height - marginBottom - marginTop;

      // Apply constraints for single element (0 to max)
      constrainedPrimaryLeft = Math.max(0, Math.min(maxLeft, nextPrimaryLeft));
      constrainedPrimaryTop = Math.max(0, Math.min(maxTop, nextPrimaryTop));
    }

    // Calculate the actual delta applied after constraints
    const actualDx = constrainedPrimaryLeft - startLeft;
    const actualDy = constrainedPrimaryTop - startTop;

    if (isDraggingGroup) {
      // Move all elements in the group using the constrained delta
      groupOffsets.forEach((offsetData) => {
        const groupElement = document.querySelector(`.placed-element[data-id="${offsetData.id}"]`);
        const elementStateIndex = plotState.elements.findIndex((el) => el.id === offsetData.id); // Find original state

        if (groupElement && elementStateIndex !== -1) {
          // Calculate new position based on the DOM positions + actual constrained delta
          const targetLeft = startLeft + offsetData.offsetX + actualDx;
          const targetTop = startTop + offsetData.offsetY + actualDy;

          // Apply position visually during drag
          groupElement.style.left = `${targetLeft}px`;
          groupElement.style.top = `${targetTop}px`;
        }
      });
    } else {
      // Move just the single element
      element.style.left = `${constrainedPrimaryLeft}px`;
      element.style.top = `${constrainedPrimaryTop}px`;
    }
  }

  function dragEnd(e) {
    document.body.classList.remove('dragging-on-stage');

    // Final position update in state - Calculate based on the *actual* final position of the primary element
    const finalPrimaryRect = element.getBoundingClientRect();
    const stageRect = document.getElementById('stage').getBoundingClientRect();
    const finalPrimaryLeft = finalPrimaryRect.left - stageRect.left;
    const finalPrimaryTop = finalPrimaryRect.top - stageRect.top;

    if (isDraggingGroup) {
      // Update all elements based on the final position
      groupOffsets.forEach((offsetData) => {
        const elementStateIndex = plotState.elements.findIndex((el) => el.id === offsetData.id);
        if (elementStateIndex !== -1) {
          plotState.elements[elementStateIndex].x = finalPrimaryLeft + offsetData.offsetX;
          plotState.elements[elementStateIndex].y = finalPrimaryTop + offsetData.offsetY;
        }
      });
    } else {
      // Update single element state
      const elementId = parseInt(element.getAttribute('data-id'));
      const elementIndex = plotState.elements.findIndex((el) => el.id === elementId);
      if (elementIndex !== -1) {
        plotState.elements[elementIndex].x = finalPrimaryLeft;
        plotState.elements[elementIndex].y = finalPrimaryTop;
      }
    }

    markPlotAsModified(plotState); // Mark modified after drag ends

    // Clean up listeners
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('touchmove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchend', dragEnd);

    // Reset group drag state
    isDraggingGroup = false;
    groupOffsets = [];
  }
}

/**
 * Clears the current element selection
 * @param {Object} plotState - The current plot state
 */
function clearElementSelection(plotState) {
  plotState.selectedElements.forEach((id) => {
    const el = document.querySelector(`.placed-element[data-id="${id}"]`);
    if (el) {
      el.classList.remove('selected');
    }
  });
  plotState.selectedElements = [];
}

/**
 * Bring an element to the front (highest z-index)
 * @param {number} elementId - The ID of the element to bring to front
 * @param {Object} plotState - The current plot state
 */
function bringToFront(elementId, plotState) {
  const elementIndex = plotState.elements.findIndex((el) => el.id === elementId);

  if (elementIndex !== -1) {
    // Define a maximum z-index value
    const MAX_Z_INDEX = 500;

    // Check if we're approaching the limit
    if (plotState.nextZIndex >= MAX_Z_INDEX) {
      // Reset all z-indexes while maintaining relative order
      // Sort elements by current z-index
      plotState.elements.sort((a, b) => a.zIndex - b.zIndex);

      // Reassign z-indexes starting from 1
      plotState.elements.forEach((element, index) => {
        element.zIndex = index + 1;

        // Update DOM elements
        const domElement = document.querySelector(`.placed-element[data-id="${element.id}"]`);
        if (domElement) {
          domElement.style.zIndex = element.zIndex;
        }
      });

      // Reset counter
      plotState.nextZIndex = plotState.elements.length + 1;
    }

    // Now bring the requested element to front
    plotState.elements[elementIndex].zIndex = plotState.nextZIndex++;

    // Update z-index in DOM
    const domElement = document.querySelector(`.placed-element[data-id="${elementId}"]`);
    if (domElement) {
      domElement.style.zIndex = plotState.elements[elementIndex].zIndex;
    }
  }
}

/**
 * Open the element properties modal
 * @param {number} elementId - The ID of the element to edit
 * @param {Object} plotState - The current plot state
 */
function openPropertiesModal(elementId, plotState) {
  const propsModal = document.getElementById('element-props-modal');
  if (!propsModal) return;

  const elementIndex = plotState.elements.findIndex((el) => el.id === elementId);

  if (elementIndex === -1) return;

  // Store selected element info
  plotState.selectedElement = elementId;

  // Fill form with element data
  const form = document.getElementById('element-props-form');
  form.reset();

  document.getElementById('element_index').value = elementIndex;
  document.getElementById('element_label').value = plotState.elements[elementIndex].label || '';
  document.getElementById('element_notes').value = plotState.elements[elementIndex].notes || '';

  // Show modal
  openModal(propsModal);

  // Focus on label input
  document.getElementById('element_label').focus();

  // Handle form submission
  form.onsubmit = (e) => {
    e.preventDefault();
    applyElementProperties(plotState);
  };

  // Handle delete button
  document.querySelector('#element-props-form .delete-button').onclick = () => {
    setupConfirmButton(
      document.querySelector('#element-props-form .delete-button'),
      () => {
        deleteElement(elementId, plotState);
        closeModal(propsModal);
      },
      {
        confirmText: 'Confirm',
        confirmTitle: 'This is Permanent!',
        originalText: 'Delete',
      }
    );
  };
}

/**
 * Apply properties from modal to element
 * @param {Object} plotState - The current plot state
 */
function applyElementProperties(plotState) {
  const propsModal = document.getElementById('element-props-modal');

  const elementIndex = parseInt(document.getElementById('element_index').value);
  const label = document.getElementById('element_label').value.trim();
  const notes = document.getElementById('element_notes').value.trim();

  if (elementIndex < 0 || elementIndex >= plotState.elements.length) return;

  // Update state
  plotState.elements[elementIndex].label = label;
  plotState.elements[elementIndex].notes = notes;

  // Update DOM element
  const elementId = plotState.elements[elementIndex].id;
  const domElement = document.querySelector(`.placed-element[data-id="${elementId}"]`);

  if (domElement) {
    // Update label
    let labelElement = domElement.querySelector('.element-label');

    if (label) {
      // If label exists, update it, otherwise create a new one
      if (labelElement) {
        labelElement.textContent = label;
      } else {
        labelElement = document.createElement('div');
        labelElement.className = 'element-label';
        labelElement.textContent = label;
        domElement.appendChild(labelElement);
      }
    } else if (labelElement) {
      // Remove label if it exists but should no longer be displayed
      labelElement.remove();
    }
  }

  // Close the modal
  closeModal(propsModal);

  renderElementInfoList(plotState);
  markPlotAsModified(plotState);

  if (plotState.updateInputSuggestions) plotState.updateInputSuggestions();
}

/**
 * Delete element from stage and state
 * @param {number} elementId - The ID of the element to delete
 * @param {Object} plotState - The current plot state
 */
function deleteElement(elementId, plotState) {
  const domElement = document.querySelector(`.placed-element[data-id="${elementId}"]`);

  if (domElement) {
    // Remove from state immediately (don't wait for animation)
    const elementIndex = plotState.elements.findIndex((el) => el.id === elementId);
    if (elementIndex !== -1) {
      plotState.elements.splice(elementIndex, 1);
    }

    // Add deleting class to trigger animation
    requestAnimationFrame(() => {
      domElement.classList.add('deleting');

      // Set up animation end listener
      const handleAnimationEnd = () => {
        domElement.removeEventListener('animationend', handleAnimationEnd);
        domElement.remove();
      };

      // Add event listener for animation end
      domElement.addEventListener('animationend', handleAnimationEnd);

      // Fallback: If animation doesn't complete after 400ms, force remove
      setTimeout(() => {
        if (document.body.contains(domElement)) {
          domElement.remove();
        }
      }, 400); // Slightly longer than animation duration (300ms)
    });
  } else {
    // Handle case where DOM element isn't found but might be in state
    const elementIndex = plotState.elements.findIndex((el) => el.id === elementId);
    if (elementIndex !== -1) {
      plotState.elements.splice(elementIndex, 1);
    }
  }

  renderElementInfoList(plotState);
  markPlotAsModified(plotState);

  if (plotState.updateInputSuggestions) plotState.updateInputSuggestions();
}

/**
 * Initialize modal controls
 * @param {Object} plotState - The current plot state
 */
function initModalControls(plotState) {
  // DOM Elements
  const stage = document.getElementById('stage');
  const saveButton = document.getElementById('save-plot');
  const saveChangesButton = document.getElementById('save-changes');
  const loadButton = document.getElementById('my-plots');
  const saveModal = document.getElementById('save-plot-modal');
  const loadModal = document.getElementById('my-plots-modal');
  const propsModal = document.getElementById('element-props-modal');

  // Setup save button
  if (saveButton) {
    saveButton.addEventListener('click', () => {
      // Only show save modal if there are elements on the stage
      if (plotState.elements.length > 0) {
        // Clear the plot name input field when opening the save modal
        const plotNameInput = document.getElementById('plot_name');
        if (plotNameInput) {
          plotNameInput.value = '';
        }

        openModal(saveModal);

        // Load existing plots for overwrite options
        loadExistingPlotsForOverwrite(plotState);

        // Handle form submission for new plot
        const saveForm = document.getElementById('save-new-plot-form');
        const saveNewButton = saveForm ? saveForm.querySelector('#save-new-button') : null;

        if (saveForm && saveNewButton) {
          // Remove any existing listeners to prevent multiple bindings
          const newSaveBtn = saveNewButton.cloneNode(true);
          saveNewButton.parentNode.replaceChild(newSaveBtn, saveNewButton);

          // Prevent form from submitting when pressing Enter
          saveForm.onsubmit = (e) => {
            e.preventDefault();
            return false;
          };

          // Add click handler to the save button with confirmation
          newSaveBtn.addEventListener('click', (e) => {
            e.preventDefault();

            // Get the plot name
            const plotName = document.getElementById('plot_name').value.trim();
            const plotTitle = document.getElementById('plot-title').textContent.trim();

            if (!plotName || plotName === plotTitle) {
              showNotification('Enter a unique plot name.', 'warning');
              return;
            }

            setupConfirmButton(
              newSaveBtn,
              () => {
                savePlot(true, null, null, null, plotState); // Save as new plot
              },
              {
                confirmText: 'Confirm Save',
                confirmTitle: 'This will create a new plot',
                originalText: 'Save as New',
                originalTitle: 'Save plot as new',
              }
            );
          });
        }
      } else {
        showNotification('There is nothing to save!', 'warning');
      }
    });
  }

  // Setup load button
  if (loadButton) {
    loadButton.addEventListener('click', () => {
      openModal(loadModal);
      loadSavedPlots(plotState);
    });
  }

  // Setup modal close buttons
  document.querySelectorAll('.modal .close-button, .modal .cancel-button').forEach((button) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = button.closest('.modal');
      closeModal(modal);
    });
  });

  // Close modal on outside click
  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  // Add specific handlers for the load plot modal
  if (loadModal) {
    const closeBtn = loadModal.querySelector('.close-button');
    const cancelBtn = loadModal.querySelector('.cancel-button');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal(loadModal));
    }

    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => closeModal(loadModal));
    }

    // Close when clicking outside the modal
    loadModal.addEventListener('click', (e) => {
      if (e.target === loadModal) closeModal(loadModal);
    });
  }

  // Add event handler for the save changes button
  if (saveChangesButton) {
    saveChangesButton.addEventListener('click', () => {
      if (plotState.currentPlotId) {
        // Save changes directly without showing modal
        savePlot(false, plotState.currentPlotId, null, null, plotState);
      }
    });
  }
}

/**
 * Save plot to database
 * @param {boolean} isNew - Whether this is a new plot or updating an existing one
 * @param {number|null} existingPlotId - ID of existing plot when overwriting
 * @param {string|null} newName - New name when renaming existing plot
 * @param {string|null} existingName - Original name when overwriting existing plot
 * @param {Object} plotState - The current plot state
 */
function savePlot(isNew = true, existingPlotId = null, newName = null, existingName = null, plotState) {
  let plotName;

  if (isNew) {
    plotName = document.getElementById('plot_name').value.trim();
  } else if (newName) {
    // Overwriting with a new name
    plotName = newName;
  } else if (existingName) {
    // Overwriting existing plot with its original name
    plotName = existingName;
  } else {
    // Saving changes to existing plot - use current name
    plotName = plotState.currentPlotName;
  }

  const venueId = document.getElementById('venue_select') ? document.getElementById('venue_select').value : null;
  const eventDateStart = document.getElementById('event_start') ? document.getElementById('event_start').value : null;
  const eventDateEnd = document.getElementById('event_end') ? document.getElementById('event_end').value : null;

  // Gather input list data
  const inputData = [];
  const inputItems = document.querySelectorAll('#input-list .input-item');
  inputItems.forEach((item) => {
    const number = parseInt(item.getAttribute('data-input-number'));
    const labelInput = item.querySelector('input[type="text"]');
    const label = labelInput ? labelInput.value.trim() : '';
    // Only save inputs that have a label
    if (label) {
      inputData.push({ input_number: number, input_name: label });
    }
  });

  if ((isNew || newName) && !plotName) {
    showNotification('Please enter a plot name', 'warning');
    return;
  }

  if (!plotName) {
    showNotification('Please enter a plot name', 'warning');
    return;
  }

  // Create plot data
  const plotData = {
    plot_name: plotName,
    venue_id: venueId || null,
    event_date_start: eventDateStart || null,
    event_date_end: eventDateEnd || null,
    elements: plotState.elements.map((el) => ({
      element_id: el.elementId,
      x_position: el.x,
      y_position: el.y,
      width: el.width,
      height: el.height,
      flipped: el.flipped ? 1 : 0,
      z_index: el.zIndex,
      label: el.label || '',
      notes: el.notes || '',
    })),
    inputs: inputData,
  };

  // For overwrite, add plot_id
  if (!isNew && existingPlotId) {
    plotData.plot_id = existingPlotId;
  }

  console.log('Sending plot data:', plotData);

  fetch('/handlers/save_plot.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(plotData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Show notification
        if (isNew) {
          showNotification('New Plot Saved!', 'success');
        } else if (newName || existingName) {
          showNotification('Plot Overwritten!', 'success');
        } else {
          showNotification('Changes Saved!', 'success');
        }

        // Update plot state
        if ((isNew && data.plot_id) || newName || existingPlotId) {
          if (isNew && data.plot_id) {
            plotState.currentPlotId = data.plot_id;
          }
          plotState.currentPlotName = plotData.plot_name;
          const plotTitle = document.getElementById('plot-title');
          if (plotTitle) plotTitle.textContent = plotData.plot_name;
        }

        // Reset UI
        plotState.isModified = false;
        const saveChangesButton = document.getElementById('save-changes');
        if (saveChangesButton) {
          saveChangesButton.classList.remove('visible');
          setTimeout(() => saveChangesButton.classList.add('hidden'), 300); // Match transition
        }
        const saveModal = document.getElementById('save-plot-modal');
        closeModal(saveModal);
        const plotNameInput = document.getElementById('plot_name');
        if (plotNameInput) plotNameInput.value = '';
        saveStateToStorage(plotState); // Save updated state
      } else {
        showNotification('Error saving plot: ' + (data.error || 'Unknown error'), 'error');
      }
    })
    .catch((error) => {
      console.error('Error saving plot:', error);
      showNotification('Error saving plot. Please try again.', 'error');
    });
}

/**
 * Load existing plots for the save dialog's overwrite section
 * @param {Object} plotState - The current plot state
 */
function loadExistingPlotsForOverwrite(plotState) {
  const plotsList = document.querySelector('.existing-plots-list');
  if (!plotsList) return;

  // Add overlay instead of replacing content
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.innerHTML = '<p class="loading-message">Loading your saved plots...</p>';
  loadingOverlay.style.position = 'absolute';
  loadingOverlay.style.top = '0';
  loadingOverlay.style.left = '0';
  loadingOverlay.style.width = '100%';
  loadingOverlay.style.height = '100%';
  loadingOverlay.style.background = 'rgba(255,255,255,0.8)';
  loadingOverlay.style.display = 'flex';
  loadingOverlay.style.alignItems = 'center';
  loadingOverlay.style.justifyContent = 'center';

  // Make sure the container is positioned relative
  plotsList.style.position = 'relative';

  // Add the overlay instead of replacing content
  plotsList.appendChild(loadingOverlay);

  // Show loading message
  plotsList.innerHTML = '<p class="loading-message">Loading your saved plots...</p>';

  // Fetch saved plots
  fetch('/handlers/get_plots.php')
    .then((response) => response.json())
    .then((data) => {
      // Remove the loading overlay first
      if (loadingOverlay.parentNode === plotsList) {
        plotsList.removeChild(loadingOverlay);
      }

      if (data.plots && data.plots.length > 0) {
        // Create plots list
        let html = '<ul class="plots-list">';
        data.plots.forEach((plot) => {
          const formattedDate = plot.event_date_start ? new Date(plot.event_date_start).toLocaleDateString() : 'No date';
          html += `<li class="plot-item">
            <div class="plot-info">
              <div class="plot-name">${plot.plot_name}</div>
              <div class="plot-details">
                <span class="venue">${plot.venue_name}</span>
                <span class="date">${formattedDate}</span>
              </div>
            </div>
            <div class="plot-actions">
              <button type="button" class="overwrite-btn" data-plot-id="${plot.plot_id}" data-plot-name="${plot.plot_name}">Overwrite</button>
              <button type="button" class="delete-plot-btn" data-plot-id="${plot.plot_id}" title="Delete plot"><i class="fa-solid fa-delete-left"></i></button>
            </div>
          </li>`;
        });
        html += '</ul>';
        plotsList.innerHTML = html;

        // Add click handlers for overwrite buttons
        document.querySelectorAll('.overwrite-btn').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const plotId = btn.getAttribute('data-plot-id');
            const plotName = btn.getAttribute('data-plot-name');

            // Check if there's a new name entered
            const newNameInput = document.getElementById('plot_name');
            const newName = newNameInput && newNameInput.value.trim() ? newNameInput.value.trim() : null;

            setupConfirmButton(
              btn,
              () => {
                savePlot(false, plotId, newName, plotName, plotState); // Pass the existing plot name
              },
              {
                confirmText: 'Confirm',
                originalText: 'Overwrite',
              }
            );
          });
        });

        // Add delete button handlers
        document.querySelectorAll('.existing-plots-list .delete-plot-btn').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            // Get plot ID
            const plotId = btn.getAttribute('data-plot-id');

            setupConfirmButton(
              btn,
              () => {
                deletePlot(plotId, true, plotState);
              },
              {
                confirmText: 'Delete',
                confirmTitle: 'This is permanent!',
                originalTitle: 'Delete plot',
                stopPropagation: true,
                event: e,
              }
            );
          });
        });
      } else {
        plotsList.innerHTML = '<p class="no-plots-message">You have no saved plots.</p>';
      }
    })
    .catch((error) => {
      if (loadingOverlay.parentNode === plotsList) {
        plotsList.removeChild(loadingOverlay);
      }

      console.error('Error loading plots:', error);
      plotsList.innerHTML = '<p class="error-message">Error loading plots. Please try again.</p>';
    });
}

/**
 * Load saved plots for the load modal
 * @param {Object} plotState - The current plot state
 */
function loadSavedPlots(plotState) {
  const plotsList = document.querySelector('.saved-plots-list');
  if (!plotsList) return;

  // Add overlay instead of replacing content
  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.innerHTML = '<p class="loading-message">Loading your saved plots...</p>';
  loadingOverlay.style.position = 'absolute';
  loadingOverlay.style.top = '0';
  loadingOverlay.style.left = '0';
  loadingOverlay.style.width = '100%';
  loadingOverlay.style.height = '100%';
  loadingOverlay.style.background = 'rgba(255,255,255,0.8)';
  loadingOverlay.style.display = 'flex';
  loadingOverlay.style.alignItems = 'center';
  loadingOverlay.style.justifyContent = 'center';

  // Make sure the container is positioned relative
  plotsList.style.position = 'relative';

  // Add the overlay instead of replacing content
  plotsList.appendChild(loadingOverlay);

  // Show loading message
  plotsList.innerHTML = '<p class="loading-message">Loading your saved plots...</p>';

  // Fetch saved plots
  fetch('/handlers/get_plots.php')
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then((data) => {
      // Remove the loading overlay first
      if (loadingOverlay.parentNode === plotsList) {
        plotsList.removeChild(loadingOverlay);
      }

      if (data.plots && data.plots.length > 0) {
        // Create plots list
        let html = '<ul class="plots-list">';
        data.plots.forEach((plot) => {
          const formattedDate = plot.event_date_start ? new Date(plot.event_date_start).toLocaleDateString() : 'No date';
          html += `<li class="plot-item">
            <div class="plot-info">
              <div class="plot-name">${plot.plot_name}</div>
              <div class="plot-details">
                <span class="venue">${plot.venue_name}</span>
                <span class="date">${formattedDate}</span>
              </div>
            </div>
            <div class="plot-actions">
              <button class="load-plot-btn" data-plot-id="${plot.plot_id}" title="Load plot">Load</button>
              <button class="delete-plot-btn" data-plot-id="${plot.plot_id}" title="Delete plot"><i class="fa-solid fa-delete-left"></i></button>
            </div>
          </li>`;
        });
        html += '</ul>';
        plotsList.innerHTML = html;

        // Add load button handlers
        document.querySelectorAll('.load-plot-btn').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const plotId = btn.getAttribute('data-plot-id');

            // Check if there are elements on stage that would be replaced
            if (plotState.elements.length > 0) {
              setupConfirmButton(
                btn,
                () => {
                  loadPlot(plotId, plotState);
                },
                {
                  confirmText: 'Confirm',
                  confirmTitle: 'This will replace your current stage',
                  originalText: 'Load',
                  originalTitle: 'Load plot',
                  stopPropagation: true,
                  event: e,
                }
              );
            } else {
              // No confirmation needed, just load
              loadPlot(plotId, plotState);
            }
          });
        });

        // Add delete button handlers
        document.querySelectorAll('.saved-plots-list .delete-plot-btn').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            // Get plot ID
            const plotId = btn.getAttribute('data-plot-id');

            setupConfirmButton(
              btn,
              () => {
                deletePlot(plotId, true, plotState);
              },
              {
                confirmText: 'Delete',
                confirmTitle: 'This is permanent!',
                originalTitle: 'Delete plot',
                stopPropagation: true,
                event: e,
              }
            );
          });
        });
      } else {
        plotsList.innerHTML = '<p class="no-plots-message">You have no saved plots.</p>';
      }
    })
    .catch((error) => {
      if (loadingOverlay.parentNode === plotsList) {
        plotsList.removeChild(loadingOverlay);
      }

      console.error('Error loading plots:', error);
      plotsList.innerHTML = '<p class="error-message">Error loading plots. Please try again.</p>';
    });
}

/**
 * Load a specific plot
 * @param {number} plotId - The ID of the plot to load
 * @param {Object} plotState - The current plot state
 */
function loadPlot(plotId, plotState) {
  fetch(`/handlers/get_plot.php?id=${plotId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        plotState.isLoading = true;

        // Clear current stage FIRST
        clearElements(plotState);
        if (plotState.clearInputList) plotState.clearInputList(); // Clear input list state & DOM

        // ... (update plot title, venue, dates, buttons, favorites) ...
        const plotTitle = document.getElementById('plot-title');
        if (plotTitle) plotTitle.textContent = data.plot.plot_name;
        plotState.currentPlotName = data.plot.plot_name;
        plotState.currentPlotId = data.plot.plot_id;

        const venueSelect = document.getElementById('venue_select');
        if (venueSelect && data.plot.effective_venue_id) {
          venueSelect.value = data.plot.effective_venue_id;
          updateCustomDropdown(venueSelect);
          updateStageForVenue(data.plot.effective_venue_id, plotState, true);
        } else {
          updateStageForVenue(null, plotState, true);
        }

        const eventStartInput = document.getElementById('event_start');
        const eventEndInput = document.getElementById('event_end');
        if (eventStartInput) eventStartInput.value = data.plot.event_date_start || '';
        if (eventEndInput) {
          eventEndInput.value = data.plot.event_date_end || '';
          if (eventStartInput.value) eventEndInput.min = eventStartInput.value;
        }

        updatePlotUIState(plotState);
        updateFavoritesFromServer(plotState, data.favorites);

        plotState.inputs = data.inputs || [];
        if (plotState.renderInputList) {
          plotState.renderInputList(plotState.inputs);
        }

        // Load placed elements
        const elementPromises = (data.elements || []).map((element, index) => {
          const elementData = {
            id: index + 1, // Assign new local ID
            elementId: element.element_id,
            elementName: element.element_name,
            categoryId: element.category_id,
            image: element.element_image,
            x: element.x_position,
            y: element.y_position,
            width: element.width,
            height: element.height,
            flipped: element.flipped === 1 || element.flipped === '1' || element.flipped === true,
            zIndex: element.z_index,
            label: element.label || '',
            notes: element.notes || '',
          };
          plotState.elements.push(elementData);
          return createPlacedElement(elementData, plotState);
        });

        Promise.all(elementPromises)
          .then(() => {
            plotState.nextZIndex = Math.max(1, ...plotState.elements.map((el) => el.zIndex)) + 1; // Recalculate nextZIndex
            plotState.isLoading = false;
            console.log('Finished loading elements.');
            const loadModal = document.getElementById('my-plots-modal');
            closeModal(loadModal);
            showNotification('Plot loaded!', 'success');
            renderElementInfoList(plotState);
            saveStateToStorage(plotState);
          })
          .catch((error) => {
            console.error('Error during element loading:', error);
            plotState.isLoading = false;
            showNotification('Plot loaded, but some elements might have issues.', 'warning');
          });
      } else {
        showNotification('Error loading plot: ' + (data.error || 'Unknown error'), 'error');
        plotState.isLoading = false;
      }
    })
    .catch((error) => {
      console.error('Error loading plot:', error);
      showNotification('Error loading plot. Please try again.', 'error');
      plotState.isLoading = false;
    });
}

/**
 * Update the custom dropdown UI to match the selected value in the native select
 * @param {HTMLSelectElement} selectElement - The native select element
 */
function updateCustomDropdown(selectElement) {
  if (!selectElement) return;

  // Find the associated custom dropdown container
  const customDropdown = document.querySelector(`.custom-dropdown [data-id="${selectElement.id}"]`) || document.querySelector(`.custom-dropdown select[id="${selectElement.id}"]`).closest('.custom-dropdown');

  if (!customDropdown) return;

  // Get the selected option text
  const selectedOption = selectElement.options[selectElement.selectedIndex];
  const selectedText = selectedOption ? selectedOption.textContent : '';

  // Update the visual display of the selection
  const selectedDisplay = customDropdown.querySelector('.selected-option');
  if (selectedDisplay) {
    selectedDisplay.textContent = selectedText;

    if (selectedText) {
      selectedDisplay.classList.remove('placeholder');
    } else {
      selectedDisplay.classList.add('placeholder');
    }
  }

  // Update the selected class in the dropdown options
  const options = customDropdown.querySelectorAll('.custom-dropdown-option');
  options.forEach((option) => {
    option.classList.remove('selected');
    if (option.getAttribute('data-value') === selectElement.value) {
      option.classList.add('selected');
    }
  });
}

/**
 * Update button states and UI for loaded plot
 * @param {Object} plotState - The current plot state
 */
function updatePlotUIState(plotState) {
  const saveButton = document.getElementById('save-plot');
  if (saveButton) {
    saveButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';
  }

  // Hide the save changes button initially
  const saveChangesButton = document.getElementById('save-changes');
  if (saveChangesButton) {
    saveChangesButton.classList.add('hidden');
  }

  // Reset modified flag
  plotState.isModified = false;
}

/**
 * Update favorites data from server
 * @param {Object} plotState - The current plot state
 * @param {Array} favorites - Favorites data from server
 */
function updateFavoritesFromServer(plotState, favorites) {
  if (!favorites) return;

  // Update favorites in state
  plotState.favorites = favorites.map((fav) => parseInt(fav.element_id));
  plotState.favoritesData = favorites;

  // Update favorites UI
  updateFavoritesCategory(plotState);

  // Update the favorite buttons on all elements
  const allButtons = document.querySelectorAll('.draggable-element .favorite-button');
  allButtons.forEach((button) => {
    const elementContainer = button.closest('.draggable-element');
    if (!elementContainer) return;

    const elementId = parseInt(elementContainer.getAttribute('data-element-id'));
    const isFavorite = plotState.favorites.includes(elementId);

    button.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
    button.innerHTML = isFavorite ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
  });
}

/**
 * Load placed elements from server data
 * @param {Array} elements - The elements data from the server
 * @param {Object} plotState - The current plot state
 */
function loadPlacedElements(elements, plotState) {
  const stage = document.getElementById('stage');
  if (!stage) return;

  // Get stage dimensions
  const stageWidth = parseInt(stage.getAttribute('data-stage-width')) || 20;
  const stageDepth = parseInt(stage.getAttribute('data-stage-depth')) || 15;

  // Calculate dimensions for proper scaling
  const dimensions = calculateStageDimensions(stageWidth, stageDepth);

  // Clear existing elements first
  const placedElements = stage.querySelectorAll('.placed-element');
  placedElements.forEach((element) => element.remove());

  // Reset state but keep z-index counter
  const nextZ = plotState.nextZIndex;
  plotState.elements = [];
  plotState.nextZIndex = nextZ;

  // Create each element from the saved data
  elements.forEach((element, index) => {
    // Map database field names to local state format
    const elementData = {
      id: index + 1, // Generate new sequential IDs
      elementId: element.element_id,
      elementName: element.element_name,
      categoryId: element.category_id,
      image: element.element_image,
      x: element.x_position,
      y: element.y_position,
      width: element.width,
      height: element.height,
      rotation: element.rotation,
      flipped: element.flipped === 1 || element.flipped === '1' || element.flipped === true,
      zIndex: element.z_index,
      label: element.label || '',
      notes: element.notes || '',
    };

    // Add to state
    plotState.elements.push(elementData);

    // Create DOM element
    createPlacedElement(elementData, plotState);

    // Update next z-index if needed
    plotState.nextZIndex = Math.max(plotState.nextZIndex, element.z_index + 1);
  });
}

/**
 * Initialize load plot modal
 * @param {Object} plotState - The current plot state
 */
function initLoadPlotModal(plotState) {
  const loadButton = document.getElementById('my-plots');
  const loadModal = document.getElementById('my-plots-modal');

  if (loadButton && loadModal) {
    loadButton.addEventListener('click', () => {
      // First show the modal
      openModal(loadModal);

      // Then populate it with plots
      loadSavedPlots(plotState);
    });
  }
}

/**
 * Delete a saved plot
 * @param {number} plotId - The ID of the plot to delete
 * @param {boolean} confirmed - Whether the action has been confirmed
 * @param {Object} plotState - The current plot state
 */
function deletePlot(plotId, confirmed = false, plotState) {
  // Skip confirmation if already confirmed
  if (!confirmed) {
    // The confirmation is now handled by the button itself
    return;
  }

  // Create form data
  const formData = new FormData();
  formData.append('plot_id', plotId);

  // Send deletion request to server
  fetch('/handlers/delete_plot.php', {
    method: 'POST',
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        // Show notification
        showNotification('Plot deleted!', 'success');

        // If we're currently viewing the plot that was deleted, clear the stage
        if (plotState.currentPlotId && plotState.currentPlotId == plotId) {
          clearElements(plotState);
        }

        // Reload the plots list
        loadSavedPlots(plotState);

        // Also reload the overwrite list if the save modal is open
        const saveModal = document.getElementById('save-plot-modal');
        if (saveModal && !saveModal.classList.contains('hidden')) {
          loadExistingPlotsForOverwrite(plotState);
        }
      } else {
        showNotification('Error deleting plot: ' + (data.error || 'Unknown error'), 'error');
      }
    })
    .catch((error) => {
      console.error('Error deleting plot:', error);
      showNotification('Error deleting plot. Please try again.', 'error');
    });
}

/**
 * Initialize page navigation handlers
 * @param {Object} plotState - The current plot state
 */
function initPageNavigation(plotState) {
  // Save state when navigating away from the page
  window.addEventListener('beforeunload', function (e) {
    // Only prompt if there are unsaved changes
    if (plotState.elements.length > 0 && (plotState.isModified || !plotState.currentPlotId)) {
      // Save current state to localStorage
      saveStateToStorage(plotState);
    }
  });

  // Add click handlers to all navigation links to save state
  document.querySelectorAll('nav a').forEach((link) => {
    link.addEventListener('click', function (e) {
      // Don't intercept the current page link
      if (this.classList.contains('active')) {
        return;
      }

      // Save state before navigating
      saveStateToStorage(plotState);
    });
  });
}

/**
 * Save current state to localStorage
 * @param {Object} plotState - The current plot state
 */
function saveStateToStorage(plotState) {
  const stage = document.getElementById('stage');
  if (!stage) return;

  try {
    // Create a serializable state object
    const stateToSave = {
      elements: plotState.elements,
      inputs: plotState.inputs || [], // <<< ADD THIS LINE: Include inputs array
      nextZIndex: plotState.nextZIndex,
      currentPlotName: plotState.currentPlotName,
      currentPlotId: plotState.currentPlotId,
      isModified: plotState.isModified,
      venueId: document.getElementById('venue_select') ? document.getElementById('venue_select').value : null,
      eventStart: document.getElementById('event_start') ? document.getElementById('event_start').value : null,
      eventEnd: document.getElementById('event_end') ? document.getElementById('event_end').value : null,
    };

    // Save to localStorage
    localStorage.setItem('stageplot_state', JSON.stringify(stateToSave));
    // console.log("State saved to localStorage:", stateToSave); // Optional: for debugging
  } catch (e) {
    console.error('Error saving state to localStorage:', e);
  }
}

/**
 * Restore state from localStorage if available
 * @param {Object} plotState - The current plot state
 * @returns {boolean} Whether state was restored successfully
 */
function restoreStateFromStorage(plotState) {
  const stage = document.getElementById('stage');
  if (!stage) return false;

  try {
    const savedState = localStorage.getItem('stageplot_state');
    if (!savedState) return false;

    const state = JSON.parse(savedState);

    // Only restore if there was saved data (elements or inputs)
    if ((state.elements && state.elements.length > 0) || (state.inputs && state.inputs.length > 0)) {
      // <<< UPDATED CONDITION

      // ... (rest of the state restoration logic: plot title, state values) ...
      const plotTitle = document.getElementById('plot-title');
      if (plotTitle && state.currentPlotName) {
        plotTitle.textContent = state.currentPlotName;
      } else if (plotTitle) {
        // Use a default title if restoring state without a name (e.g., unsaved work)
        plotTitle.textContent = state.currentPlotId ? 'Restored Plot' : 'Unsaved Work';
      }

      plotState.elements = []; // Clear first
      plotState.nextZIndex = state.nextZIndex || 1;
      plotState.currentPlotName = state.currentPlotName;
      plotState.currentPlotId = state.currentPlotId;
      plotState.isModified = state.isModified;

      // Restore Inputs
      plotState.inputs = state.inputs || []; // Restore inputs or default to empty array
      if (plotState.renderInputList) {
        plotState.renderInputList(plotState.inputs); // Render the restored input list
      }

      // Restore form inputs (venue, dates)
      const venueSelect = document.getElementById('venue_select');
      const eventStartInput = document.getElementById('event_start');
      const eventEndInput = document.getElementById('event_end');

      if (venueSelect) {
        let restoredVenueId = '';
        if (state.venueId) {
          venueSelect.value = state.venueId;
          restoredVenueId = state.venueId;
        } else {
          venueSelect.value = '';
        }
        updateCustomDropdown(venueSelect);
        updateStageForVenue(restoredVenueId, plotState, true);
      } else {
        updateStageForVenue(null, plotState, true);
      }

      if (eventStartInput && state.eventStart) {
        eventStartInput.value = state.eventStart;
      }
      if (eventEndInput && state.eventEnd) {
        eventEndInput.value = state.eventEnd;
        if (eventStartInput && eventStartInput.value) {
          eventEndInput.min = eventStartInput.value;
        }
      }

      // Restore button states
      const saveButton = document.getElementById('save-plot');
      if (saveButton && state.currentPlotId) {
        saveButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>'; // Keep floppy disk icon? Maybe change text?
      }
      const saveChangesButton = document.getElementById('save-changes');
      if (saveChangesButton && state.isModified) {
        saveChangesButton.classList.remove('hidden');
        saveChangesButton.classList.add('visible');
      }

      // Restore placed elements
      plotState.isLoading = true;
      const elementPromises = (state.elements || []).map((elementData) => {
        // Handle case where elements might be null/undefined
        if (elementData.id === undefined) {
          elementData.id = plotState.elements.length + 1;
        }
        plotState.elements.push(elementData);
        return createPlacedElement(elementData, plotState);
      });

      Promise.all(elementPromises)
        .then(() => {
          plotState.isLoading = false;
          console.log('Finished restoring elements and inputs.');
        })
        .catch((error) => {
          console.error('Error restoring elements:', error);
          plotState.isLoading = false;
        });

      console.log('Stage plot state restored from localStorage');
      return true; // Indicate state was restored
    }
    return false; // No elements or inputs to restore
  } catch (e) {
    console.error('Error restoring state from localStorage:', e);
    localStorage.removeItem('stageplot_state'); // Clear potentially corrupt state
    return false;
  }
}

/**
 * Setup change tracking after state is restored or for a new plot
 * @param {Object} plotState - The current plot state
 */
function setupChangeTracking(plotState) {
  const stage = document.getElementById('stage');
  if (!stage) return;

  const observer = new MutationObserver((mutations) => {
    if (plotState.isLoading) return; // Ignore mutations during loading

    const relevantMutations = mutations.some((mutation) => (mutation.type === 'childList' && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) && (Array.from(mutation.addedNodes).some((node) => node.classList?.contains('placed-element')) || Array.from(mutation.removedNodes).some((node) => node.classList?.contains('placed-element')))) || (mutation.type === 'attributes' && mutation.target.classList?.contains('placed-element') && mutation.attributeName === 'style'));

    if (relevantMutations) {
      markPlotAsModified(plotState);
    }
  });

  observer.observe(stage, {
    childList: true,
    attributes: true,
    attributeFilter: ['style'],
    subtree: true,
  });

  const venueSelect = document.getElementById('venue_select');
  const eventStartInput = document.getElementById('event_start');
  const eventEndInput = document.getElementById('event_end');

  // Add listener for event start date change
  if (eventStartInput) {
    eventStartInput.addEventListener('change', () => {
      // Use the correctly scoped variables
      if (plotState && plotState.currentPlotId && !plotState.isLoading) {
        markPlotAsModified(plotState);
      }
      // Ensure eventEndInput exists before modifying it
      if (eventEndInput) {
        eventEndInput.min = eventStartInput.value;
        if (eventEndInput.value && eventEndInput.value < eventStartInput.value) {
          eventEndInput.value = eventStartInput.value;
          eventEndInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      } else {
        console.warn("End date input ('event_end') not found when start date changed.");
      }
    });
  } else {
    console.warn("Start date input ('event_start') not found.");
  }

  // Add listener for event end date change
  if (eventEndInput) {
    eventEndInput.addEventListener('change', () => {
      if (plotState && plotState.currentPlotId && !plotState.isLoading) {
        markPlotAsModified(plotState);
      }
      // Ensure eventStartInput exists before comparing
      if (eventStartInput) {
        if (eventStartInput.value && eventEndInput.value < eventStartInput.value) {
          showNotification('End date cannot be before start date.', 'warning');
          eventEndInput.value = eventStartInput.value; // Reset to start date
        }
      } else {
        console.warn("Start date input ('event_start') not found when end date changed.");
      }
    });
  } else {
    console.warn("End date input ('event_end') not found.");
  }
}

/**
 * Initialize plot controls and buttons
 * @param {Object} plotState - The current plot state
 */
function initPlotControls(plotState) {
  const clearButton = document.getElementById('clear-plot');
  const newPlotButton = document.getElementById('new-plot');

  // Setup clear button
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      setupConfirmButton(
        clearButton,
        () => {
          clearElements(plotState);
          showNotification('Stage cleared!', 'success');
        },
        {
          confirmText: 'Clear Stage',
          confirmTitle: 'Clear all placed elements',
          originalTitle: 'Clear Stage',
          originalText: '<i class="fa-solid fa-trash"></i>',
        }
      );
    });
  }

  // Setup new plot button
  if (newPlotButton) {
    newPlotButton.addEventListener('click', () => {
      setupConfirmButton(
        newPlotButton,
        () => {
          newPlot(plotState);
        },
        {
          confirmText: 'New Plot',
          confirmTitle: 'You will lose unsaved changes',
          originalTitle: 'New Plot',
          originalText: '<i class="fa-solid fa-file-circle-plus"></i>',
        }
      );
    });
  }
}

/**
 * Setup initial state for a new plot
 * @param {Object} plotState - The current plot state
 */
function setupInitialState(plotState) {
  const stage = document.getElementById('stage');
  const eventStartInput = document.getElementById('event_start');
  const eventEndInput = document.getElementById('event_end');

  // Set up initial stage dimensions based on default venue
  if (stage) {
    const stageWidth = parseInt(stage.getAttribute('data-stage-width')) || 20;
    const stageDepth = parseInt(stage.getAttribute('data-stage-depth')) || 15;

    // Calculate and apply dimensions
    const dimensions = calculateStageDimensions(stageWidth, stageDepth);
    updateStageDimensions(dimensions, stage);

    // Initialize venue info panel with no venue selected
    updateStageForVenue(null, plotState, true);
  }

  // Set current date for event dates when the page loads
  if (eventStartInput && eventEndInput) {
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0]; // Format for date input (YYYY-MM-DD)
    eventStartInput.value = formattedDate;
    eventEndInput.value = formattedDate;
  }

  // Initialize plot title
  const plotTitle = document.getElementById('plot-title');
  if (plotTitle) {
    plotTitle.textContent = 'New Plot';
  }
}

/**
 * Setup venue select change handler
 * @param {Object} plotState - The current plot state
 */
function setupVenueSelectHandler(plotState) {
  const venueSelect = document.getElementById('venue_select');
  if (!venueSelect) return;

  venueSelect.addEventListener('change', () => {
    updateStageForVenue(venueSelect.value, plotState, false);
  });
}

/**
 *
 * @param {*} venueValue
 * @param {*} plotState
 * @param {*} isRestoring
 * @returns
 */
function updateStageForVenue(venueValue, plotState, isRestoring = false) {
  const stage = document.getElementById('stage');
  const venueInfoPanel = document.getElementById('venue-info-panel');
  const venueNameEl = document.getElementById('venue-info-name');
  const venueAddressEl = document.getElementById('venue-info-address');
  const venueStageEl = document.getElementById('venue-info-stage');
  const noVenueMsg = venueInfoPanel.querySelector('.no-venue-selected');
  const detailsDiv = venueInfoPanel.querySelector('.venue-details');

  if (!stage || !venueInfoPanel || !venueNameEl || !venueAddressEl || !venueStageEl || !noVenueMsg || !detailsDiv) {
    console.error('Required elements for venue info display not found.');
    return;
  }

  // Function to reset and show "No venue selected" message
  const showNoVenueInfo = () => {
    const dimensions = calculateStageDimensions(20, 15); // Default size
    updateStageDimensions(dimensions, stage);
    detailsDiv.style.display = 'none'; // Hide details
    noVenueMsg.style.display = 'block'; // Show 'no venue' message
    venueNameEl.textContent = 'N/A';
    venueAddressEl.textContent = 'N/A';
    venueStageEl.textContent = 'N/A';
    // Only mark modified if NOT restoring and a plot is loaded
    if (!isRestoring && plotState.currentPlotId && !plotState.isLoading) {
      markPlotAsModified(plotState);
    }
  };

  // If no venue is selected, set defaults and show "No venue selected"
  if (!venueValue) {
    showNoVenueInfo();
    return;
  }

  let venueId,
    isUserVenue = false;
  if (venueValue.startsWith('user_')) {
    isUserVenue = true;
    venueId = venueValue.replace('user_', '');
  } else {
    venueId = venueValue;
  }

  const endpoint = isUserVenue ? `/handlers/get_user_venue.php?id=${venueId}` : `/handlers/get_venue.php?id=${venueId}`;

  fetch(endpoint)
    .then((response) => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then((data) => {
      if (data.success && data.venue) {
        const venue = data.venue;
        const dimensions = calculateStageDimensions(parseInt(venue.stage_width) || 20, parseInt(venue.stage_depth) || 15);
        updateStageDimensions(dimensions, stage);
        stage.setAttribute('data-venue-id', venueId);
        stage.setAttribute('data-is-user-venue', isUserVenue ? '1' : '0');

        // Populate Venue Info Panel
        venueNameEl.textContent = venue.venue_name || 'N/A';

        let addressParts = [];
        if (venue.venue_street) addressParts.push(venue.venue_street);
        if (venue.venue_city) addressParts.push(venue.venue_city);
        if (venue.state_abbr) addressParts.push(venue.state_abbr);
        if (venue.venue_zip) addressParts.push(venue.venue_zip);
        venueAddressEl.textContent = addressParts.length > 0 ? addressParts.join(', ') : 'N/A';

        let stageParts = [];
        if (venue.stage_width) stageParts.push(`Width: ${venue.stage_width}'`);
        if (venue.stage_depth) stageParts.push(`Depth: ${venue.stage_depth}'`);
        venueStageEl.textContent = stageParts.length > 0 ? stageParts.join(' / ') : 'N/A';

        // Show the details and hide the 'no venue' message
        detailsDiv.style.display = 'block';
        noVenueMsg.style.display = 'none';

        // Only mark modified if NOT restoring and a plot is loaded
        if (!isRestoring && plotState.currentPlotId && !plotState.isLoading) {
          markPlotAsModified(plotState);
        }
      } else {
        console.error('Failed to get venue data:', data.error);
        showNoVenueInfo(); // Fallback to default view
      }
    })
    .catch((error) => {
      console.error('Error fetching venue:', error);
      showNoVenueInfo(); // Fallback to default view
    });
}

/**
 * Setup event date input handlers
 * @param {Object} plotState - The current plot state
 */
function setupDateHandlers(plotState) {
  const eventStartInput = document.getElementById('event_start');
  const eventEndInput = document.getElementById('event_end');

  // Add event listeners for date/time changes
  if (eventStartInput) {
    eventStartInput.addEventListener('change', () => {
      if (plotState.currentPlotId) {
        markPlotAsModified(plotState);
      }
    });
  }

  if (eventEndInput) {
    eventEndInput.addEventListener('change', () => {
      if (plotState.currentPlotId) {
        markPlotAsModified(plotState);
      }
    });
  }
}

/**
 * Initialize the category filter dropdown event listener
 */
function initCategoryFilter() {
  const categoryFilter = document.getElementById('category-filter');
  if (!categoryFilter) return;

  // PHP handles the initial rendering order of options in the <select>

  categoryFilter.addEventListener('change', () => {
    const categoryId = categoryFilter.value;
    const elementsPanel = document.getElementById('elements-list');
    if (!elementsPanel) return;

    // Filter category sections visibility
    document.querySelectorAll('.category-section').forEach((section) => {
      const sectionVisible = categoryId === '0' || section.getAttribute('data-category-id') === categoryId;
      section.style.display = sectionVisible ? '' : 'none';
    });

    // --- No separator logic needed here anymore ---
  });

  // Ensure correct order of sections initially after page load
  moveFavoritesToTop();
}

/**
 * Mark the plot as modified
 * @param {Object} plotState - The current plot state
 */
function markPlotAsModified(plotState) {
  if (plotState.isLoading) return; // <<< ADDED: Exit if loading

  const saveChangesButton = document.getElementById('save-changes');

  if (!plotState.isModified && plotState.currentPlotId !== null) {
    plotState.isModified = true;
    console.log('Marking plot as modified.'); // Debug log

    // Show the save changes button with animation
    if (saveChangesButton) {
      saveChangesButton.classList.remove('hidden');
      // Use a small timeout to ensure the transition works
      setTimeout(() => {
        saveChangesButton.classList.add('visible');
      }, 10);
    }
  }
}

/**
 * Clear only elements from the stage
 * @param {Object} plotState - The current plot state
 */
function clearElements(plotState) {
  const stage = document.getElementById('stage');
  if (!stage) return;

  // Clear DOM elements
  const placedElements = stage.querySelectorAll('.placed-element');
  placedElements.forEach((element) => element.remove());

  // Reset elements state
  plotState.elements = [];
  plotState.nextZIndex = 1;
  plotState.selectedElement = null;

  if (plotState.clearInputList) {
    plotState.clearInputList();
  }

  renderElementInfoList(plotState);

  if (plotState.currentPlotId) {
    markPlotAsModified(plotState);
  }
}

/**
 * Create a completely new plot (reset everything)
 * @param {Object} plotState - The current plot state
 */
function newPlot(plotState) {
  const saveButton = document.getElementById('save-plot');
  const saveChangesButton = document.getElementById('save-changes');
  const venueSelect = document.getElementById('venue_select');
  const eventStartInput = document.getElementById('event_start');
  const eventEndInput = document.getElementById('event_end');
  const plotTitle = document.getElementById('plot-title');

  // Clear all elements
  clearElements(plotState);

  renderElementInfoList(plotState);

  // Reset plot info
  plotState.currentPlotName = null;
  plotState.currentPlotId = null;
  plotState.isModified = false;

  // Reset plot title
  if (plotTitle) plotTitle.textContent = 'New Plot';

  // Reset buttons
  if (saveButton) saveButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';
  if (saveChangesButton) {
    saveChangesButton.classList.remove('visible');
    setTimeout(() => saveChangesButton.classList.add('hidden'), 300);
  }

  // Clear localStorage
  try {
    localStorage.removeItem('stageplot_state');
  } catch (e) {
    console.error('Error clearing state from localStorage:', e);
  }

  // Set default dates
  if (eventStartInput && eventEndInput) {
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0];
    eventStartInput.value = formattedDate;
    eventEndInput.value = formattedDate;
    eventEndInput.min = formattedDate; // Ensure min date is set
  }

  // Reset venue
  if (venueSelect) {
    venueSelect.value = ''; // Reset to "No Venue"
    updateCustomDropdown(venueSelect); // Update custom dropdown UI
    updateStageForVenue(null, plotState, false); // Update stage to default dimensions
  }

  showNotification('New plot created!', 'success');
}

/**
 * Initialize the grid system for the stage
 * Creates toggle buttons and sets up grid overlay
 * Reads and applies saved grid state from localStorage
 * Saves grid state changes to localStorage
 */
function initStageGrid() {
  const stage = document.getElementById('stage');
  if (!stage) return;

  // Load saved grid state
  const savedGridVisible = localStorage.getItem('gridVisible') === 'true';
  const savedDetailedGrid = localStorage.getItem('detailedGrid') !== 'false'; // Default to true if not saved

  // Check if grid toggle already exists
  if (stage.querySelector('#grid-toggle')) return;

  // Create grid toggle button
  const gridToggle = document.createElement('button');
  gridToggle.id = 'grid-toggle';
  gridToggle.className = 'grid-button';
  gridToggle.innerHTML = '<i class="fa-solid fa-border-all"></i>';
  gridToggle.title = "Toggle Grid (5' squares)";

  // Create grid type toggle button
  const gridTypeToggle = document.createElement('button');
  gridTypeToggle.id = 'grid-type-toggle';
  gridTypeToggle.className = 'grid-button';
  gridTypeToggle.innerHTML = '<i class="fa-solid fa-ruler"></i>';
  gridTypeToggle.title = 'Toggle Detail Level';

  // Create grid overlay if it doesn't exist
  let gridOverlay = stage.querySelector('.grid-overlay');
  if (!gridOverlay) {
    gridOverlay = document.createElement('div');
    gridOverlay.className = 'grid-overlay';
    stage.appendChild(gridOverlay);
  }

  // Get initial dimensions from stage
  const stageWidth = parseInt(stage.getAttribute('data-stage-width')) || 20;
  const stageDepth = parseInt(stage.getAttribute('data-stage-depth')) || 15;

  // Calculate initial grid size
  const dimensions = calculateStageDimensions(stageWidth, stageDepth);

  // Add buttons to the stage
  stage.appendChild(gridToggle);
  stage.appendChild(gridTypeToggle);

  // Add toggle functionality with varying opacity levels
  let gridVisible = savedGridVisible; // Initialize with saved state
  let detailedGrid = savedDetailedGrid; // Initialize with saved state

  // Function to update grid display based on state variables
  function updateGridDisplay() {
    gridOverlay.style.opacity = gridVisible ? '1' : '0';
    if (gridVisible) {
      gridToggle.classList.add('active');
    } else {
      gridToggle.classList.remove('active');
    }

    // Get current dimensions (might have changed if venue changed)
    const currentStageWidth = parseInt(stage.getAttribute('data-stage-width')) || 20;
    const currentStageDepth = parseInt(stage.getAttribute('data-stage-depth')) || 15;
    const currentDimensions = calculateStageDimensions(currentStageWidth, currentStageDepth);

    updateGridOverlay(currentDimensions, stage); // Make sure overlay size is correct

    if (detailedGrid) {
      const footSize = currentDimensions.gridSize / 5;
      gridOverlay.style.backgroundImage = `
              linear-gradient(to right, rgba(82, 108, 129, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(82, 108, 129, 0.15) 1px, transparent 1px),
              linear-gradient(to right, rgba(82, 108, 129, 0.05) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(82, 108, 129, 0.05) 1px, transparent 1px)
          `;
      gridOverlay.style.backgroundSize = `
              ${currentDimensions.gridSize}px ${currentDimensions.gridSize}px,
              ${currentDimensions.gridSize}px ${currentDimensions.gridSize}px,
              ${footSize}px ${footSize}px,
              ${footSize}px ${footSize}px
          `;
      gridTypeToggle.classList.add('active'); // Show as active in detailed mode
    } else {
      gridOverlay.style.backgroundImage = `
              linear-gradient(to right, rgba(82, 108, 129, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(82, 108, 129, 0.15) 1px, transparent 1px)
          `;
      gridOverlay.style.backgroundSize = `
              ${currentDimensions.gridSize}px ${currentDimensions.gridSize}px,
              ${currentDimensions.gridSize}px ${currentDimensions.gridSize}px
          `;
      gridTypeToggle.classList.remove('active'); // Show as inactive in simple mode
    }

    // Update grid type toggle icon rotation
    const icon = gridTypeToggle.querySelector('i');
    if (icon) {
      icon.style.transition = 'transform 0.3s ease';
      icon.style.transform = detailedGrid ? 'rotate(0deg)' : 'rotate(90deg)'; // Rotate for simple view
    }
  }

  // Apply initial state loaded from localStorage
  updateGridDisplay();

  gridToggle.addEventListener('click', () => {
    gridVisible = !gridVisible;
    updateGridDisplay();
    // Save visibility state
    localStorage.setItem('gridVisible', gridVisible);
  });

  gridTypeToggle.addEventListener('click', () => {
    if (!gridVisible) {
      gridVisible = true; // Turn on grid if changing type while off
    }
    detailedGrid = !detailedGrid;
    updateGridDisplay();
    // Save detail state
    localStorage.setItem('detailedGrid', detailedGrid);
    localStorage.setItem('gridVisible', gridVisible); // Also save visibility in case it was turned on
  });

  // Listen for stage dimension changes to re-apply grid display correctly
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && (mutation.attributeName === 'data-stage-width' || mutation.attributeName === 'data-stage-depth')) {
        // Re-calculate and apply grid display when stage dimensions change
        updateGridDisplay();
      }
    });
  });
  observer.observe(stage, { attributes: true });
}

/**
 * Check URL parameters for plot loading instructions
 * @param {Object} plotState - The current plot state
 */
function checkUrlParameters(plotState) {
  // Parse URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const loadPlotId = urlParams.get('load');

  // If there's a load parameter, load the specified plot
  if (loadPlotId) {
    loadPlot(loadPlotId, plotState);

    // Remove the parameter from URL to prevent reloading the same plot on page refresh
    const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
    window.history.replaceState({ path: newUrl }, '', newUrl);
  }
}

/**
 * Initialize the input list functionality
 * @param {Object} plotState - The current plot state
 */
function initInputList(plotState) {
  const inputListContainer = document.getElementById('input-list');
  const addButton = document.getElementById('add-input-line');
  const inputSuggestions = document.getElementById('input-suggestions');

  if (!inputListContainer || !addButton) {
    console.warn('Input list elements not found, skipping initialization.');
    return;
  }

  // Create a function to update the datalist options based on placed elements
  function updateInputSuggestions() {
    if (!inputSuggestions) return;

    // Clear existing options
    inputSuggestions.innerHTML = '';

    // Create a Set to track unique suggestions and avoid duplicates
    const suggestions = new Set();

    // Add element names and labels from placed elements
    plotState.elements.forEach((element) => {
      // Add element name
      if (element.elementName) {
        suggestions.add(element.elementName);
      }

      // Add element label if it exists
      if (element.label && element.label.trim() !== '') {
        suggestions.add(element.label);
      }

      // Add combined name+label if both exist
      if (element.elementName && element.label && element.label.trim() !== '') {
        suggestions.add(`${element.elementName} - ${element.label}`);
      }
    });

    // Create option elements for each suggestion
    suggestions.forEach((suggestion) => {
      const option = document.createElement('option');
      option.value = suggestion;
      inputSuggestions.appendChild(option);
    });
  }

  // Function to add a new input line to the DOM
  function addInputLineDOM(number, label = '') {
    const inputItem = document.createElement('div');
    inputItem.className = 'input-item';
    inputItem.setAttribute('data-input-number', number);

    const numberSpan = document.createElement('span');
    numberSpan.className = 'input-number';
    numberSpan.textContent = `${number}.`;

    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.name = `input_label_${number}`;
    labelInput.id = `input_label_${number}`;
    labelInput.placeholder = `Input ${number} Label`;
    labelInput.value = label;
    labelInput.maxLength = 50; // Match database schema
    labelInput.setAttribute('list', 'input-suggestions'); // Connect to datalist

    // Add event listener to mark plot as modified when input changes
    labelInput.addEventListener('input', () => {
      // Find the corresponding input in plotState and update it
      const inputData = plotState.inputs.find((inp) => inp.number === number);
      if (inputData) {
        inputData.label = labelInput.value;
      } else {
        // If it doesn't exist, add it (e.g., for newly added lines)
        plotState.inputs.push({ number: number, label: labelInput.value });
      }
      markPlotAsModified(plotState); // Use existing function
    });

    inputItem.appendChild(numberSpan);
    inputItem.appendChild(labelInput);
    inputListContainer.appendChild(inputItem);
  }

  function renderInputList(inputs) {
    inputListContainer.innerHTML = ''; // Clear existing list
    const maxInputs = Math.max(6, inputs.length); // Ensure at least 6 are shown

    for (let i = 1; i <= maxInputs; i++) {
      const inputData = inputs.find((inp) => inp.number === i);
      addInputLineDOM(i, inputData ? inputData.label : '');
    }

    // Update suggestions after rendering the list
    updateInputSuggestions();
  }

  // Add button functionality
  addButton.addEventListener('click', () => {
    const currentCount = inputListContainer.children.length;
    const nextNumber = currentCount + 1;
    addInputLineDOM(nextNumber);
    // Automatically add to plotState when adding a line
    if (!plotState.inputs) plotState.inputs = [];
    plotState.inputs.push({ number: nextNumber, label: '' });
    markPlotAsModified(plotState);
  });

  // Initial render (assuming plotState.inputs is populated during loadPlot)
  if (!plotState.inputs) plotState.inputs = []; // Ensure inputs array exists
  renderInputList(plotState.inputs);

  // Expose render function if needed elsewhere (e.g., in loadPlot)
  plotState.renderInputList = renderInputList;

  // Expose function to clear list (e.g., in newPlot, clearElements)
  plotState.clearInputList = () => {
    plotState.inputs = []; // Clear state
    renderInputList([]); // Re-render empty list (with defaults)
  };

  // Store the update function in plotState so we can call it from other functions
  plotState.updateInputSuggestions = updateInputSuggestions;

  // Initial update of suggestions
  updateInputSuggestions();
}

/**
 * Renders the list of placed elements in the element-info section.
 * @param {Object} plotState - The current plot state.
 */
function renderElementInfoList(plotState) {
  const listContainer = document.getElementById('element-info-list');
  if (!listContainer) return;

  listContainer.innerHTML = ''; // Clear existing list

  if (plotState.elements.length === 0) {
    const noElementsMsg = document.createElement('li');
    noElementsMsg.className = 'no-elements-message';
    noElementsMsg.textContent = 'No elements placed yet.';
    listContainer.appendChild(noElementsMsg);
    return;
  }

  // Sort elements by z-index or ID for consistent order (optional, z-index might be better)
  const sortedElements = [...plotState.elements].sort((a, b) => a.zIndex - b.zIndex);

  sortedElements.forEach((elementData) => {
    const listItem = document.createElement('li');
    listItem.className = 'element-info-item';
    listItem.setAttribute('data-id', elementData.id);

    // Element Name Span
    const nameSpan = document.createElement('span');
    nameSpan.className = 'element-info-name';
    nameSpan.textContent = elementData.elementName;
    listItem.appendChild(nameSpan);

    // Append Label Span if label exists
    if (elementData.label) {
      const labelSpan = document.createElement('span');
      labelSpan.className = 'element-info-item-label';
      labelSpan.textContent = ` - ${elementData.label}`;
      nameSpan.appendChild(labelSpan);
    }

    // Notes (if exists)
    if (elementData.notes) {
      const notesSpan = document.createElement('span');
      notesSpan.className = 'element-info-notes';
      notesSpan.textContent = `${elementData.notes}`;
      listItem.appendChild(notesSpan);
    }

    listContainer.appendChild(listItem);
  });
}

/**
 * Initializes the element info list event listeners.
 * @param {Object} plotState - The current plot state.
 */
function initElementInfoListEvents(plotState) {
  const listContainer = document.getElementById('element-info-list');
  if (!listContainer) return;

  listContainer.addEventListener('click', (event) => {
    // Check if the click is directly on an item or its child span
    const listItem = event.target.closest('.element-info-item');
    if (listItem) {
      const elementId = parseInt(listItem.getAttribute('data-id'));
      if (!isNaN(elementId)) {
        openPropertiesModal(elementId, plotState);
      }
    }
  });
}

// --------------------- Make stage plot editor functions available globally ----------------------
window.initStageEditor = initStageEditor;
window.handleDragStart = handleDragStart;
window.handleDragOver = handleDragOver;
window.handleDrop = handleDrop;
window.createPlacedElement = createPlacedElement;
window.makeDraggableOnStage = makeDraggableOnStage;
window.bringToFront = bringToFront;
window.openPropertiesModal = openPropertiesModal;
window.applyElementProperties = applyElementProperties;
window.deleteElement = deleteElement;
window.markPlotAsModified = markPlotAsModified;
window.clearElements = clearElements;
window.newPlot = newPlot;
window.initModalControls = initModalControls;
window.savePlot = savePlot;
window.loadExistingPlotsForOverwrite = loadExistingPlotsForOverwrite;
window.loadSavedPlots = loadSavedPlots;
window.loadPlot = loadPlot;
window.updateCustomDropdown = updateCustomDropdown;
window.loadPlacedElements = loadPlacedElements;
window.initLoadPlotModal = initLoadPlotModal;
window.deletePlot = deletePlot;
window.initPageNavigation = initPageNavigation;
window.saveStateToStorage = saveStateToStorage;
window.restoreStateFromStorage = restoreStateFromStorage;
window.initFavorites = initFavorites;
window.fetchUserFavorites = fetchUserFavorites;
window.addFavoriteButtons = addFavoriteButtons;
window.toggleFavorite = toggleFavorite;
window.updateElementFavoriteButtons = updateElementFavoriteButtons;
window.getElementData = getElementData;
window.updateFavoritesCategory = updateFavoritesCategory;
window.moveFavoritesToTop = moveFavoritesToTop;
window.setupDateValidation = setupDateValidation;
window.calculateStageDimensions = calculateStageDimensions;
window.updateStageDimensions = updateStageDimensions;
window.updateGridOverlay = updateGridOverlay;
window.updateDimensionsLabel = updateDimensionsLabel;
window.initStageGrid = initStageGrid;
window.initCategoryFilter = initCategoryFilter;
window.checkUrlParameters = checkUrlParameters;
window.initInputList = initInputList;
window.renderElementInfoList = renderElementInfoList;
