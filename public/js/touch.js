/**
 * StageWrite Touch Interaction Module
 * Handles touch-based dragging and tapping for the stage plotter.
 */

/**
 * Main initialization function for touch interactions.
 * Detects touch support and adds relevant listeners if detected.
 */
function initTouchInteraction() {
  console.log('Initializing Touch Interaction...');

  // Ensure plotState is available
  if (!window.plotState) {
    console.warn('plotState not found. Touch interactions cannot be initialized.');
    return;
  }

  // Detect touch device
  detectTouchDevice(window.plotState);

  if (window.plotState.isTouchDevice) {
    console.log('Touch device detected. Setting up touch listeners.');
    document.body.classList.add('touch-detected');

    // Initialize dragging from the elements list
    initTouchDragFromList(window.plotState);

    // Initialize dragging and tapping for elements already on the stage
    initTouchOnStageElements(window.plotState);

    // Override console logging to disable during touch drag
    overrideConsoleDuringDrag();
  } else {
    console.log('No touch device detected. Skipping touch listener setup.');
  }
}

/**
 * Detects if the device supports touch events.
 * @param {Object} plotState - The global plot state object.
 */
function detectTouchDevice(plotState) {
  plotState.isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  console.log('Touch device detected:', plotState.isTouchDevice);
}

/**
 * Initializes touch dragging for elements FROM the list TO the stage.
 * @param {Object} plotState - The global plot state object.
 */
function initTouchDragFromList(plotState) {
  const elementsList = document.getElementById('elements-list');
  const stage = document.getElementById('stage');
  let touchDragElement = null; // The visual clone being dragged
  let originalElement = null; // The source element in the list
  let touchStartX, touchStartY;
  let initialOffsetX, initialOffsetY; // Offset within the dragged element

  if (!elementsList || !stage) {
    console.warn('Elements list or stage not found for touch drag initialization.');
    return;
  }

  elementsList.addEventListener(
    'touchstart',
    (e) => {
      const target = e.target.closest('.draggable-element');
      if (!target || target.closest('.favorite-button')) return; // Ignore if touching favorite button

      e.preventDefault(); // Prevent default scroll/zoom/context menu
      originalElement = target;
      plotState.isTouchDragging = true; // Global flag

      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;

      const rect = target.getBoundingClientRect();
      initialOffsetX = touchStartX - rect.left;
      initialOffsetY = touchStartY - rect.top;

      // Create visual clone
      touchDragElement = target.cloneNode(true);
      touchDragElement.classList.add('touch-drag-element'); // Use CSS class for styling
      // Remove favorite button from clone
      const favButton = touchDragElement.querySelector('.favorite-button');
      if (favButton) favButton.remove();

      touchDragElement.style.position = 'fixed'; // Use fixed to position relative to viewport
      touchDragElement.style.zIndex = '10000';
      touchDragElement.style.pointerEvents = 'none';
      touchDragElement.style.margin = '0'; // Reset margin
      touchDragElement.style.left = `${touchStartX - initialOffsetX}px`;
      touchDragElement.style.top = `${touchStartY - initialOffsetY}px`;

      document.body.appendChild(touchDragElement);

      // Add move/end listeners to the document for wider tracking
      document.addEventListener('touchmove', touchMoveFromList, { passive: false });
      document.addEventListener('touchend', touchEndFromList, { passive: false });
      document.addEventListener('touchcancel', touchEndFromList, { passive: false }); // Handle cancel
    },
    { passive: false }
  ); // Need non-passive to prevent default

  function touchMoveFromList(e) {
    if (!touchDragElement) return;
    e.preventDefault();

    const touch = e.touches[0];
    touchDragElement.style.left = `${touch.clientX - initialOffsetX}px`;
    touchDragElement.style.top = `${touch.clientY - initialOffsetY}px`;
  }

  function touchEndFromList(e) {
    if (!touchDragElement) return;
    e.preventDefault();

    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

    // Drop on stage logic
    if (dropTarget && stage.contains(dropTarget)) {
      const stageRect = stage.getBoundingClientRect();
      // Calculate drop relative to stage, adjusting for scroll
      const dropX = touch.clientX - stageRect.left;
      const dropY = touch.clientY - stageRect.top;

      // --- Get element data (ensure functions are available) ---
      const elementId = originalElement.getAttribute('data-element-id');
      const elementData = typeof getElementData === 'function' ? getElementData(elementId) : null; // Use existing func if possible

      if (elementData) {
        const elementWidth = 75; // Default placed size
        const elementHeight = 75;

        const maxLeft = stageRect.width - elementWidth;
        const maxTop = stageRect.height - elementHeight;
        // Drop position relative to the center of the touch point
        const constrainedX = Math.max(0, Math.min(dropX - elementWidth / 2, maxLeft));
        const constrainedY = Math.max(0, Math.min(dropY - elementHeight / 2, maxTop));

        const newElementId = plotState.elements.length > 0 ? Math.max(...plotState.elements.map((el) => el.id)) + 1 : 1;

        const newElement = {
          id: newElementId,
          elementId: parseInt(elementId),
          elementName: elementData.element_name,
          categoryId: elementData.category_id,
          image: elementData.element_image,
          x: constrainedX,
          y: constrainedY,
          width: elementWidth,
          height: elementHeight,
          flipped: false,
          zIndex: plotState.nextZIndex++,
          label: '',
          notes: '',
        };

        plotState.elements.push(newElement);

        // Use existing createPlacedElement function
        if (typeof createPlacedElement === 'function') {
          createPlacedElement(newElement, plotState).then(() => {
            const domElement = document.querySelector(`.placed-element[data-id="${newElement.id}"]`);
            if (domElement) {
              requestAnimationFrame(() => {
                domElement.classList.add('dropping'); // Add drop animation class
                domElement.addEventListener(
                  'animationend',
                  () => {
                    domElement.classList.remove('dropping');
                  },
                  { once: true }
                );
              });
            }
            // Update info list (ensure function exists)
            if (typeof renderElementInfoList === 'function') {
              renderElementInfoList(plotState);
            }
            // Mark plot as modified (ensure function exists)
            if (typeof markPlotAsModified === 'function') {
              markPlotAsModified(plotState);
            }
          });
        } else {
          console.error('createPlacedElement function is not available.');
        }
      } else {
        console.error('Could not retrieve data for element ID:', elementId);
      }
    }

    // Cleanup
    if (touchDragElement.parentNode) {
      touchDragElement.remove();
    }
    touchDragElement = null;
    originalElement = null;
    plotState.isTouchDragging = false; // Reset flag
    document.removeEventListener('touchmove', touchMoveFromList);
    document.removeEventListener('touchend', touchEndFromList);
    document.removeEventListener('touchcancel', touchEndFromList);
  }
}

