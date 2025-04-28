/**
 * StageWrite Stage Plot Editor
 * Main entry point for the stage plot editing functionality
 */

/**
 * Initialize stage plot editor by setting up the initial state and initializing
 * various UI components and event listeners.
 */
function initStageEditor() {
  if (!document.getElementById('stage')) return;

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
    isTouchDragging: false,
    favoritesData: [],
    renderInputList: null,
    clearInputList: null,
  };

  window.plotState = plotState;

  initPlotControls(plotState);
  initDragAndDrop(plotState);
  initModalControls(plotState);
  initCategoryFilter();
  initElementsAccordion();
  initFavorites(plotState);
  moveFavoritesToTop();
  initLoadPlotModal(plotState);
  initPageNavigation(plotState);
  initStageGrid();
  checkUrlParameters(plotState);
  initLassoSelection(plotState);
  initInputList(plotState);
  initElementInfoListEvents(plotState);
  initDeleteSelectedButton(plotState);
  initShiftCursorStyle();

  plotState.renderElementInfoList = () => renderElementInfoList(plotState);

  const stateRestored = restoreStateFromStorage(plotState);
  if (!stateRestored) {
    setupInitialState(plotState);
    if (plotState.renderInputList) {
      plotState.renderInputList([]);
    }
  }

  if (!stateRestored) {
    setupInitialState(plotState);
  }

  setupChangeTracking(plotState);
  checkUrlParameters(plotState);
  setupVenueSelectHandler(plotState);
  setupDateHandlers(plotState);
  setupDateValidation(plotState);
  renderElementInfoList(plotState);
}

/**
 * Calculate stage dimensions in pixels and grid units based on venue dimensions in feet.
 * @param {number} venueWidth - Venue width in feet.
 * @param {number} venueDepth - Venue depth in feet.
 * @param {number} [maxStageWidth=900] - Maximum stage width in pixels.
 * @returns {Object} Object with calculated width, height, gridSize, dimensions in feet, and grid square counts.
 */
function calculateStageDimensions(venueWidth, venueDepth, maxStageWidth = 900) {
  if (!venueWidth || !venueDepth || venueWidth <= 0 || venueDepth <= 0) {
    venueWidth = 20;
    venueDepth = 15;
  }

  const aspectRatio = venueDepth / venueWidth;
  const stageWidth = maxStageWidth;
  const stageHeight = Math.round(stageWidth * aspectRatio);
  const gridSizeWidth = stageWidth / (venueWidth / 5);
  const gridSizeHeight = stageHeight / (venueDepth / 5);
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
 * Update stage element's dimensions, data attributes, grid overlay, and label.
 * @param {Object} dimensions - The calculated dimensions object from calculateStageDimensions.
 * @param {HTMLElement} stage - The stage DOM element.
 */
function updateStageDimensions(dimensions, stage) {
  if (!stage) return;

  stage.style.width = `${dimensions.width}px`;
  stage.style.height = `${dimensions.height}px`;
  stage.setAttribute('data-stage-width', dimensions.widthInFeet);
  stage.setAttribute('data-stage-depth', dimensions.depthInFeet);
  updateGridOverlay(dimensions, stage);
  updateDimensionsLabel(dimensions, stage);
}

/**
 * Update or create the grid overlay element with proper scaling for 5-foot and 1-foot lines.
 * @param {Object} dimensions - The calculated dimensions object.
 * @param {HTMLElement} stage - The stage DOM element.
 */
function updateGridOverlay(dimensions, stage) {
  let gridOverlay = stage.querySelector('.grid-overlay');

  if (!gridOverlay) {
    gridOverlay = document.createElement('div');
    gridOverlay.className = 'grid-overlay';
    gridOverlay.style.position = 'absolute';
    gridOverlay.style.top = '0';
    gridOverlay.style.left = '0';
    gridOverlay.style.width = '100%';
    gridOverlay.style.height = '100%';
    gridOverlay.style.pointerEvents = 'none';
    gridOverlay.style.zIndex = '1';
    gridOverlay.style.opacity = '0';
    gridOverlay.style.transition = 'opacity 0.3s ease';
    stage.appendChild(gridOverlay);
  }

  const footSize = dimensions.gridSize / 5;
  gridOverlay.style.backgroundImage = `
    linear-gradient(to right, rgba(82, 108, 129, 0.15) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(82, 108, 129, 0.15) 1px, transparent 1px),
    linear-gradient(to right, rgba(82, 108, 129, 0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(82, 108, 129, 0.05) 1px, transparent 1px)
  `;
  gridOverlay.style.backgroundSize = `
    ${dimensions.gridSize}px ${dimensions.gridSize}px,
    ${dimensions.gridSize}px ${dimensions.gridSize}px,
    ${footSize}px ${footSize}px,
    ${footSize}px ${footSize}px
  `;
  gridOverlay.setAttribute('data-grid-size', dimensions.gridSize);
  gridOverlay.setAttribute('data-foot-size', footSize);
  gridOverlay.setAttribute('data-grid-squares-x', dimensions.gridSquaresX);
  gridOverlay.setAttribute('data-grid-squares-y', dimensions.gridSquaresY);
}

/**
 * Update or create the dimensions label element on the stage.
 * @param {Object} dimensions - The calculated dimensions object.
 * @param {HTMLElement} stage - The stage DOM element.
 */
function updateDimensionsLabel(dimensions, stage) {
  let dimensionsLabel = stage.querySelector('.stage-dimensions');

  if (!dimensionsLabel) {
    dimensionsLabel = document.createElement('div');
    dimensionsLabel.className = 'stage-dimensions';
    stage.appendChild(dimensionsLabel);
  }

  dimensionsLabel.textContent = `${dimensions.widthInFeet}' × ${dimensions.depthInFeet}' (${dimensions.gridSquaresX}×${dimensions.gridSquaresY} grid)`;
  dimensionsLabel.title = `Stage dimensions: ${dimensions.widthInFeet}' × ${dimensions.depthInFeet}'
  Grid size: ${dimensions.gridSquaresX} × ${dimensions.gridSquaresY} of 5' squares
  Pixel dimensions: ${dimensions.width}px × ${dimensions.height}px
  Scale: 1 foot = ${dimensions.gridSize / 5}px`;
}

/**
 * Setup date validation to ensure the end date is not before the start date.
 * @param {Object} plotState - The current plot state object.
 */
function setupDateValidation(plotState) {
  const eventStartInput = document.getElementById('event_start');
  const eventEndInput = document.getElementById('event_end');

  if (!eventStartInput || !eventEndInput) return;

  eventStartInput.addEventListener('change', function () {
    eventEndInput.min = this.value;
    if (eventEndInput.value && eventEndInput.value < this.value) {
      eventEndInput.value = this.value;
      if (typeof showNotification === 'function') {
        showNotification('End date changed.', 'info');
      }
    }
  });

  eventEndInput.addEventListener('change', function () {
    const startDate = eventStartInput.value;
    if (startDate && this.value < startDate) {
      this.value = startDate;
      if (typeof showNotification === 'function') {
        showNotification('End date must be after start.', 'warning');
      }
    }
    if (plotState.currentPlotId) {
      markPlotAsModified(plotState);
    }
  });

  if (eventStartInput.value) {
    eventEndInput.min = eventStartInput.value;
  }
}

/**
 * Initialize accordion behavior for the elements list panel.
 */
function initElementsAccordion() {
  const elementsPanel = document.getElementById('elements-list');
  if (!elementsPanel) return;

  const headers = elementsPanel.querySelectorAll('.accordion-header');

  headers.forEach((header) => {
    header.addEventListener('click', function () {
      const item = this.closest('.accordion-item');
      const isActive = this.classList.contains('active');

      headers.forEach((h) => {
        h.classList.remove('active');
        const content = h.nextElementSibling;
        if (content && content.classList.contains('accordion-content')) {
          content.classList.remove('expanded');
        }
      });

      if (!isActive) {
        this.classList.add('active');
        const content = this.nextElementSibling;
        if (content && content.classList.contains('accordion-content')) {
          content.classList.add('expanded');
        }
      }
    });
  });

  const favoritesHeader = elementsPanel.querySelector('.favorites-section .accordion-header');
  if (favoritesHeader && !favoritesHeader.classList.contains('active')) {
    favoritesHeader.click();
  }
}

/**
 * Initialize favorites functionality by fetching user favorites and setting up UI.
 * @param {Object} plotState - The current plot state object.
 */
function initFavorites(plotState) {
  plotState.favorites = [];
  plotState.favoritesData = [];

  fetchUserFavorites(plotState).then(() => {
    addFavoriteButtons(plotState);
    updateFavoritesCategory(plotState);
  });
}

/**
 * Fetch user's favorite elements from the server and update the plot state.
 * @param {Object} plotState - The current plot state object.
 * @returns {Promise} - Promise that resolves when favorites are fetched and processed.
 */
function fetchUserFavorites(plotState) {
  return fetch('/handlers/get_favorites.php')
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        plotState.favorites = data.favorites.map((fav) => parseInt(fav.element_id));
        plotState.favoritesData = data.favorites;
      }
    })
    .catch((error) => {
      console.error('Error fetching favorites:', error);
    });
}

/**
 * Add favorite toggle buttons to all draggable elements in the list.
 * @param {Object} plotState - The current plot state object.
 */
function addFavoriteButtons(plotState) {
  const elements = document.querySelectorAll('.draggable-element:not(.favorite-element)');

  elements.forEach((element) => {
    const elementId = parseInt(element.getAttribute('data-element-id'));
    const isFavorite = plotState.favorites.includes(elementId);

    if (!element.querySelector('.favorite-button')) {
      const favoriteBtn = document.createElement('button');
      favoriteBtn.className = 'favorite-button';
      favoriteBtn.setAttribute('type', 'button');
      favoriteBtn.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
      favoriteBtn.innerHTML = isFavorite ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';

      favoriteBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        toggleFavorite(elementId, plotState);
      });

      element.appendChild(favoriteBtn);
    }
  });
}

/**
 * Toggle an element's favorite status both in the UI and on the server.
 * Includes animation for removing elements from the favorites section.
 * @param {number} elementId - The ID of the element to toggle favorite status for.
 * @param {Object} plotState - The current plot state object.
 */
function toggleFavorite(elementId, plotState) {
  if (plotState.favoriteToggleInProgress) {
    return;
  }

  const formData = new FormData();
  formData.append('element_id', elementId);
  plotState.favoriteToggleInProgress = true;
  const isRemoving = plotState.favorites.includes(elementId);

  if (isRemoving) {
    const favoriteElement = document.querySelector(`.favorite-element[data-element-id="${elementId}"]`);
    if (favoriteElement) {
      requestAnimationFrame(() => {
        favoriteElement.classList.add('removing');
        let requestSent = false;
        const handleAnimationEnd = () => {
          if (requestSent) return;
          requestSent = true;
          favoriteElement.removeEventListener('animationend', handleAnimationEnd);
          sendToggleRequest();
        };
        favoriteElement.addEventListener('animationend', handleAnimationEnd);
        setTimeout(() => {
          if (requestSent) return;
          requestSent = true;
          favoriteElement.classList.remove('removing');
          sendToggleRequest();
        }, 500);
      });
      return;
    }
  }

  sendToggleRequest();

  function sendToggleRequest() {
    fetch('/handlers/toggle_favorite.php', {
      method: 'POST',
      body: formData,
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          const isFavorite = data.action === 'added';
          if (isFavorite) {
            if (!plotState.favorites.includes(elementId)) {
              plotState.favorites.push(elementId);
              const elementData = getElementData(elementId);
              if (elementData) {
                plotState.favoritesData.push(elementData);
              }
            }
          } else {
            plotState.favorites = plotState.favorites.filter((id) => id !== elementId);
            plotState.favoritesData = plotState.favoritesData.filter((fav) => fav.element_id !== elementId);
          }
          updateElementFavoriteButtons(elementId, isFavorite);
          updateFavoritesCategory(plotState);
          if (typeof showNotification === 'function') {
            showNotification(data.message, 'success');
          }
        } else {
          if (typeof showNotification === 'function') {
            showNotification(data.error || 'Error toggling favorite', 'error');
          }
        }
        plotState.favoriteToggleInProgress = false;
      })
      .catch((error) => {
        console.error('Error toggling favorite:', error);
        if (typeof showNotification === 'function') {
          showNotification('Error toggling favorite', 'error');
        }
        plotState.favoriteToggleInProgress = false;
      });
  }
}

/**
 * Update the visual state (icon, title) of all favorite buttons associated with a specific element ID.
 * @param {number} elementId - The ID of the element whose buttons need updating.
 * @param {boolean} isFavorite - The new favorite status.
 */
function updateElementFavoriteButtons(elementId, isFavorite) {
  const buttons = document.querySelectorAll(`.draggable-element[data-element-id="${elementId}"] .favorite-button`);
  buttons.forEach((button) => {
    button.title = isFavorite ? 'Remove from favorites' : 'Add to favorites';
    button.innerHTML = isFavorite ? '<i class="fa-solid fa-star"></i>' : '<i class="fa-regular fa-star"></i>';
  });
}

/**
 * Retrieve element data (ID, name, category, image) from a DOM element.
 * @param {number} elementId - The ID of the element to get data for.
 * @returns {Object|null} An object containing element data, or null if the element is not found.
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
 * Update the "Favorites" category section in the elements list UI.
 * Creates the section if it doesn't exist, populates it with favorited elements,
 * and handles adding/removing animations.
 * @param {Object} plotState - The current plot state object.
 */
function updateFavoritesCategory(plotState) {
  const elementsPanel = document.getElementById('elements-list');
  if (!elementsPanel) return;

  let favoritesSection = elementsPanel.querySelector('.category-section.favorites-section');
  if (!plotState.previousFavorites) {
    plotState.previousFavorites = [];
  }
  const newFavorites = plotState.favorites.filter((id) => !plotState.previousFavorites.includes(id));

  if (!favoritesSection) {
    favoritesSection = document.createElement('div');
    favoritesSection.className = 'category-section favorites-section accordion-item';
    favoritesSection.setAttribute('data-category-id', '1');

    const heading = document.createElement('h3');
    heading.className = 'accordion-header active';
    heading.textContent = 'Favorites';
    const icon = document.createElement('span');
    icon.className = 'accordion-icon';
    heading.appendChild(icon);
    favoritesSection.appendChild(heading);

    const grid = document.createElement('div');
    grid.className = 'accordion-content elements-grid expanded';
    favoritesSection.appendChild(grid);
    elementsPanel.insertBefore(favoritesSection, elementsPanel.firstChild);

    heading.addEventListener('click', function () {
      const isActive = this.classList.contains('active');
      const allHeaders = elementsPanel.querySelectorAll('.accordion-header');
      allHeaders.forEach((h) => {
        h.classList.remove('active');
        const content = h.nextElementSibling;
        if (content) content.classList.remove('expanded');
      });
      if (!isActive) {
        this.classList.add('active');
        grid.classList.add('expanded');
      }
    });
  }

  let favoritesGrid = favoritesSection.querySelector('.accordion-content');
  if (!favoritesGrid) {
    favoritesGrid = document.createElement('div');
    favoritesGrid.className = 'accordion-content elements-grid expanded';
    favoritesSection.appendChild(favoritesGrid);
  }

  favoritesGrid.innerHTML = '';

  if (!plotState.favorites || plotState.favorites.length === 0) {
    const noFavorites = document.createElement('p');
    noFavorites.className = 'no-favorites-message';
    noFavorites.textContent = 'No favorites yet. Click the ☆ icon on any element.';
    favoritesGrid.appendChild(noFavorites);
  } else {
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

        if (newFavorites.includes(elementId)) {
          favoriteElement.classList.add('adding');
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

  plotState.previousFavorites = [...plotState.favorites];
  moveFavoritesToTop();
}

/**
 * Ensures the "Favorites" section is always the first child within the elements list panel
 * and has the correct accordion structure.
 */
function moveFavoritesToTop() {
  const elementsPanel = document.getElementById('elements-list');
  if (!elementsPanel) return;

  const favoritesSection = elementsPanel.querySelector('.category-section[data-category-id="1"], .category-section.favorites-section');
  if (!favoritesSection) return;

  favoritesSection.classList.add('favorites-section');
  favoritesSection.classList.add('accordion-item');

  const firstChild = elementsPanel.firstChild;
  if (favoritesSection !== firstChild) {
    elementsPanel.insertBefore(favoritesSection, firstChild);
  }

  let header = favoritesSection.querySelector('.accordion-header');
  if (!header) {
    header = document.createElement('h3');
    header.className = 'accordion-header active';
    header.textContent = 'Favorites';
    const icon = document.createElement('span');
    icon.className = 'accordion-icon';
    header.appendChild(icon);
    favoritesSection.insertBefore(header, favoritesSection.firstChild);

    header.addEventListener('click', function () {
      const isActive = this.classList.contains('active');
      const allHeaders = elementsPanel.querySelectorAll('.accordion-header');
      allHeaders.forEach((h) => {
        h.classList.remove('active');
        const content = h.nextElementSibling;
        if (content) content.classList.remove('expanded');
      });
      if (!isActive) {
        this.classList.add('active');
        const content = this.nextElementSibling;
        if (content) content.classList.add('expanded');
      }
    });
  }

  let content = favoritesSection.querySelector('.elements-grid');
  if (content) {
    content.classList.add('accordion-content');
    if (header.classList.contains('active')) {
      content.classList.add('expanded');
    }
  }
}

/**
 * Initialize drag and drop functionality for elements from the list to the stage.
 * @param {Object} plotState - The current plot state object.
 */
function initDragAndDrop(plotState) {
  const stage = document.getElementById('stage');
  if (!stage) return;

  const draggableElements = document.querySelectorAll('.draggable-element');

  draggableElements.forEach((element) => {
    element.addEventListener('dragstart', (e) => {
      if (window.plotState && window.plotState.isTouchDragging) {
        e.preventDefault(); return;
      }
      handleDragStart(e, plotState);
    });
    element.setAttribute('draggable', true);
  });

  stage.addEventListener('dragover', handleDragOver);
  stage.addEventListener('drop', (e) => handleDrop(e, plotState));
}

/**
 * Handles the start of a drag operation from the elements list.
 * Sets drag data, effect allowed, and creates a custom drag preview image
 * positioned relative to the cursor.
 * @param {DragEvent} e - The drag event object.
 * @param {Object} plotState - The current plot state object.
 */
function handleDragStart(e, plotState) {
  if (window.plotState && window.plotState.isTouchDragging) {
    e.preventDefault(); return;
  }

  const sourceElement = e.target;
  const elementId = sourceElement.getAttribute('data-element-id');

  e.dataTransfer.setData('text/plain', elementId);
  e.dataTransfer.effectAllowed = 'copy';

  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

  const sourceRect = sourceElement.getBoundingClientRect();
  const clickOffsetX = e.clientX - sourceRect.left;
  const clickOffsetY = e.clientY - sourceRect.top;

  plotState.currentDragId = elementId;
  plotState.dragSourceRect = {
    width: sourceRect.width,
    height: sourceRect.height,
    offsetX: clickOffsetX,
    offsetY: clickOffsetY,
  };

  const clone = sourceElement.cloneNode(true);
  clone.classList.add('drag-preview-element');
  clone.classList.remove('dragging');

  const favoriteButton = clone.querySelector('.favorite-button');
  if (favoriteButton) {
    favoriteButton.style.display = 'none';
  }

  if (isFirefox) {
    clone.style.position = 'absolute';
    clone.style.top = '-1000px';
    clone.style.left = '-1000px';
    clone.style.opacity = '0.99';
    clone.style.pointerEvents = 'none';
    clone.style.margin = '0';
    document.body.appendChild(clone);

    try {
      e.dataTransfer.setDragImage(clone, 0, 0);
      console.log("Firefox: setDragImage called with offset (0, 0)");
    } catch (error) {
      console.error("Error setting drag image:", error);
    }

    setTimeout(() => {
      if (clone.parentNode === document.body) {
        document.body.removeChild(clone);
      }
    }, 0);
  } else {
    clone.style.position = 'fixed';
    clone.style.top = '0';
    clone.style.left = '0';
    clone.style.zIndex = '-1';
    clone.style.opacity = '0.01';
    clone.style.margin = '0';
    clone.style.transform = 'translateZ(0)';
    document.body.appendChild(clone);

    void clone.offsetWidth;

    try {
      e.dataTransfer.setDragImage(clone, 0, 0);
      console.log("Chrome: setDragImage called with offset (0, 0)");
    } catch (error) {
      console.error("Error setting drag image:", error);
    }

    setTimeout(() => {
      if (clone.parentNode === document.body) {
        document.body.removeChild(clone);
      }
    }, 100);
  }

  function cleanupDragState() {
    document.removeEventListener('dragend', cleanupDragState);
    plotState.currentDragId = null;
    plotState.dragSourceRect = null;
    console.log("Drag state cleaned up on dragend.");
  }
  document.addEventListener('dragend', cleanupDragState, { once: true });
}

/**
 * Handles the drag over event on the stage to allow dropping.
 * @param {DragEvent} e - The drag event object.
 */
function handleDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'copy';
}

/**
 * Handles the drop event on the stage. Creates a new element based on the dragged data,
 * calculates its position considering browser differences and stage boundaries,
 * adds it to the plot state, and renders it on the stage with an animation.
 * @param {DragEvent} e - The drop event object.
 * @param {Object} plotState - The current plot state object.
 */
function handleDrop(e, plotState) {
  if (window.plotState && window.plotState.isTouchDragging) {
    return;
  }

  const stage = document.getElementById('stage');
  if (!stage) return;

  e.preventDefault();

  const elementId = e.dataTransfer.getData('text/plain');
  if (!elementId || !plotState.dragSourceRect) {
      console.warn("Drop canceled: Missing elementId or dragSourceRect");
      if (elementId) {
          plotState.currentDragId = null;
      }
      return;
  }

  const sourceElement = document.querySelector(
    `.draggable-element[data-element-id="${elementId}"]`
  );
  if (!sourceElement) return;

  const elementName = sourceElement.getAttribute('data-element-name');
  const categoryId = sourceElement.getAttribute('data-category-id');
  const imageSrc = sourceElement.getAttribute('data-image');
  const stageRect = stage.getBoundingClientRect();
  const elementWidth = 75;
  const elementHeight = 75;

  const elementMarginChrome = 14;
  const elementMarginFoxX = 10;
  const elementMarginFoxY = 5;

  let dropXRelativeToStage = e.clientX - stageRect.left;
  let dropYRelativeToStage = e.clientY - stageRect.top;
  let finalX, finalY;

  const isFirefox = navigator.userAgent.toLowerCase().includes('firefox');

  if (isFirefox) {
    console.log("Firefox detected: Using direct offset calculation.");
    finalX = dropXRelativeToStage + elementMarginFoxX;
    finalY = dropYRelativeToStage + elementMarginFoxY;
  } else {
    console.log("Non-Firefox browser detected: Using margin-compensated calculation.");
    finalX = dropXRelativeToStage - elementMarginChrome;
    finalY = dropYRelativeToStage - elementMarginChrome;
  }

  // Apply different buffer values for different sides like in dragMove
  const leftBuffer = 0;
  const topBuffer = 0;
  const rightBuffer = 30;
  const bottomBuffer = 30;
  
  const maxLeft = stageRect.width - elementWidth - rightBuffer;
  const maxTop = stageRect.height - elementHeight - bottomBuffer;
  
  const constrainedX = Math.max(leftBuffer, Math.min(finalX, maxLeft));
  const constrainedY = Math.max(topBuffer, Math.min(finalY, maxTop));

  const newElementId = plotState.elements.length > 0 ? Math.max(...plotState.elements.map((el) => el.id)) + 1 : 1;

  const newElement = {
    id: newElementId,
    elementId: parseInt(elementId),
    elementName: elementName,
    categoryId: parseInt(categoryId),
    image: imageSrc,
    x: constrainedX,
    y: constrainedY,
    width: elementWidth,
    height: elementHeight,
    flipped: false,
    zIndex: plotState.nextZIndex++,
    label: '',
    notes: '',
  };

  plotState.dragSourceRect = null;
  plotState.currentDragId = null;

  plotState.elements.push(newElement);

  createPlacedElement(newElement, plotState).then(() => {
    const domElement = document.querySelector(
      `.placed-element[data-id="${newElement.id}"]`
    );
    if (domElement) {
      requestAnimationFrame(() => {
        domElement.classList.add('dropping');
        domElement.addEventListener(
          'animationend',
          () => {
            domElement.classList.remove('dropping');
          },
          { once: true }
        );
      });
    }
    renderElementInfoList(plotState);
  });

  markPlotAsModified(plotState);
}

/**
 * Creates and appends a placed element DOM node to the stage based on element data.
 * Handles image loading, aspect ratio adjustments, label display, and adds action buttons (edit, delete, flip).
 * @param {Object} elementData - The data object for the element to be created.
 * @param {Object} plotState - The current plot state object.
 * @returns {Promise} - A promise that resolves when the element's image (if any) has loaded or errored.
 */
function createPlacedElement(elementData, plotState) {
  return new Promise((resolve) => {
    const stage = document.getElementById('stage');
    if (!stage) {
      resolve();
      return;
    }

    const element = document.createElement('div');
    element.className = 'placed-element';
    element.setAttribute('data-id', elementData.id);
    element.setAttribute('data-element-id', elementData.elementId);
    element.style.left = `${elementData.x}px`;
    element.style.top = `${elementData.y}px`;
    element.style.height = `${elementData.height}px`;
    element.style.zIndex = elementData.zIndex;
    element.style.width = `${elementData.width}px`;

    const img = document.createElement('img');
    img.src = `/images/elements/${elementData.image}`;
    img.alt = elementData.elementName;
    if (elementData.flipped) {
      img.style.transform = 'scaleX(-1)';
    }

    img.onload = function () {
      const aspectRatio = this.naturalWidth / this.naturalHeight;
      const newWidth = Math.round(elementData.height * aspectRatio);
      element.style.width = `${newWidth}px`;
      const elementIndex = plotState.elements.findIndex((el) => el.id === elementData.id);
      if (elementIndex !== -1) {
        plotState.elements[elementIndex].width = newWidth;
      }
      resolve();
    };
    img.onerror = function () {
      console.warn(`Failed to load image for element ${elementData.elementName}`);
      resolve();
    };
    element.appendChild(img);

    if (elementData.label) {
      const label = document.createElement('div');
      label.className = 'element-label';
      label.textContent = elementData.label;
      element.appendChild(label);
    }

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
    editBtn.addEventListener('mousedown', function (e) { this.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.3)'; });
    editBtn.addEventListener('mouseup', function () { this.style.boxShadow = ''; });
    editBtn.addEventListener('mouseleave', function () { this.style.boxShadow = ''; });
    editAction.appendChild(editBtn);
    element.appendChild(editAction);

    const deleteAction = document.createElement('div');
    deleteAction.className = 'element-actions';
    deleteAction.id = 'delete-action';
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'edit-element';
    deleteBtn.innerHTML = '<i class="fa-regular fa-trash-can"></i>';
    deleteBtn.title = 'Delete Element';
    deleteBtn.id = 'delete-action-btn';
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      setupConfirmButton(
        deleteBtn,
        () => { deleteElement(elementData.id, plotState); },
        { confirmText: 'Delete', confirmTitle: 'Permanent', stopPropagation: true, event: e }
      );
    });
    deleteBtn.addEventListener('mousedown', function (e) { this.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.3)'; });
    deleteBtn.addEventListener('mouseup', function () { this.style.boxShadow = ''; });
    deleteBtn.addEventListener('mouseleave', function () { this.style.boxShadow = ''; });
    deleteAction.appendChild(deleteBtn);
    element.appendChild(deleteAction);

    const flipAction = document.createElement('div');
    flipAction.className = 'element-actions';
    flipAction.id = 'flip-action';
    const flipBtn = document.createElement('button');
    flipBtn.className = 'edit-element flip-btn';
    flipBtn.innerHTML = '<i class="fa-solid fa-repeat"></i>';
    flipBtn.title = elementData.flipped ? 'Unflip Horizontally' : 'Flip Horizontally';
    if (elementData.flipped) {
      flipBtn.classList.add('flipped');
    }
    flipBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      const currentElementId = elementData.id;
      const elementIndex = plotState.elements.findIndex((el) => el.id === currentElementId);
      if (elementIndex === -1) {
        console.error('Flip error: Element not found in state with ID:', currentElementId);
        return;
      }
      if (element.classList.contains('flipping')) return;
      const currentlyFlipped = plotState.elements[elementIndex].flipped;
      const controls = element.querySelectorAll('.element-actions, .element-label');
      controls.forEach((control) => {
        control.style.opacity = '0';
        control.style.pointerEvents = 'none';
        control.style.transition = 'none';
      });
      const flipOverlay = document.createElement('div');
      flipOverlay.className = 'flip-overlay';
      element.appendChild(flipOverlay);
      requestAnimationFrame(() => {
        element.classList.add('flipping');
        element.classList.add(currentlyFlipped ? 'to-left' : 'to-right');
        const imageElement = element.querySelector('img');
        if (!imageElement) {
          console.warn('Flip warning: Image element not found for ID:', currentElementId);
          plotState.elements[elementIndex].flipped = !currentlyFlipped;
          flipBtn.classList.toggle('flipped', !currentlyFlipped);
          flipBtn.title = !currentlyFlipped ? 'Unflip Horizontally' : 'Flip Horizontally';
          element.classList.remove('flipping', 'to-right', 'to-left');
          if (flipOverlay && flipOverlay.parentNode) flipOverlay.remove();
          setTimeout(() => { controls.forEach((control) => control.removeAttribute('style')); }, 50);
          markPlotAsModified(plotState);
          return;
        }
        const handleAnimationEnd = () => {
          plotState.elements[elementIndex].flipped = !currentlyFlipped;
          imageElement.style.transform = !currentlyFlipped ? 'scaleX(-1)' : '';
          flipBtn.classList.toggle('flipped', !currentlyFlipped);
          flipBtn.title = !currentlyFlipped ? 'Unflip Horizontally' : 'Flip Horizontally';
          element.classList.remove('flipping', 'to-right', 'to-left');
          imageElement.removeEventListener('animationend', handleAnimationEnd);
          if (flipOverlay && flipOverlay.parentNode) flipOverlay.remove();
          setTimeout(() => { controls.forEach((control) => control.removeAttribute('style')); }, 50);
          markPlotAsModified(plotState);
        };
        imageElement.addEventListener('animationend', handleAnimationEnd);
        setTimeout(() => {
          if (element.classList.contains('flipping')) {
            console.warn('Flip animation fallback triggered for ID:', currentElementId);
            imageElement.removeEventListener('animationend', handleAnimationEnd);
            handleAnimationEnd();
          }
        }, 500);
      });
    });
    flipBtn.addEventListener('mousedown', function (e) { this.style.boxShadow = 'inset 0 0 10px rgba(0, 0, 0, 0.3)'; });
    flipBtn.addEventListener('mouseup', function () { this.style.boxShadow = ''; });
    flipBtn.addEventListener('mouseleave', function () { this.style.boxShadow = ''; });
    flipAction.appendChild(flipBtn);
    element.appendChild(flipAction);

    makeDraggableOnStage(element, plotState);
    stage.appendChild(element);

    if (!img.src || img.complete) {
      if (img.complete && img.naturalWidth > 0) {
        img.onload();
      } else if (!img.src) {
        resolve();
      }
    }
    if (plotState.updateInputSuggestions) plotState.updateInputSuggestions();
  });
}