/**
 * Initializes touch dragging and tapping for elements already on the stage.
 * Uses event delegation on the stage element.
 * @param {Object} plotState - The global plot state object.
 */
function initTouchOnStageElements(plotState) {
  const stage = document.getElementById('stage');
  if (!stage) return;

  let draggedElement = null;
  let isDragging = false;
  let isTap = true; // Assume tap initially
  let touchStartX, touchStartY;
  let elementStartX, elementStartY;
  let groupOffsets = [];
  let isDraggingGroup = false;
  let lastTapTime = 0;
  const DOUBLE_TAP_THRESHOLD = 300; // ms
  const TAP_MOVE_THRESHOLD = 10; // px tolerance for tap vs drag
  const TAP_DURATION_THRESHOLD = 200; // ms max duration for tap
  let touchStartTime = 0;

  stage.addEventListener(
    'touchstart',
    (e) => {
      const targetElement = e.target.closest('.placed-element');
      if (!targetElement) return; // Touched stage background

      // Prevent dragging if touching an action button
      if (e.target.closest('.element-actions button')) {
        return;
      }

      e.preventDefault(); // Prevent scrolling/zooming while interacting with elements

      touchStartTime = Date.now();
      draggedElement = targetElement;
      isDragging = false; // Will be set true on first significant move
      isTap = true; // Reset tap flag

      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      elementStartX = parseInt(draggedElement.style.left || '0');
      elementStartY = parseInt(draggedElement.style.top || '0');

      // Group dragging logic
      const elementId = parseInt(draggedElement.getAttribute('data-id'));
      isDraggingGroup = plotState.selectedElements.includes(elementId) && plotState.selectedElements.length > 1;

      if (isDraggingGroup) {
        groupOffsets = [];
        plotState.selectedElements.forEach((id) => {
          const el = stage.querySelector(`.placed-element[data-id="${id}"]`);
          if (el) {
            groupOffsets.push({
              element: el,
              startX: parseInt(el.style.left || '0'),
              startY: parseInt(el.style.top || '0'),
            });
          }
        });
      } else {
        // If not dragging a group, bring the single element to front
        if (typeof bringToFront === 'function') {
          bringToFront(elementId, plotState);
        }
      }

      // Add move/end listeners to the document
      document.addEventListener('touchmove', touchMoveOnStage, { passive: false });
      document.addEventListener('touchend', touchEndOnStage, { passive: false });
      document.addEventListener('touchcancel', touchEndOnStage, { passive: false });
    },
    { passive: false }
  );

  function touchMoveOnStage(e) {
    if (!draggedElement) return;
    e.preventDefault();

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    // If movement exceeds threshold, it's a drag, not a tap
    if (Math.abs(deltaX) > TAP_MOVE_THRESHOLD || Math.abs(deltaY) > TAP_MOVE_THRESHOLD) {
      isTap = false;
      if (!isDragging) {
        // First significant move
        isDragging = true;
        // Add dragging styles if needed
        if (isDraggingGroup) {
          groupOffsets.forEach((item) => item.element.classList.add('dragging-group'));
        } else {
          draggedElement.classList.add('dragging');
        }
        // Disable console logging during drag
        if (window.disableConsole) window.disableConsole();
      }
    }

    if (isDragging) {
      const stageRect = stage.getBoundingClientRect();
      const stageWidth = stageRect.width;
      const stageHeight = stageRect.height;

      // Update positions
      if (isDraggingGroup) {
        groupOffsets.forEach((item) => {
          const newX = item.startX + deltaX;
          const newY = item.startY + deltaY;
          const constrainedPos = constrainElementPosition(item.element, newX, newY, stageWidth, stageHeight);
          item.element.style.left = `${constrainedPos.x}px`;
          item.element.style.top = `${constrainedPos.y}px`;
        });
      } else {
        const newX = elementStartX + deltaX;
        const newY = elementStartY + deltaY;
        const constrainedPos = constrainElementPosition(draggedElement, newX, newY, stageWidth, stageHeight);
        draggedElement.style.left = `${constrainedPos.x}px`;
        draggedElement.style.top = `${constrainedPos.y}px`;
      }
    }
  }

  function touchEndOnStage(e) {
    if (!draggedElement) return;
    e.preventDefault();

    // Re-enable console logging
    if (window.enableConsole) window.enableConsole();

    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;

    if (isTap && touchDuration < TAP_DURATION_THRESHOLD) {
      // --- Handle Tap ---
      const elementId = parseInt(draggedElement.getAttribute('data-id'));
      const isCurrentlyVisible = draggedElement.classList.contains('actions-visible');
      const now = Date.now();

      // Double Tap Check (for potential future use like opening props modal)
      // if (now - lastTapTime < DOUBLE_TAP_THRESHOLD) {
      //     console.log("Double tap detected on element:", elementId);
      //     // Example: Open properties modal on double tap
      //     // if (typeof openPropertiesModal === 'function') {
      //     //     openPropertiesModal(elementId, plotState);
      //     // }
      // } else {
      // Single Tap: Toggle actions
      console.log('Single tap detected on element:', elementId);
      // Hide actions on all other elements first
      document.querySelectorAll('.placed-element.actions-visible').forEach((el) => {
        if (el !== draggedElement) {
          el.classList.remove('actions-visible');
        }
      });
      // Toggle actions for the tapped element
      draggedElement.classList.toggle('actions-visible');
      // }
      lastTapTime = now;
    } else if (isDragging) {
      // --- Handle Drag End ---
      console.log('Drag end detected.');
      // Update plotState with final positions
      if (isDraggingGroup) {
        groupOffsets.forEach((item) => {
          const id = parseInt(item.element.getAttribute('data-id'));
          const index = plotState.elements.findIndex((el) => el.id === id);
          if (index !== -1) {
            plotState.elements[index].x = parseInt(item.element.style.left);
            plotState.elements[index].y = parseInt(item.element.style.top);
          }
          item.element.classList.remove('dragging-group');
        });
      } else {
        const id = parseInt(draggedElement.getAttribute('data-id'));
        const index = plotState.elements.findIndex((el) => el.id === id);
        if (index !== -1) {
          plotState.elements[index].x = parseInt(draggedElement.style.left);
          plotState.elements[index].y = parseInt(draggedElement.style.top);
        }
        draggedElement.classList.remove('dragging');
      }

      // Mark plot as modified (ensure function exists)
      if (typeof markPlotAsModified === 'function') {
        markPlotAsModified(plotState);
      }
      // Update info list (ensure function exists)
      if (typeof renderElementInfoList === 'function') {
        renderElementInfoList(plotState);
      }
    }

    // Cleanup
    draggedElement = null;
    isDragging = false;
    isTap = true;
    isDraggingGroup = false;
    groupOffsets = [];
    document.removeEventListener('touchmove', touchMoveOnStage);
    document.removeEventListener('touchend', touchEndOnStage);
    document.removeEventListener('touchcancel', touchEndOnStage);
  }

  // Helper to constrain element position within the stage
  function constrainElementPosition(element, desiredX, desiredY, stageWidth, stageHeight) {
    const elementWidth = element.offsetWidth;
    const elementHeight = element.offsetHeight;
    const maxX = stageWidth - elementWidth;
    const maxY = stageHeight - elementHeight;

    const x = Math.max(0, Math.min(desiredX, maxX));
    const y = Math.max(0, Math.min(desiredY, maxY));
    return { x, y };
  }
}

/**
 * Overrides console.log/warn/error to prevent excessive logging during drag operations.
 */
function overrideConsoleDuringDrag() {
  const originalConsole = {
    log: console.log.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };
  let consoleDisabled = false;

  window.disableConsole = () => {
    if (!consoleDisabled) {
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
      consoleDisabled = true;
      // originalConsole.log("Console logging disabled during drag."); // Debug
    }
  };

  window.enableConsole = () => {
    if (consoleDisabled) {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      consoleDisabled = false;
      // console.log("Console logging re-enabled."); // Debug
    }
  };
}

// Expose the main init function globally
window.initTouchInteraction = initTouchInteraction;