/**
 * Initializes lasso selection functionality on the stage area.
 * Allows selecting multiple elements by dragging a box, or toggling selection with Shift+Click.
 * @param {Object} plotState - The current plot state object.
 */
function initLassoSelection(plotState) {
  document.addEventListener('selectstart', function (e) {
    if (e.target && typeof e.target.closest === 'function' && e.target.closest('#stage')) {
      e.preventDefault();
      return false;
    }
  });

  const stage = document.getElementById('stage');
  let lassoActive = false;
  let lassoStartX, lassoStartY;
  let lassoElement = null;

  stage.addEventListener(
    'mousedown',
    (e) => {
      const clickedElement = e.target && typeof e.target.closest === 'function' ? e.target.closest('.placed-element') : null;

      if (e.shiftKey && clickedElement) {
        if (e.target.closest('.element-actions') || e.target.classList.contains('edit-element') || e.target.classList.contains('favorite-button')) {
          return;
        }
        e.stopPropagation();
        const elementId = parseInt(clickedElement.getAttribute('data-id'));
        const selectionIndex = plotState.selectedElements.indexOf(elementId);
        if (selectionIndex !== -1) {
          plotState.selectedElements.splice(selectionIndex, 1);
          clickedElement.classList.remove('selected');
        } else {
          plotState.selectedElements.push(elementId);
          clickedElement.classList.add('selected');
        }
        updateStageSelectionState(plotState);
        e._handledBySelection = true;
        return;
      }

      if ((e.target === stage || e.target.classList.contains('grid-overlay')) && !clickedElement) {
        if (!e.shiftKey) {
          clearElementSelection(plotState);
        }
        lassoActive = true;
        lassoStartX = e.clientX - stage.getBoundingClientRect().left;
        lassoStartY = e.clientY - stage.getBoundingClientRect().top;
        lassoElement = document.createElement('div');
        lassoElement.className = 'lasso-box';
        lassoElement.style.left = `${lassoStartX}px`;
        lassoElement.style.top = `${lassoStartY}px`;
        stage.appendChild(lassoElement);
        document.addEventListener('mousemove', handleLassoMove);
        document.addEventListener('mouseup', handleLassoEnd, { once: true });
      } else if (!clickedElement && !e.shiftKey) {
        clearElementSelection(plotState);
      }
    },
    true
  );

  /**
   * Handles mouse movement during lasso selection, updating the lasso box dimensions.
   * @param {MouseEvent} e - The mouse move event.
   */
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

  /**
   * Handles the end of the lasso selection (mouseup).
   * Determines which elements intersect with the lasso box and updates the selection state.
   * Removes the lasso visual element.
   * @param {MouseEvent} e - The mouse up event.
   */
  function handleLassoEnd(e) {
    if (!lassoActive || !lassoElement) return;
    lassoActive = false;

    const lassoRect = lassoElement.getBoundingClientRect();
    const stageRect = stage.getBoundingClientRect();
    const MIN_LASSO_SIZE = 5;
    if (lassoRect.width < MIN_LASSO_SIZE || lassoRect.height < MIN_LASSO_SIZE) {
      lassoElement.remove();
      lassoElement = null;
      document.removeEventListener('mousemove', handleLassoMove);
      return;
    }

    const relativeLassoRect = {
      left: lassoRect.left - stageRect.left,
      top: lassoRect.top - stageRect.top,
      right: lassoRect.right - stageRect.left,
      bottom: lassoRect.bottom - stageRect.top,
      width: lassoRect.width,
      height: lassoRect.height,
    };

    let selectedCount = 0;
    stage.querySelectorAll('.placed-element').forEach((el) => {
      const elRect = el.getBoundingClientRect();
      const relativeElRect = {
        left: elRect.left - stageRect.left,
        top: elRect.top - stageRect.top,
        right: elRect.right - stageRect.left,
        bottom: elRect.bottom - stageRect.top,
        width: elRect.width,
        height: elRect.height,
      };

      const intersects = !(relativeElRect.right < relativeLassoRect.left || relativeElRect.left > relativeLassoRect.right || relativeElRect.bottom < relativeLassoRect.top || relativeElRect.top > relativeLassoRect.bottom);

      if (intersects) {
        const elementId = parseInt(el.getAttribute('data-id'));
        if (!plotState.selectedElements.includes(elementId)) {
          plotState.selectedElements.push(elementId);
          el.classList.add('selected');
          selectedCount++;
        }
      }
    });

    if (selectedCount > 0) {
      updateStageSelectionState(plotState);
    }

    lassoElement.remove();
    lassoElement = null;
    document.removeEventListener('mousemove', handleLassoMove);
  }

  updateStageSelectionState(plotState);
}

/**
 * Initializes event listeners to change the cursor style to 'pointer'
 * and add a CSS class to the stage when the Shift key is held down,
 * facilitating visual indication for shift-click selection mode.
 */
function initShiftCursorStyle() {
  const stage = document.getElementById('stage');
  if (!stage) return;

  let originalCursorStyle = '';
  let isShiftDown = false;

  /**
   * Handles the keydown event, specifically checking for the Shift key.
   * @param {KeyboardEvent} e - The keyboard event.
   */
  function handleShiftDown(e) {
    if (e.key === 'Shift' && !isShiftDown) {
      isShiftDown = true;
      if (!originalCursorStyle) {
        originalCursorStyle = stage.style.cursor || '';
      }
      stage.style.cursor = 'pointer';
      stage.classList.add('shift-selection-mode');
    }
  }

  /**
   * Handles the keyup event, specifically checking for the Shift key.
   * @param {KeyboardEvent} e - The keyboard event.
   */
  function handleShiftUp(e) {
    if (e.key === 'Shift' && isShiftDown) {
      isShiftDown = false;
      stage.style.cursor = originalCursorStyle;
      stage.classList.remove('shift-selection-mode');
    }
  }

  document.addEventListener('keydown', handleShiftDown);
  document.addEventListener('keyup', handleShiftUp);

  window.addEventListener('blur', () => {
    if (isShiftDown) {
      isShiftDown = false;
      stage.style.cursor = originalCursorStyle;
      stage.classList.remove('shift-selection-mode');
    }
  });
}

/**
 * Updates the stage's CSS class based on whether elements are currently selected.
 * Also triggers an update for the "Delete Selected" button visibility.
 * @param {Object} plotState - The current plot state object.
 */
function updateStageSelectionState(plotState) {
  const stage = document.getElementById('stage');
  if (!stage) return;

  if (plotState.selectedElements.length > 0) {
    stage.classList.add('has-selection');
  } else {
    stage.classList.remove('has-selection');
  }
  updateDeleteSelectedButton(plotState);
}

/**
 * Makes a placed element draggable within the stage boundaries.
 * Handles dragging single elements, groups of selected elements,
 * and duplication of elements/groups using Ctrl/Cmd+Drag.
 * @param {HTMLElement} element - The DOM element to make draggable.
 * @param {Object} plotState - The current plot state object.
 */
function makeDraggableOnStage(element, plotState) {
  let startX, startY, startLeft, startTop;
  let isDraggingGroup = false;
  let isDuplicating = false;
  let groupOffsets = [];
  let ghostElements = [];
  let sourceElements = [];

  element.addEventListener('mousedown', startDrag);
  element.addEventListener('touchstart', startDrag, { passive: false });

  /**
   * Initiates the drag operation for an element on the stage.
   * Determines if dragging a group, duplicating, or moving a single element.
   * Sets up necessary state and event listeners for move and end events.
   * @param {MouseEvent|TouchEvent} e - The mousedown or touchstart event.
   */
  function startDrag(e) {
    if (e._handledBySelection === true) return;
    if (e.target.closest('.element-actions') || e.target.classList.contains('edit-element')) return;
    if (e.type === 'mousedown' && e.dataTransfer) e.preventDefault();
    e.stopPropagation();

    const elementId = parseInt(element.getAttribute('data-id'));
    isDuplicating = e.ctrlKey || e.metaKey;

    if (isDuplicating && e.type === 'mousedown' && e.dataTransfer) {
      const emptyPreview = document.createElement('div');
      emptyPreview.style.cssText = 'width:1px;height:1px;position:absolute;left:-10px;top:-10px;opacity:0;';
      document.body.appendChild(emptyPreview);
      try {
        e.dataTransfer.effectAllowed = 'copy';
        e.dataTransfer.setData('text/plain', elementId.toString());
        e.dataTransfer.setDragImage(emptyPreview, 0, 0);
        console.log("Invisible drag image set for duplication.");
      } catch (error) {
        console.error("Error setting drag image:", error);
      }
      setTimeout(() => { if (emptyPreview.parentNode) emptyPreview.remove(); }, 0);
    }

    isDraggingGroup = plotState.selectedElements && plotState.selectedElements.includes(elementId);

    if (!isDraggingGroup) {
        if (plotState && plotState.selectedElements && Array.isArray(plotState.selectedElements)) {
            clearElementSelection(plotState);
        } else {
            console.warn("Attempted to clear selection, but plotState or selectedElements was invalid.", plotState);
            if (plotState) {
                plotState.selectedElements = [];
                if (typeof updateStageSelectionState === 'function') {
                    updateStageSelectionState(plotState);
                }
            }
        }
        if (!isDuplicating) bringToFront(elementId, plotState);
    } else {
      if (!isDuplicating) bringToFront(elementId, plotState);
      groupOffsets = [];
      plotState.selectedElements.forEach((id) => {
        const domEl = document.querySelector(`.placed-element[data-id="${id}"]`);
        if (domEl) {
          const rect = domEl.getBoundingClientRect();
          const elLeft = parseInt(window.getComputedStyle(domEl).left);
          const elTop = parseInt(window.getComputedStyle(domEl).top);
          const primaryLeft = parseInt(window.getComputedStyle(element).left);
          const primaryTop = parseInt(window.getComputedStyle(element).top);
          const offsetX = id === elementId ? 0 : elLeft - primaryLeft;
          const offsetY = id === elementId ? 0 : elTop - primaryTop;
          groupOffsets.push({ id: id, offsetX: offsetX, offsetY: offsetY, width: rect.width, height: rect.height, element: domEl });
        }
      });
    }

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

    if (isDuplicating) {
      document.body.classList.add('duplicating-element');
      if (isDraggingGroup) {
        groupOffsets.forEach((offsetData) => {
          offsetData.element.classList.add('is-being-duplicated');
          sourceElements.push(offsetData.element);
          createGhostElement(offsetData.element, offsetData.offsetX, offsetData.offsetY);
        });
      } else {
        element.classList.add('is-being-duplicated');
        sourceElements.push(element);
        createGhostElement(element, 0, 0);
      }
    }

    document.addEventListener('mousemove', dragMove);
    document.addEventListener('touchmove', dragMove, { passive: false });
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);
  }

  /**
   * Creates a visual clone (ghost) of an element for drag duplication preview.
   * @param {HTMLElement} sourceElement - The original element being duplicated.
   * @param {number} offsetX - The horizontal offset relative to the primary dragged element (for group dragging).
   * @param {number} offsetY - The vertical offset relative to the primary dragged element (for group dragging).
   */
  function createGhostElement(sourceElement, offsetX, offsetY) {
    const ghost = sourceElement.cloneNode(true);
    ghost.classList.add('ghost-element');
    ghost.classList.remove('selected', 'is-being-duplicated');
    ghost.style.position = 'absolute';
    ghost.style.pointerEvents = 'none';
    ghost.style.opacity = '0.6';
    ghost.style.left = `${startLeft + offsetX}px`;
    ghost.style.top = `${startTop + offsetY}px`;
    const actionsToRemove = ghost.querySelectorAll('.element-actions');
    actionsToRemove.forEach((action) => action.remove());
    ghostElements.push({ ghost: ghost, source: sourceElement, offsetX: offsetX, offsetY: offsetY });
    document.getElementById('stage').appendChild(ghost);
  }

  /**
   * Handles the movement during a drag operation on the stage.
   * Calculates the new position based on mouse/touch movement, applies constraints
   * to keep the element(s) within the stage boundaries, and updates the visual
   * position of the dragged element(s) or ghost element(s).
   * @param {MouseEvent|TouchEvent} e - The mousemove or touchmove event.
   */
  function dragMove(e) {
    if (e.type === 'touchmove') e.preventDefault();
  
    let clientX, clientY;
    if (e.type === 'touchmove') {
      if (e.touches && e.touches.length > 0) {
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        console.warn("Touchmove event without touches array.");
        return;
      }
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
  
    const dx = clientX - startX;
    const dy = clientY - startY;
    const nextPrimaryLeft = startLeft + dx;
    const nextPrimaryTop = startTop + dy;
    let constrainedPrimaryLeft = nextPrimaryLeft;
    let constrainedPrimaryTop = nextPrimaryTop;
  
    const stage = document.getElementById('stage');
    const stageRect = stage.getBoundingClientRect();
    const stageWidth = stageRect.width;
    const stageHeight = stageRect.height;
    
    // Different buffer values for different sides
    const leftBuffer = 0;
    const topBuffer = 0;
    const rightBuffer = 30;
    const bottomBuffer = 30;
  
    if (isDraggingGroup) {
      let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
      groupOffsets.forEach((offsetData) => {
        const memberNextX = nextPrimaryLeft + offsetData.offsetX;
        const memberNextY = nextPrimaryTop + offsetData.offsetY;
        const memberWidth = Number(offsetData.width) || 0;
        const memberHeight = Number(offsetData.height) || 0;
        minX = Math.min(minX, memberNextX);
        minY = Math.min(minY, memberNextY);
        maxX = Math.max(maxX, memberNextX + memberWidth);
        maxY = Math.max(maxY, memberNextY + memberHeight);
      });
      
      let deltaX = 0;
      if (minX < leftBuffer) deltaX = leftBuffer - minX;
      else if (maxX > stageWidth - rightBuffer) deltaX = stageWidth - rightBuffer - maxX;
      
      let deltaY = 0;
      if (minY < topBuffer) deltaY = topBuffer - minY;
      else if (maxY > stageHeight - bottomBuffer) deltaY = stageHeight - bottomBuffer - maxY;
      
      constrainedPrimaryLeft = nextPrimaryLeft + deltaX;
      constrainedPrimaryTop = nextPrimaryTop + deltaY;
    } else {
      const elementRect = element.getBoundingClientRect();
      const elementWidth = Number(elementRect.width) || 0;
      const elementHeight = Number(elementRect.height) || 0;
      
      const maxLeft = stageWidth - elementWidth - rightBuffer;
      const maxTop = stageHeight - elementHeight - bottomBuffer;
      
      constrainedPrimaryLeft = Math.max(leftBuffer, Math.min(maxLeft, nextPrimaryLeft));
      constrainedPrimaryTop = Math.max(topBuffer, Math.min(maxTop, nextPrimaryTop));
    }
  
    const actualDx = constrainedPrimaryLeft - startLeft;
    const actualDy = constrainedPrimaryTop - startTop;
  
    if (isDuplicating) {
      ghostElements.forEach((ghostData) => {
          if (ghostData.ghost) {
              ghostData.ghost.style.left = `${startLeft + ghostData.offsetX + actualDx}px`;
              ghostData.ghost.style.top = `${startTop + ghostData.offsetY + actualDy}px`;
          } else {
              console.warn("Ghost element missing in ghostData during dragMove.");
          }
      });
    } else if (isDraggingGroup) {
      groupOffsets.forEach((offsetData) => {
        const groupElement = offsetData.element;
        const elementStateIndex = plotState.elements.findIndex((el) => el.id === offsetData.id);
        if (groupElement && elementStateIndex !== -1) {
          const targetLeft = startLeft + offsetData.offsetX + actualDx;
          const targetTop = startTop + offsetData.offsetY + actualDy;
          groupElement.style.left = `${targetLeft}px`;
          groupElement.style.top = `${targetTop}px`;
        }
      });
    } else {
      element.style.left = `${constrainedPrimaryLeft}px`;
      element.style.top = `${constrainedPrimaryTop}px`;
    }
  }

  /**
   * Finalizes the drag operation (on mouseup or touchend).
   * If duplicating, creates new elements in the plot state based on the ghost positions.
   * If moving, updates the position(s) of the element(s) in the plot state.
   * Cleans up event listeners, ghost elements, and drag-related state.
   * @param {MouseEvent|TouchEvent} e - The mouseup or touchend event.
   */
  function dragEnd(e) {
    document.body.classList.remove('dragging-on-stage');
    document.body.classList.remove('duplicating-element');

    const stage = document.getElementById('stage');
    const stageRect = stage.getBoundingClientRect();

    if (isDuplicating && ghostElements.length > 0) {
      const newElementIds = [];
      const isMultiSelection = plotState.selectedElements.length > 1;
      const elementId = parseInt(element.getAttribute('data-id'));
      const wasSelectedBeforeDrag = plotState.selectedElements.includes(elementId);

      const duplicatePromises = ghostElements.map((ghostData) => {
        const ghost = ghostData.ghost;
        const source = ghostData.source;
        if (!ghost || !source || !source.getAttribute) {
          console.warn("Invalid ghost or source element in dragEnd.");
          return Promise.resolve();
        }
        const elementId = parseInt(source.getAttribute('data-id'));
        const elementIndex = plotState.elements.findIndex((el) => el.id === elementId);
        if (elementIndex !== -1) {
          const finalLeft = parseInt(window.getComputedStyle(ghost).left);
          const finalTop = parseInt(window.getComputedStyle(ghost).top);
          const maxId = plotState.elements.reduce((max, el) => Math.max(max, el.id), 0);
          const newElementId = maxId + 1;
          newElementIds.push(newElementId);
          const sourceElementData = plotState.elements[elementIndex];
          const newElementData = JSON.parse(JSON.stringify(sourceElementData));
          newElementData.id = newElementId;
          newElementData.x = finalLeft;
          newElementData.y = finalTop;
          newElementData.zIndex = plotState.nextZIndex++;
          plotState.elements.push(newElementData);
          return createPlacedElement(newElementData, plotState);
        }
        return Promise.resolve();
      });

      ghostElements.forEach((ghostData) => {
          if (ghostData.ghost && ghostData.ghost.parentNode) {
              ghostData.ghost.remove();
          }
      });
      ghostElements = [];

      Promise.all(duplicatePromises).then(() => {
        sourceElements.forEach((el) => {
          el.classList.remove('is-being-duplicated');
          el.classList.remove('selected');
        });
        sourceElements = [];
        plotState.selectedElements = [];
        if (isMultiSelection || (wasSelectedBeforeDrag && plotState.selectedElements.length > 0)) {
          newElementIds.forEach((id) => {
            const newDomElement = document.querySelector(`.placed-element[data-id="${id}"]`);
            if (newDomElement) {
              newDomElement.classList.add('selected');
              plotState.selectedElements.push(id);
            }
          });
        }
        updateStageSelectionState(plotState);
        renderElementInfoList(plotState);
        markPlotAsModified(plotState);
      });

    } else if (!isDuplicating) {
      const finalPrimaryLeft = parseInt(window.getComputedStyle(element).left);
      const finalPrimaryTop = parseInt(window.getComputedStyle(element).top);
      if (isDraggingGroup) {
        groupOffsets.forEach((offsetData) => {
          const elementStateIndex = plotState.elements.findIndex((el) => el.id === offsetData.id);
          if (elementStateIndex !== -1) {
            plotState.elements[elementStateIndex].x = finalPrimaryLeft + offsetData.offsetX;
            plotState.elements[elementStateIndex].y = finalPrimaryTop + offsetData.offsetY;
          }
        });
      } else {
        const elementId = parseInt(element.getAttribute('data-id'));
        const elementIndex = plotState.elements.findIndex((el) => el.id === elementId);
        if (elementIndex !== -1) {
          plotState.elements[elementIndex].x = finalPrimaryLeft;
          plotState.elements[elementIndex].y = finalPrimaryTop;
        }
      }
      markPlotAsModified(plotState);
      renderElementInfoList(plotState);
    }

    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('touchmove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchend', dragEnd);

    isDraggingGroup = false;
    isDuplicating = false;
    groupOffsets = [];
  }
}

/**
 * Clears the current element selection state and removes the 'selected' class from DOM elements.
 * @param {Object} plotState - The current plot state object.
 */
function clearElementSelection(plotState) {
  if (!plotState || !Array.isArray(plotState.selectedElements)) {
    console.warn("clearElementSelection called with invalid plotState or selectedElements is not an array. Resetting selection.", plotState);
    if (plotState) {
        plotState.selectedElements = [];
    }
    if (typeof updateStageSelectionState === 'function') {
        updateStageSelectionState(plotState || { selectedElements: [] });
    }
    return;
  }

  plotState.selectedElements.forEach((id) => {
    const el = document.querySelector(`.placed-element[data-id="${id}"]`);
    if (el) {
      el.classList.remove('selected');
    }
  });

  plotState.selectedElements = [];

  if (typeof updateStageSelectionState === 'function') {
      updateStageSelectionState(plotState);
  }
}

/**
 * Brings a specified element to the front by assigning it the highest z-index.
 * Handles z-index reset if the maximum value is approached.
 * @param {number} elementId - The ID of the element to bring to the front.
 * @param {Object} plotState - The current plot state object.
 */
function bringToFront(elementId, plotState) {
  const elementIndex = plotState.elements.findIndex((el) => el.id === elementId);
  if (elementIndex !== -1) {
    const MAX_Z_INDEX = 500;
    if (plotState.nextZIndex >= MAX_Z_INDEX) {
      plotState.elements.sort((a, b) => a.zIndex - b.zIndex);
      plotState.elements.forEach((element, index) => {
        element.zIndex = index + 1;
        const domElement = document.querySelector(`.placed-element[data-id="${element.id}"]`);
        if (domElement) {
          domElement.style.zIndex = element.zIndex;
        }
      });
      plotState.nextZIndex = plotState.elements.length + 1;
    }
    plotState.elements[elementIndex].zIndex = plotState.nextZIndex++;
    const domElement = document.querySelector(`.placed-element[data-id="${elementId}"]`);
    if (domElement) {
      domElement.style.zIndex = plotState.elements[elementIndex].zIndex;
    }
  }
}

/**
 * Updates the visibility and appearance of the "Delete Selected" button based on
 * whether any elements are currently selected. Uses CSS transitions for smooth appearance/disappearance.
 * @param {Object} plotState - The current plot state object.
 */
function updateDeleteSelectedButton(plotState) {
  const deleteSelectedButton = document.getElementById('delete-selected');
  if (!deleteSelectedButton) return;

  if (plotState.selectedElements.length > 0) {
    deleteSelectedButton.classList.remove('hidden');
    void deleteSelectedButton.offsetWidth;
    deleteSelectedButton.classList.add('visible');
  } else {
    deleteSelectedButton.classList.remove('visible');
    const transitionDuration = 300;
    setTimeout(() => {
      if (plotState.selectedElements.length === 0) {
        deleteSelectedButton.classList.add('hidden');
      }
    }, transitionDuration);
  }
}

/**
 * Initiates the process to delete all currently selected elements after confirmation.
 * @param {Object} plotState - The current plot state object.
 */
function deleteSelectedElements(plotState) {
  if (!plotState.selectedElements.length) return;

  const deleteSelectedButton = document.getElementById('delete-selected');
  if (!deleteSelectedButton) return;

  const selectedElementIds = [...plotState.selectedElements];

  setupConfirmButton(
    deleteSelectedButton,
    () => {
      selectedElementIds.forEach((elementId) => {
        deleteElement(elementId, plotState);
      });
      plotState.selectedElements = [];
      updateStageSelectionState(plotState);
    },
    { confirmText: 'Confirm', confirmTitle: 'Cannot undo!', originalText: 'Delete Selected' }
  );
}

/**
 * Initializes the "Delete Selected" button by adding its click handler and setting
 * its initial visibility based on the current selection state.
 * @param {Object} plotState - The current plot state object.
 */
function initDeleteSelectedButton(plotState) {
  const deleteSelectedButton = document.getElementById('delete-selected');
  if (!deleteSelectedButton) return;

  deleteSelectedButton.addEventListener('click', () => {
    deleteSelectedElements(plotState);
  });
  updateDeleteSelectedButton(plotState);
}

/**
 * Opens the element properties modal, populating it with the data of the specified element.
 * @param {number} elementId - The ID of the element whose properties are to be edited.
 * @param {Object} plotState - The current plot state object.
 */
function openPropertiesModal(elementId, plotState) {
  const propsModal = document.getElementById('element-props-modal');
  if (!propsModal) return;

  const elementIndex = plotState.elements.findIndex((el) => el.id === elementId);
  if (elementIndex === -1) return;

  plotState.selectedElement = elementId;

  const form = document.getElementById('element-props-form');
  form.reset();
  document.getElementById('element_index').value = elementIndex;
  document.getElementById('element_label').value = plotState.elements[elementIndex].label || '';
  document.getElementById('element_notes').value = plotState.elements[elementIndex].notes || '';

  openModal(propsModal);
  document.getElementById('element_label').focus();

  form.onsubmit = (e) => {
    e.preventDefault();
    applyElementProperties(plotState);
  };

  document.querySelector('#element-props-form .delete-button').onclick = () => {
    setupConfirmButton(
      document.querySelector('#element-props-form .delete-button'),
      () => {
        deleteElement(elementId, plotState);
        closeModal(propsModal);
      },
      { confirmText: 'Confirm', confirmTitle: 'This is Permanent!', originalText: 'Delete' }
    );
  };
}

/**
 * Applies the properties (label, notes) edited in the modal to the selected element's state and DOM representation.
 * @param {Object} plotState - The current plot state object.
 */
function applyElementProperties(plotState) {
  const propsModal = document.getElementById('element-props-modal');
  const elementIndex = parseInt(document.getElementById('element_index').value);
  const label = document.getElementById('element_label').value.trim();
  const notes = document.getElementById('element_notes').value.trim();

  if (elementIndex < 0 || elementIndex >= plotState.elements.length) return;

  plotState.elements[elementIndex].label = label;
  plotState.elements[elementIndex].notes = notes;

  const elementId = plotState.elements[elementIndex].id;
  const domElement = document.querySelector(`.placed-element[data-id="${elementId}"]`);
  if (domElement) {
    let labelElement = domElement.querySelector('.element-label');
    if (label) {
      if (labelElement) {
        labelElement.textContent = label;
      } else {
        labelElement = document.createElement('div');
        labelElement.className = 'element-label';
        labelElement.textContent = label;
        domElement.appendChild(labelElement);
      }
    } else if (labelElement) {
      labelElement.remove();
    }
  }

  closeModal(propsModal);
  renderElementInfoList(plotState);
  markPlotAsModified(plotState);
  if (plotState.updateInputSuggestions) plotState.updateInputSuggestions();
}

/**
 * Deletes an element from the stage and the plot state, including a visual removal animation.
 * @param {number} elementId - The ID of the element to delete.
 * @param {Object} plotState - The current plot state object.
 */
function deleteElement(elementId, plotState) {
  const domElement = document.querySelector(`.placed-element[data-id="${elementId}"]`);
  if (domElement) {
    const elementIndex = plotState.elements.findIndex((el) => el.id === elementId);
    if (elementIndex !== -1) {
      plotState.elements.splice(elementIndex, 1);
    }
    requestAnimationFrame(() => {
      domElement.classList.add('deleting');
      const handleAnimationEnd = () => {
        domElement.removeEventListener('animationend', handleAnimationEnd);
        domElement.remove();
      };
      domElement.addEventListener('animationend', handleAnimationEnd);
      setTimeout(() => {
        if (document.body.contains(domElement)) {
          domElement.remove();
        }
      }, 400);
    });
  } else {
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
 * Initialize controls related to modals (Save, Load, Properties).
 * Sets up event listeners for opening modals and handling form submissions or actions within them.
 * @param {Object} plotState - The current plot state object.
 */
function initModalControls(plotState) {
  const stage = document.getElementById('stage');
  const saveButton = document.getElementById('save-plot');
  const saveChangesButton = document.getElementById('save-changes');
  const loadButton = document.getElementById('my-plots');
  const saveModal = document.getElementById('save-plot-modal');
  const loadModal = document.getElementById('my-plots-modal');
  const propsModal = document.getElementById('element-props-modal');

  if (saveButton) {
    saveButton.addEventListener('click', () => {
      if (plotState.elements.length > 0) {
        const plotNameInput = document.getElementById('plot_name');
        if (plotNameInput) {
          plotNameInput.value = '';
        }
        openModal(saveModal);
        loadExistingPlotsForOverwrite(plotState);
        const saveForm = document.getElementById('save-new-plot-form');
        const saveNewButton = saveForm ? saveForm.querySelector('#save-new-button') : null;
        if (saveForm && saveNewButton) {
          const newSaveBtn = saveNewButton.cloneNode(true);
          saveNewButton.parentNode.replaceChild(newSaveBtn, saveNewButton);
          saveForm.onsubmit = (e) => { e.preventDefault(); return false; };
          newSaveBtn.addEventListener('click', (e) => {
            e.preventDefault();
            const plotName = document.getElementById('plot_name').value.trim();
            const plotTitle = document.getElementById('plot-title').textContent.trim();
            if (!plotName || plotName === plotTitle) {
              showNotification('Enter a unique plot name.', 'warning');
              return;
            }
            setupConfirmButton(
              newSaveBtn,
              () => { savePlot(true, null, null, null, plotState); },
              { confirmText: 'Confirm Save', confirmTitle: 'This will create a new plot', originalText: 'Save as New', originalTitle: 'Save plot as new' }
            );
          });
        }
      } else {
        showNotification('There is nothing to save!', 'warning');
      }
    });
  }

  if (loadButton) {
    loadButton.addEventListener('click', () => {
      openModal(loadModal);
      loadSavedPlots(plotState);
    });
  }

  document.querySelectorAll('.modal .close-button, .modal .cancel-button').forEach((button) => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = button.closest('.modal');
      closeModal(modal);
    });
  });

  document.querySelectorAll('.modal').forEach((modal) => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeModal(modal);
      }
    });
  });

  if (loadModal) {
    const closeBtn = loadModal.querySelector('.close-button');
    const cancelBtn = loadModal.querySelector('.cancel-button');
    if (closeBtn) closeBtn.addEventListener('click', () => closeModal(loadModal));
    if (cancelBtn) cancelBtn.addEventListener('click', () => closeModal(loadModal));
    loadModal.addEventListener('click', (e) => { if (e.target === loadModal) closeModal(loadModal); });
  }

  if (saveChangesButton) {
    saveChangesButton.addEventListener('click', () => {
      if (plotState.currentPlotId) {
        savePlot(false, plotState.currentPlotId, null, null, plotState);
      }
    });
  }
}

/**
 * Saves the current stage plot data (elements, inputs, metadata) to the database.
 * Can save as a new plot, overwrite an existing plot, or save changes to the currently loaded plot.
 * @param {boolean} [isNew=true] - Indicates if saving as a new plot.
 * @param {number|null} [existingPlotId=null] - The ID of the plot to overwrite (if applicable).
 * @param {string|null} [newName=null] - A new name for the plot when overwriting (if applicable).
 * @param {string|null} [existingName=null] - The original name of the plot being overwritten (if applicable).
 * @param {Object} plotState - The current plot state object.
 */
function savePlot(isNew = true, existingPlotId = null, newName = null, existingName = null, plotState) {
  let plotName;
  if (isNew) {
    plotName = document.getElementById('plot_name').value.trim();
  } else if (newName) {
    plotName = newName;
  } else if (existingName) {
    plotName = existingName;
  } else {
    plotName = plotState.currentPlotName;
  }

  const venueId = document.getElementById('venue_select') ? document.getElementById('venue_select').value : null;
  const eventDateStart = document.getElementById('event_start') ? document.getElementById('event_start').value : null;
  const eventDateEnd = document.getElementById('event_end') ? document.getElementById('event_end').value : null;
  const inputData = [];
  const inputItems = document.querySelectorAll('#input-list .input-item');
  inputItems.forEach((item) => {
    const number = parseInt(item.getAttribute('data-input-number'));
    const labelInput = item.querySelector('input[type="text"]');
    const label = labelInput ? labelInput.value.trim() : '';
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

  if (!isNew && existingPlotId) {
    plotData.plot_id = existingPlotId;
  }

  console.log('Sending plot data:', plotData);

  fetch('/handlers/save_plot.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(plotData),
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        if (isNew) showNotification('New Plot Saved!', 'success');
        else if (newName || existingName) showNotification('Plot Overwritten!', 'success');
        else showNotification('Changes Saved!', 'success');

        if (isNew && data.plot_id) plotState.currentPlotId = data.plot_id;
        else if (!isNew && existingPlotId) plotState.currentPlotId = existingPlotId;

        plotState.currentPlotName = plotData.plot_name;
        const plotTitle = document.getElementById('plot-title');
        if (plotTitle) plotTitle.textContent = plotData.plot_name;

        window.plotState = { ...plotState };
        console.log('window.plotState updated after save:', window.plotState);

        if (typeof initPrintAndShare === 'function') {
          initPrintAndShare(plotState);
          console.log('Print/share module updated after save');
        }

        plotState.isModified = false;
        const saveChangesButton = document.getElementById('save-changes');
        if (saveChangesButton) {
          saveChangesButton.classList.remove('visible');
          setTimeout(() => saveChangesButton.classList.add('hidden'), 300);
        }
        const saveModal = document.getElementById('save-plot-modal');
        closeModal(saveModal);
        const plotNameInput = document.getElementById('plot_name');
        if (plotNameInput) plotNameInput.value = '';
        saveStateToStorage(plotState);
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
 * Loads the list of existing saved plots into the "Overwrite" section of the save modal.
 * @param {Object} plotState - The current plot state object.
 */
function loadExistingPlotsForOverwrite(plotState) {
  const plotsList = document.querySelector('.existing-plots-list');
  if (!plotsList) return;

  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.innerHTML = '<p class="loading-message">Loading your saved plots...</p>';
  loadingOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.8);display:flex;align-items:center;justify-content:center;';
  plotsList.style.position = 'relative';
  plotsList.appendChild(loadingOverlay);
  plotsList.innerHTML = '<p class="loading-message">Loading your saved plots...</p>';

  fetch('/handlers/get_plots.php')
    .then((response) => response.json())
    .then((data) => {
      if (loadingOverlay.parentNode === plotsList) plotsList.removeChild(loadingOverlay);
      if (data.plots && data.plots.length > 0) {
        let html = '<ul class="plots-list">';
        data.plots.forEach((plot) => {
          const formattedDate = plot.event_date_start ? new Date(plot.event_date_start).toLocaleDateString() : 'No date';
          html += `<li class="plot-item">
            <div class="plot-info">
              <div class="plot-name">${plot.plot_name}</div>
              <div class="plot-details">
                <span class="venue">${plot.venue_name}</span><span class="date">${formattedDate}</span>
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

        document.querySelectorAll('.overwrite-btn').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const plotId = btn.getAttribute('data-plot-id');
            const plotName = btn.getAttribute('data-plot-name');
            const newNameInput = document.getElementById('plot_name');
            const newName = newNameInput && newNameInput.value.trim() ? newNameInput.value.trim() : null;
            setupConfirmButton(
              btn,
              () => { savePlot(false, plotId, newName, plotName, plotState); },
              { confirmText: 'Confirm', originalText: 'Overwrite' }
            );
          });
        });

        document.querySelectorAll('.existing-plots-list .delete-plot-btn').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            const plotId = btn.getAttribute('data-plot-id');
            setupConfirmButton(
              btn,
              () => { deletePlot(plotId, true, plotState); },
              { confirmText: 'Delete', confirmTitle: 'This is permanent!', originalTitle: 'Delete plot', stopPropagation: true, event: e }
            );
          });
        });
      } else {
        plotsList.innerHTML = '<p class="no-plots-message">You have no saved plots.</p>';
      }
    })
    .catch((error) => {
      if (loadingOverlay.parentNode === plotsList) plotsList.removeChild(loadingOverlay);
      console.error('Error loading plots:', error);
      plotsList.innerHTML = '<p class="error-message">Error loading plots. Please try again.</p>';
    });
}

/**
 * Loads the list of saved plots into the "Load Plot" modal.
 * @param {Object} plotState - The current plot state object.
 */
function loadSavedPlots(plotState) {
  const plotsList = document.querySelector('.saved-plots-list');
  if (!plotsList) return;

  const loadingOverlay = document.createElement('div');
  loadingOverlay.className = 'loading-overlay';
  loadingOverlay.innerHTML = '<p class="loading-message">Loading your saved plots...</p>';
  loadingOverlay.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;background:rgba(255,255,255,0.8);display:flex;align-items:center;justify-content:center;';
  plotsList.style.position = 'relative';
  plotsList.appendChild(loadingOverlay);
  plotsList.innerHTML = '<p class="loading-message">Loading your saved plots...</p>';

  fetch('/handlers/get_plots.php')
    .then((response) => {
      if (!response.ok) throw new Error('Network response was not ok');
      return response.json();
    })
    .then((data) => {
      if (loadingOverlay.parentNode === plotsList) plotsList.removeChild(loadingOverlay);
      if (data.plots && data.plots.length > 0) {
        let html = '<ul class="plots-list">';
        data.plots.forEach((plot) => {
          const formattedDate = plot.event_date_start ? new Date(plot.event_date_start).toLocaleDateString() : 'No date';
          html += `<li class="plot-item">
            <div class="plot-info">
              <div class="plot-name">${plot.plot_name}</div>
              <div class="plot-details">
                <span class="venue">${plot.venue_name}</span><span class="date">${formattedDate}</span>
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

        document.querySelectorAll('.load-plot-btn').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const plotId = btn.getAttribute('data-plot-id');
            if (plotState.elements.length > 0) {
              setupConfirmButton(
                btn,
                () => { loadPlot(plotId, plotState); },
                { confirmText: 'Confirm', confirmTitle: 'This will replace your current stage', originalText: 'Load', originalTitle: 'Load plot', stopPropagation: true, event: e }
              );
            } else {
              loadPlot(plotId, plotState);
            }
          });
        });

        document.querySelectorAll('.saved-plots-list .delete-plot-btn').forEach((btn) => {
          btn.addEventListener('click', (e) => {
            const plotId = btn.getAttribute('data-plot-id');
            setupConfirmButton(
              btn,
              () => { deletePlot(plotId, true, plotState); },
              { confirmText: 'Delete', confirmTitle: 'This is permanent!', originalTitle: 'Delete plot', stopPropagation: true, event: e }
            );
          });
        });
      } else {
        plotsList.innerHTML = '<p class="no-plots-message">You have no saved plots.</p>';
      }
    })
    .catch((error) => {
      if (loadingOverlay.parentNode === plotsList) plotsList.removeChild(loadingOverlay);
      console.error('Error loading plots:', error);
      plotsList.innerHTML = '<p class="error-message">Error loading plots. Please try again.</p>';
    });
}

/**
 * Loads a specific plot's data from the server and updates the stage and state.
 * Clears the current stage, updates metadata (title, venue, dates), loads elements and inputs.
 * @param {number} plotId - The ID of the plot to load.
 * @param {Object} plotState - The current plot state object.
 */
function loadPlot(plotId, plotState) {
  fetch(`/handlers/get_plot.php?id=${plotId}`)
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        plotState.isLoading = true;
        clearElements(plotState);
        plotState.selectedElements = [];
        updateStageSelectionState(plotState);
        if (plotState.clearInputList) plotState.clearInputList();

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

        const elementPromises = (data.elements || []).map((element, index) => {
          const elementData = {
            id: index + 1,
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
            plotState.nextZIndex = Math.max(1, ...plotState.elements.map((el) => el.zIndex)) + 1;
            plotState.isLoading = false;
            console.log('Finished loading elements.');

            window.plotState = { ...plotState };
            console.log('window.plotState synchronized after plot load:', window.plotState);

            if (typeof initPrintAndShare === 'function') {
              initPrintAndShare(plotState);
              console.log('Print/share module updated with new plot state');
            }

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
 * Update the custom dropdown UI (selected text, option classes) to match the
 * selected value in the underlying native select element.
 * @param {HTMLSelectElement} selectElement - The native select element that changed.
 */
function updateCustomDropdown(selectElement) {
  if (!selectElement) return;
  const customDropdown = document.querySelector(`.custom-dropdown [data-id="${selectElement.id}"]`) || document.querySelector(`.custom-dropdown select[id="${selectElement.id}"]`).closest('.custom-dropdown');
  if (!customDropdown) return;

  const selectedOption = selectElement.options[selectElement.selectedIndex];
  const selectedText = selectedOption ? selectedOption.textContent : '';
  const selectedDisplay = customDropdown.querySelector('.selected-option');
  if (selectedDisplay) {
    selectedDisplay.textContent = selectedText;
    if (selectedText) selectedDisplay.classList.remove('placeholder');
    else selectedDisplay.classList.add('placeholder');
  }

  const options = customDropdown.querySelectorAll('.custom-dropdown-option');
  options.forEach((option) => {
    option.classList.remove('selected');
    if (option.getAttribute('data-value') === selectElement.value) {
      option.classList.add('selected');
    }
  });
}

/**
 * Updates the UI state (buttons, modified flag) typically after a plot is loaded or saved.
 * @param {Object} plotState - The current plot state object.
 */
function updatePlotUIState(plotState) {
  const saveButton = document.getElementById('save-plot');
  if (saveButton) saveButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';

  const saveChangesButton = document.getElementById('save-changes');
  if (saveChangesButton) saveChangesButton.classList.add('hidden');

  plotState.isModified = false;
}

/**
 * Updates the favorites state and UI based on data received from the server (e.g., after loading a plot).
 * @param {Object} plotState - The current plot state object.
 * @param {Array} favorites - An array of favorite element data objects from the server.
 */
function updateFavoritesFromServer(plotState, favorites) {
  if (!favorites) return;

  plotState.favorites = favorites.map((fav) => parseInt(fav.element_id));
  plotState.favoritesData = favorites;
  updateFavoritesCategory(plotState);

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
 * Loads placed elements onto the stage based on data typically retrieved from the server.
 * Clears existing elements, updates plot state, and creates new DOM elements.
 * @param {Array} elements - Array of element data objects from the server/saved state.
 * @param {Object} plotState - The current plot state object.
 */
function loadPlacedElements(elements, plotState) {
  const stage = document.getElementById('stage');
  if (!stage) return;

  const stageWidth = parseInt(stage.getAttribute('data-stage-width')) || 20;
  const stageDepth = parseInt(stage.getAttribute('data-stage-depth')) || 15;
  const dimensions = calculateStageDimensions(stageWidth, stageDepth);

  const placedElements = stage.querySelectorAll('.placed-element');
  placedElements.forEach((element) => element.remove());

  const nextZ = plotState.nextZIndex;
  plotState.elements = [];
  plotState.nextZIndex = nextZ;

  elements.forEach((element, index) => {
    const elementData = {
      id: index + 1,
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
    plotState.elements.push(elementData);
    createPlacedElement(elementData, plotState);
    plotState.nextZIndex = Math.max(plotState.nextZIndex, element.z_index + 1);
  });
}

/**
 * Initializes the "Load Plot" modal button listener.
 * @param {Object} plotState - The current plot state object.
 */
function initLoadPlotModal(plotState) {
  const loadButton = document.getElementById('my-plots');
  const loadModal = document.getElementById('my-plots-modal');
  if (loadButton && loadModal) {
    loadButton.addEventListener('click', () => {
      openModal(loadModal);
      loadSavedPlots(plotState);
    });
  }
}

/**
 * Deletes a saved plot from the database after confirmation.
 * Reloads the plot lists in relevant modals and clears the stage if the deleted plot was currently loaded.
 * @param {number} plotId - The ID of the plot to delete.
 * @param {boolean} [confirmed=false] - Flag indicating if user confirmation was received (used internally by confirmation handler).
 * @param {Object} plotState - The current plot state object.
 */
function deletePlot(plotId, confirmed = false, plotState) {
  if (!confirmed) return;

  const formData = new FormData();
  formData.append('plot_id', plotId);

  fetch('/handlers/delete_plot.php', {
    method: 'POST',
    body: formData,
  })
    .then((response) => response.json())
    .then((data) => {
      if (data.success) {
        showNotification('Plot deleted!', 'success');
        if (plotState.currentPlotId && plotState.currentPlotId == plotId) {
          clearElements(plotState);
        }
        loadSavedPlots(plotState);
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
 * Initializes page navigation handlers to save the current state to localStorage
 * before the user navigates away or closes the page, if there are unsaved changes.
 * @param {Object} plotState - The current plot state object.
 */
function initPageNavigation(plotState) {
  window.addEventListener('beforeunload', function (e) {
    if (plotState.elements.length > 0 && (plotState.isModified || !plotState.currentPlotId)) {
      saveStateToStorage(plotState);
    }
  });

  document.querySelectorAll('nav a').forEach((link) => {
    link.addEventListener('click', function (e) {
      if (this.classList.contains('active')) return;
      saveStateToStorage(plotState);
    });
  });
}

/**
 * Saves the relevant current plot state (elements, inputs, metadata) to browser localStorage.
 * @param {Object} plotState - The current plot state object containing data to save.
 */
function saveStateToStorage(plotState) {
  const stage = document.getElementById('stage');
  if (!stage) return;

  try {
    const stateToSave = {
      elements: plotState.elements,
      inputs: plotState.inputs || [],
      nextZIndex: plotState.nextZIndex,
      currentPlotName: plotState.currentPlotName,
      currentPlotId: plotState.currentPlotId,
      isModified: plotState.isModified,
      venueId: document.getElementById('venue_select') ? document.getElementById('venue_select').value : null,
      eventStart: document.getElementById('event_start') ? document.getElementById('event_start').value : null,
      eventEnd: document.getElementById('event_end') ? document.getElementById('event_end').value : null,
    };
    localStorage.setItem('stageplot_state', JSON.stringify(stateToSave));
  } catch (e) {
    console.error('Error saving state to localStorage:', e);
  }
}

/**
 * Restores the plot state from browser localStorage if previously saved state exists.
 * Updates the UI (elements, inputs, metadata) to match the restored state.
 * @param {Object} plotState - The current plot state object to populate with restored data.
 * @returns {boolean} True if state was successfully restored, false otherwise.
 */
function restoreStateFromStorage(plotState) {
  const stage = document.getElementById('stage');
  if (!stage) return false;

  try {
    const savedState = localStorage.getItem('stageplot_state');
    if (!savedState) return false;

    const state = JSON.parse(savedState);

    if ((state.elements && state.elements.length > 0) || (state.inputs && state.inputs.length > 0)) {
      const plotTitle = document.getElementById('plot-title');
      if (plotTitle && state.currentPlotName) {
        plotTitle.textContent = state.currentPlotName;
      } else if (plotTitle) {
        plotTitle.textContent = state.currentPlotId ? 'Restored Plot' : 'Unsaved Work';
      }

      plotState.elements = [];
      plotState.nextZIndex = state.nextZIndex || 1;
      plotState.currentPlotName = state.currentPlotName;
      plotState.currentPlotId = state.currentPlotId;
      plotState.isModified = state.isModified;
      plotState.inputs = state.inputs || [];
      if (plotState.renderInputList) {
        plotState.renderInputList(plotState.inputs);
      }

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

      if (eventStartInput && state.eventStart) eventStartInput.value = state.eventStart;
      if (eventEndInput && state.eventEnd) {
        eventEndInput.value = state.eventEnd;
        if (eventStartInput && eventStartInput.value) eventEndInput.min = eventStartInput.value;
      }

      const saveButton = document.getElementById('save-plot');
      if (saveButton && state.currentPlotId) saveButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';
      const saveChangesButton = document.getElementById('save-changes');
      if (saveChangesButton && state.isModified) {
        saveChangesButton.classList.remove('hidden');
        saveChangesButton.classList.add('visible');
      }

      plotState.isLoading = true;
      const elementPromises = (state.elements || []).map((elementData) => {
        if (elementData.id === undefined) elementData.id = plotState.elements.length + 1;
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
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error restoring state from localStorage:', e);
    localStorage.removeItem('stageplot_state');
    return false;
  }
}

/**
 * Sets up MutationObserver and event listeners to track changes to the stage elements,
 * venue selection, or event dates, marking the plot as modified if necessary.
 * @param {Object} plotState - The current plot state object.
 */
function setupChangeTracking(plotState) {
  const stage = document.getElementById('stage');
  if (!stage) return;

  const observer = new MutationObserver((mutations) => {
    if (plotState.isLoading) return;
    const relevantMutations = mutations.some((mutation) => (mutation.type === 'childList' && (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) && (Array.from(mutation.addedNodes).some((node) => node.classList?.contains('placed-element')) || Array.from(mutation.removedNodes).some((node) => node.classList?.contains('placed-element')))) || (mutation.type === 'attributes' && mutation.target.classList?.contains('placed-element') && mutation.attributeName === 'style'));
    if (relevantMutations) markPlotAsModified(plotState);
  });

  observer.observe(stage, { childList: true, attributes: true, attributeFilter: ['style'], subtree: true });

  const venueSelect = document.getElementById('venue_select');
  const eventStartInput = document.getElementById('event_start');
  const eventEndInput = document.getElementById('event_end');

  if (eventStartInput) {
    eventStartInput.addEventListener('change', () => {
      if (plotState && plotState.currentPlotId && !plotState.isLoading) {
        markPlotAsModified(plotState);
      }
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

  if (eventEndInput) {
    eventEndInput.addEventListener('change', () => {
      if (plotState && plotState.currentPlotId && !plotState.isLoading) {
        markPlotAsModified(plotState);
      }
      if (eventStartInput) {
        if (eventStartInput.value && eventEndInput.value < eventStartInput.value) {
          showNotification('End date cannot be before start date.', 'warning');
          eventEndInput.value = eventStartInput.value;
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
 * Initializes the main plot control buttons (Clear Stage, New Plot) with confirmation dialogs.
 * @param {Object} plotState - The current plot state object.
 */
function initPlotControls(plotState) {
  const clearButton = document.getElementById('clear-plot');
  const newPlotButton = document.getElementById('new-plot');

  if (clearButton) {
    clearButton.addEventListener('click', () => {
      setupConfirmButton(
        clearButton,
        () => {
          clearElements(plotState);
          showNotification('Stage cleared!', 'success');
        },
        { confirmText: 'Clear Stage', confirmTitle: 'Clear all placed elements', originalTitle: 'Clear Stage', originalText: '<i class="fa-solid fa-trash"></i>' }
      );
    });
  }

  if (newPlotButton) {
    newPlotButton.addEventListener('click', () => {
      setupConfirmButton(
        newPlotButton,
        () => { newPlot(plotState); },
        { confirmText: 'New Plot', confirmTitle: 'You will lose unsaved changes', originalTitle: 'New Plot', originalText: '<i class="fa-solid fa-file-circle-plus"></i>' }
      );
    });
  }
}

/**
 * Sets up the initial state for a new, empty plot, including default stage dimensions and dates.
 * @param {Object} plotState - The current plot state object.
 */
function setupInitialState(plotState) {
  const stage = document.getElementById('stage');
  const eventStartInput = document.getElementById('event_start');
  const eventEndInput = document.getElementById('event_end');

  if (stage) {
    const stageWidth = parseInt(stage.getAttribute('data-stage-width')) || 20;
    const stageDepth = parseInt(stage.getAttribute('data-stage-depth')) || 15;
    const dimensions = calculateStageDimensions(stageWidth, stageDepth);
    updateStageDimensions(dimensions, stage);
    updateStageForVenue(null, plotState, true);
  }

  if (eventStartInput && eventEndInput) {
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0];
    eventStartInput.value = formattedDate;
    eventEndInput.value = formattedDate;
  }

  const plotTitle = document.getElementById('plot-title');
  if (plotTitle) plotTitle.textContent = 'New Plot';
}

/**
 * Sets up the event listener for the venue selection dropdown.
 * @param {Object} plotState - The current plot state object.
 */
function setupVenueSelectHandler(plotState) {
  const venueSelect = document.getElementById('venue_select');
  if (!venueSelect) return;
  venueSelect.addEventListener('change', () => {
    updateStageForVenue(venueSelect.value, plotState, false);
  });
}

/**
 * Updates the stage dimensions and venue info panel based on the selected venue ID.
 * Fetches venue details (including stage dimensions) from the server.
 * @param {string|null} venueValue - The value from the venue select dropdown (e.g., '123' or 'user_45'). Null clears the venue.
 * @param {Object} plotState - The current plot state object.
 * @param {boolean} [isRestoring=false] - Flag indicating if this update is part of a state restoration process (to suppress modification marking).
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

  const showNoVenueInfo = () => {
    const dimensions = calculateStageDimensions(20, 15);
    updateStageDimensions(dimensions, stage);
    detailsDiv.style.display = 'none';
    noVenueMsg.style.display = 'block';
    venueNameEl.textContent = 'N/A';
    venueAddressEl.textContent = 'N/A';
    venueStageEl.textContent = 'N/A';
    if (!isRestoring && plotState.currentPlotId && !plotState.isLoading) {
      markPlotAsModified(plotState);
    }
  };

  if (!venueValue) {
    showNoVenueInfo();
    return;
  }

  let venueId, isUserVenue = false;
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

        detailsDiv.style.display = 'block';
        noVenueMsg.style.display = 'none';
        if (!isRestoring && plotState.currentPlotId && !plotState.isLoading) {
          markPlotAsModified(plotState);
        }
      } else {
        console.error('Failed to get venue data:', data.error);
        showNoVenueInfo();
      }
    })
    .catch((error) => {
      console.error('Error fetching venue:', error);
      showNoVenueInfo();
    });
}

/**
 * Sets up event listeners for the event start and end date inputs to mark the plot as modified on change.
 * @param {Object} plotState - The current plot state object.
 */
function setupDateHandlers(plotState) {
  const eventStartInput = document.getElementById('event_start');
  const eventEndInput = document.getElementById('event_end');

  if (eventStartInput) {
    eventStartInput.addEventListener('change', () => {
      if (plotState.currentPlotId) markPlotAsModified(plotState);
    });
  }
  if (eventEndInput) {
    eventEndInput.addEventListener('change', () => {
      if (plotState.currentPlotId) markPlotAsModified(plotState);
    });
  }
}

/**
 * Initializes the category filter dropdown listener to show/hide element categories.
 */
function initCategoryFilter() {
  const categoryFilter = document.getElementById('category-filter');
  if (!categoryFilter) return;

  categoryFilter.addEventListener('change', () => {
    const categoryId = categoryFilter.value;
    const elementsPanel = document.getElementById('elements-list');
    if (!elementsPanel) return;

    if (categoryId === '0') {
      document.querySelectorAll('.category-section').forEach((section) => {
        section.style.display = '';
      });
    } else {
      document.querySelectorAll('.category-section').forEach((section) => {
        section.style.display = 'none';
      });
      const selectedSection = elementsPanel.querySelector(`.category-section[data-category-id="${categoryId}"]`);
      if (selectedSection) {
        selectedSection.style.display = '';
        const header = selectedSection.querySelector('.accordion-header');
        if (header && !header.classList.contains('active')) {
          header.click();
        }
      }
    }
  });
  moveFavoritesToTop();
}

/**
 * Marks the plot as modified and updates the UI accordingly (e.g., shows the "Save Changes" button).
 * Does nothing if the plot is currently loading.
 * @param {Object} plotState - The current plot state object.
 */
function markPlotAsModified(plotState) {
  if (plotState.isLoading) return;

  const saveChangesButton = document.getElementById('save-changes');
  if (!plotState.isModified && plotState.currentPlotId !== null) {
    plotState.isModified = true;
    console.log('Marking plot as modified.');
    if (saveChangesButton) {
      saveChangesButton.classList.remove('hidden');
      setTimeout(() => { saveChangesButton.classList.add('visible'); }, 10);
    }
  }
}

/**
 * Clears only the placed elements from the stage DOM and the plot state.
 * Resets selection and input list. Marks plot as modified if applicable.
 * @param {Object} plotState - The current plot state object.
 */
function clearElements(plotState) {
  const stage = document.getElementById('stage');
  if (!stage) return;

  const placedElements = stage.querySelectorAll('.placed-element');
  placedElements.forEach((element) => element.remove());

  plotState.elements = [];
  plotState.nextZIndex = 1;
  plotState.selectedElement = null;
  plotState.selectedElements = [];
  updateStageSelectionState(plotState);
  if (plotState.clearInputList) plotState.clearInputList();
  renderElementInfoList(plotState);
  if (plotState.currentPlotId) markPlotAsModified(plotState);
}

/**
 * Resets the entire editor to a new, blank plot state.
 * Clears elements, inputs, metadata, resets UI buttons/titles, clears localStorage state, and sets default dates/venue.
 * @param {Object} plotState - The current plot state object.
 */
function newPlot(plotState) {
  const saveButton = document.getElementById('save-plot');
  const saveChangesButton = document.getElementById('save-changes');
  const venueSelect = document.getElementById('venue_select');
  const eventStartInput = document.getElementById('event_start');
  const eventEndInput = document.getElementById('event_end');
  const plotTitle = document.getElementById('plot-title');

  clearElements(plotState);
  plotState.selectedElements = [];
  updateStageSelectionState(plotState);
  renderElementInfoList(plotState);

  plotState.currentPlotName = null;
  plotState.currentPlotId = null;
  plotState.isModified = false;

  if (plotTitle) plotTitle.textContent = 'New Plot';
  if (saveButton) saveButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';
  if (saveChangesButton) {
    saveChangesButton.classList.remove('visible');
    setTimeout(() => saveChangesButton.classList.add('hidden'), 300);
  }

  try {
    localStorage.removeItem('stageplot_state');
  } catch (e) {
    console.error('Error clearing state from localStorage:', e);
  }

  if (eventStartInput && eventEndInput) {
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0];
    eventStartInput.value = formattedDate;
    eventEndInput.value = formattedDate;
    eventEndInput.min = formattedDate;
  }

  if (venueSelect) {
    venueSelect.value = '';
    updateCustomDropdown(venueSelect);
    updateStageForVenue(null, plotState, false);
  }
  showNotification('New plot created!', 'success');
}

/**
 * Initializes the stage grid functionality, including toggle buttons for visibility
 * and detail level, grid overlay creation/update, and persistence of grid state
 * in localStorage.
 */
function initStageGrid() {
  const stage = document.getElementById('stage');
  if (!stage) return;

  const savedGridVisible = localStorage.getItem('gridVisible') === 'true';
  const savedDetailedGrid = localStorage.getItem('detailedGrid') !== 'false';

  if (stage.querySelector('#grid-toggle')) return;

  const gridToggle = document.createElement('button');
  gridToggle.id = 'grid-toggle';
  gridToggle.className = 'grid-button';
  gridToggle.innerHTML = '<i class="fa-solid fa-border-all"></i>';
  gridToggle.title = "Toggle Grid (5' squares)";

  const gridTypeToggle = document.createElement('button');
  gridTypeToggle.id = 'grid-type-toggle';
  gridTypeToggle.className = 'grid-button';
  gridTypeToggle.innerHTML = '<i class="fa-solid fa-ruler"></i>';
  gridTypeToggle.title = 'Toggle Detail Level';

  let gridOverlay = stage.querySelector('.grid-overlay');
  if (!gridOverlay) {
    gridOverlay = document.createElement('div');
    gridOverlay.className = 'grid-overlay';
    stage.appendChild(gridOverlay);
  }

  const stageWidth = parseInt(stage.getAttribute('data-stage-width')) || 20;
  const stageDepth = parseInt(stage.getAttribute('data-stage-depth')) || 15;
  const dimensions = calculateStageDimensions(stageWidth, stageDepth);

  stage.appendChild(gridToggle);
  stage.appendChild(gridTypeToggle);

  let gridVisible = savedGridVisible;
  let detailedGrid = savedDetailedGrid;

  /**
   * Updates the grid overlay's appearance (visibility, line style) based on current state.
   */
  function updateGridDisplay() {
    gridOverlay.style.opacity = gridVisible ? '1' : '0';
    if (gridVisible) gridToggle.classList.add('active');
    else gridToggle.classList.remove('active');

    const currentStageWidth = parseInt(stage.getAttribute('data-stage-width')) || 20;
    const currentStageDepth = parseInt(stage.getAttribute('data-stage-depth')) || 15;
    const currentDimensions = calculateStageDimensions(currentStageWidth, currentStageDepth);
    updateGridOverlay(currentDimensions, stage);

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
      gridTypeToggle.classList.add('active');
    } else {
      gridOverlay.style.backgroundImage = `
              linear-gradient(to right, rgba(82, 108, 129, 0.15) 1px, transparent 1px),
              linear-gradient(to bottom, rgba(82, 108, 129, 0.15) 1px, transparent 1px)
          `;
      gridOverlay.style.backgroundSize = `
              ${currentDimensions.gridSize}px ${currentDimensions.gridSize}px,
              ${currentDimensions.gridSize}px ${currentDimensions.gridSize}px
          `;
      gridTypeToggle.classList.remove('active');
    }

    const icon = gridTypeToggle.querySelector('i');
    if (icon) {
      icon.style.transition = 'transform 0.3s ease';
      icon.style.transform = detailedGrid ? 'rotate(0deg)' : 'rotate(90deg)';
    }
  }

  updateGridDisplay();

  gridToggle.addEventListener('click', () => {
    gridVisible = !gridVisible;
    updateGridDisplay();
    localStorage.setItem('gridVisible', gridVisible);
  });

  gridTypeToggle.addEventListener('click', () => {
    if (!gridVisible) gridVisible = true;
    detailedGrid = !detailedGrid;
    updateGridDisplay();
    localStorage.setItem('detailedGrid', detailedGrid);
    localStorage.setItem('gridVisible', gridVisible);
  });

  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.type === 'attributes' && (mutation.attributeName === 'data-stage-width' || mutation.attributeName === 'data-stage-depth')) {
        updateGridDisplay();
      }
    });
  });
  observer.observe(stage, { attributes: true });
}

/**
 * Checks the URL for a 'load' parameter and attempts to load the specified plot ID if found.
 * Removes the parameter from the URL after attempting the load.
 * @param {Object} plotState - The current plot state object.
 */
function checkUrlParameters(plotState) {
  const urlParams = new URLSearchParams(window.location.search);
  const loadPlotId = urlParams.get('load');
  if (loadPlotId) {
    loadPlot(loadPlotId, plotState);
    const newUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
    window.history.replaceState({ path: newUrl }, '', newUrl);
  }
}

/**
 * Initializes the input list section, including adding/removing lines,
 * handling input changes, providing suggestions based on placed elements,
 * and integrating with the main plot state.
 * @param {Object} plotState - The current plot state object.
 */
function initInputList(plotState) {
  const inputListContainer = document.getElementById('input-list');
  const addButton = document.getElementById('add-input-line');
  const inputSuggestions = document.getElementById('input-suggestions');

  if (!inputListContainer || !addButton) {
    console.warn('Input list elements not found, skipping initialization.');
    return;
  }

  /**
   * Updates the datalist options for input suggestions based on current element names and labels.
   */
  function updateInputSuggestions() {
    if (!inputSuggestions) return;
    inputSuggestions.innerHTML = '';
    const suggestions = new Set();
    plotState.elements.forEach((element) => {
      if (element.elementName) suggestions.add(element.elementName);
      if (element.label && element.label.trim() !== '') suggestions.add(element.label);
      if (element.elementName && element.label && element.label.trim() !== '') {
        suggestions.add(`${element.elementName} - ${element.label}`);
      }
    });
    suggestions.forEach((suggestion) => {
      const option = document.createElement('option');
      option.value = suggestion;
      inputSuggestions.appendChild(option);
    });
  }

  /**
   * Adds a single input line item to the DOM.
   * @param {number} number - The input number (e.g., 1 for A1).
   * @param {string} [label=''] - The initial label value for the input.
   */
  function addInputLineDOM(number, label = '') {
    const inputItem = document.createElement('div');
    inputItem.className = 'input-item';
    inputItem.setAttribute('data-input-number', number);

    const numberSpan = document.createElement('span');
    numberSpan.className = 'input-number';
    numberSpan.textContent = `A${number}.`;

    const labelInput = document.createElement('input');
    labelInput.type = 'text';
    labelInput.name = `input_label_A${number}`;
    labelInput.id = `input_label_A${number}`;
    labelInput.placeholder = `Input A${number} Label`;
    labelInput.value = label;
    labelInput.maxLength = 50;
    labelInput.setAttribute('list', 'input-suggestions');

    labelInput.addEventListener('input', () => {
      const inputData = plotState.inputs.find((inp) => inp.number === number);
      if (inputData) inputData.label = labelInput.value;
      else plotState.inputs.push({ number: number, label: labelInput.value });
      markPlotAsModified(plotState);
    });

    inputItem.appendChild(numberSpan);
    inputItem.appendChild(labelInput);
    inputListContainer.appendChild(inputItem);
  }

  /**
   * Renders the entire input list based on the provided inputs array.
   * Ensures a minimum number of lines are displayed.
   * @param {Array} inputs - Array of input objects ({ number: number, label: string }).
   */
  function renderInputList(inputs) {
    inputListContainer.innerHTML = '';
    const maxInputs = Math.max(6, inputs.length);
    for (let i = 1; i <= maxInputs; i++) {
      const inputData = inputs.find((inp) => inp.number === i);
      addInputLineDOM(i, inputData ? inputData.label : '');
    }
    updateInputSuggestions();
  }

  addButton.addEventListener('click', () => {
    const currentCount = inputListContainer.children.length;
    const nextNumber = currentCount + 1;
    addInputLineDOM(nextNumber);
    if (!plotState.inputs) plotState.inputs = [];
    plotState.inputs.push({ number: nextNumber, label: '' });
    markPlotAsModified(plotState);
  });

  if (!plotState.inputs) plotState.inputs = [];
  renderInputList(plotState.inputs);

  plotState.renderInputList = renderInputList;
  plotState.clearInputList = () => {
    plotState.inputs = [];
    renderInputList([]);
  };
  plotState.updateInputSuggestions = updateInputSuggestions;
  updateInputSuggestions();
}

/**
 * Renders the list of currently placed elements in the "Element Info" panel.
 * Displays element name, label (if any), and notes (if any).
 * @param {Object} plotState - The current plot state object.
 */
function renderElementInfoList(plotState) {
  const listContainer = document.getElementById('element-info-list');
  if (!listContainer) return;

  listContainer.innerHTML = '';

  if (plotState.elements.length === 0) {
    const noElementsMsg = document.createElement('li');
    noElementsMsg.className = 'no-elements-message';
    noElementsMsg.textContent = 'No elements placed yet.';
    listContainer.appendChild(noElementsMsg);
    return;
  }

  const sortedElements = [...plotState.elements].sort((a, b) => a.zIndex - b.zIndex);

  sortedElements.forEach((elementData) => {
    const listItem = document.createElement('li');
    listItem.className = 'element-info-item';
    listItem.setAttribute('data-id', elementData.id);

    const nameSpan = document.createElement('span');
    nameSpan.className = 'element-info-name';
    nameSpan.textContent = elementData.elementName;
    listItem.appendChild(nameSpan);

    if (elementData.label) {
      const labelSpan = document.createElement('span');
      labelSpan.className = 'element-info-item-label';
      labelSpan.textContent = ` - ${elementData.label}`;
      nameSpan.appendChild(labelSpan);
    }

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
 * Initializes event listeners for the element info list.
 * Clicking an item opens the properties modal for that element.
 * @param {Object} plotState - The current plot state object.
 */
function initElementInfoListEvents(plotState) {
  const listContainer = document.getElementById('element-info-list');
  if (!listContainer) return;

  listContainer.addEventListener('click', (event) => {
    const listItem = event.target.closest('.element-info-item');
    if (listItem) {
      const elementId = parseInt(listItem.getAttribute('data-id'));
      if (!isNaN(elementId)) {
        openPropertiesModal(elementId, plotState);
      }
    }
  });
}


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
window.updateDeleteSelectedButton = updateDeleteSelectedButton;
window.deleteSelectedElements = deleteSelectedElements;
window.initDeleteSelectedButton = initDeleteSelectedButton;
window.updateStageSelectionState = updateStageSelectionState;
window.initShiftCursorStyle = initShiftCursorStyle;
window.initElementsAccordion = initElementsAccordion;
