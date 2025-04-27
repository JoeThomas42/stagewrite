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

  if (!window.plotState) {
    console.warn('plotState not found. Touch interactions cannot be initialized.');
    return;
  }

  detectTouchDevice(window.plotState);

  if (window.plotState.isTouchDevice) {
    console.log('Touch device detected. Setting up touch listeners.');
    document.body.classList.add('touch-detected');

    initTouchDragFromList(window.plotState);

    initTouchOnStageElements(window.plotState);

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
  let touchDragElement = null;
  let originalElement = null;
  let touchStartX, touchStartY;
  let initialOffsetX, initialOffsetY;

  if (!elementsList || !stage) {
    console.warn('Elements list or stage not found for touch drag initialization.');
    return;
  }

  elementsList.addEventListener(
    'touchstart',
    (e) => {
      const target = e.target.closest('.draggable-element');
      if (!target || target.closest('.favorite-button')) return;

      e.preventDefault();
      originalElement = target;
      plotState.isTouchDragging = true;

      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;

      const rect = target.getBoundingClientRect();
      initialOffsetX = touchStartX - rect.left;
      initialOffsetY = touchStartY - rect.top;

      touchDragElement = target.cloneNode(true);
      touchDragElement.classList.add('touch-drag-element');

      const favButton = touchDragElement.querySelector('.favorite-button');
      if (favButton) favButton.remove();

      touchDragElement.style.position = 'fixed';
      touchDragElement.style.zIndex = '10000';
      touchDragElement.style.pointerEvents = 'none';
      touchDragElement.style.margin = '0';
      touchDragElement.style.left = `${touchStartX - initialOffsetX}px`;
      touchDragElement.style.top = `${touchStartY - initialOffsetY}px`;

      document.body.appendChild(touchDragElement);

      document.addEventListener('touchmove', touchMoveFromList, { passive: false });
      document.addEventListener('touchend', touchEndFromList, { passive: false });
      document.addEventListener('touchcancel', touchEndFromList, { passive: false });
    },
    { passive: false }
  );

  /**
   * Handles the touch move event when dragging an element from the list.
   * Updates the position of the dragged clone.
   * @param {TouchEvent} e - The touch move event object.
   */
  function touchMoveFromList(e) {
    if (!touchDragElement) return;
    e.preventDefault();

    const touch = e.touches[0];
    touchDragElement.style.left = `${touch.clientX - initialOffsetX}px`;
    touchDragElement.style.top = `${touch.clientY - initialOffsetY}px`;
  }

  /**
   * Handles the touch end/cancel event when dragging an element from the list.
   * Determines if the element was dropped onto the stage and creates a new element if so.
   * Cleans up drag state and listeners.
   * @param {TouchEvent} e - The touch end/cancel event object.
   */
  function touchEndFromList(e) {
    if (!touchDragElement) return;
    e.preventDefault();

    const touch = e.changedTouches[0];
    const dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);

    if (dropTarget && stage.contains(dropTarget)) {
      const stageRect = stage.getBoundingClientRect();

      const dropX = touch.clientX - stageRect.left;
      const dropY = touch.clientY - stageRect.top;

      const elementId = originalElement.getAttribute('data-element-id');
      const elementData = typeof getElementData === 'function' ? getElementData(elementId) : null;

      if (elementData) {
        const elementWidth = 75;
        const elementHeight = 75;

        const maxLeft = stageRect.width - elementWidth;
        const maxTop = stageRect.height - elementHeight;

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

        if (typeof createPlacedElement === 'function') {
          createPlacedElement(newElement, plotState).then(() => {
            const domElement = document.querySelector(`.placed-element[data-id="${newElement.id}"]`);
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

            if (typeof renderElementInfoList === 'function') {
              renderElementInfoList(plotState);
            }

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

    if (touchDragElement.parentNode) {
      touchDragElement.remove();
    }
    touchDragElement = null;
    originalElement = null;
    plotState.isTouchDragging = false;
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
  let isTap = true;
  let touchStartX, touchStartY;
  let elementStartX, elementStartY;
  let groupOffsets = [];
  let isDraggingGroup = false;
  let lastTapTime = 0;
  const DOUBLE_TAP_THRESHOLD = 300;
  const TAP_MOVE_THRESHOLD = 10;
  const TAP_DURATION_THRESHOLD = 200;
  let touchStartTime = 0;

  stage.addEventListener(
    'touchstart',
    (e) => {
      const targetElement = e.target.closest('.placed-element');
      if (!targetElement) return;

      if (e.target.closest('.element-actions button')) {
        return;
      }

      e.preventDefault();

      touchStartTime = Date.now();
      draggedElement = targetElement;
      isDragging = false;
      isTap = true;

      const touch = e.touches[0];
      touchStartX = touch.clientX;
      touchStartY = touch.clientY;
      elementStartX = parseInt(draggedElement.style.left || '0');
      elementStartY = parseInt(draggedElement.style.top || '0');

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
        if (typeof bringToFront === 'function') {
          bringToFront(elementId, plotState);
        }
      }

      document.addEventListener('touchmove', touchMoveOnStage, { passive: false });
      document.addEventListener('touchend', touchEndOnStage, { passive: false });
      document.addEventListener('touchcancel', touchEndOnStage, { passive: false });
    },
    { passive: false }
  );

  /**
   * Handles touch move events on the stage for dragging placed elements.
   * Differentiates between tap and drag based on movement threshold.
   * Updates element(s) position during drag.
   * @param {TouchEvent} e - The touch move event object.
   */
  function touchMoveOnStage(e) {
    if (!draggedElement) return;
    e.preventDefault();

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX;
    const deltaY = touch.clientY - touchStartY;

    if (Math.abs(deltaX) > TAP_MOVE_THRESHOLD || Math.abs(deltaY) > TAP_MOVE_THRESHOLD) {
      isTap = false;
      if (!isDragging) {
        isDragging = true;

        if (isDraggingGroup) {
          groupOffsets.forEach((item) => item.element.classList.add('dragging-group'));
        } else {
          draggedElement.classList.add('dragging');
        }

        if (window.disableConsole) window.disableConsole();
      }
    }

    if (isDragging) {
      const stageRect = stage.getBoundingClientRect();
      const stageWidth = stageRect.width;
      const stageHeight = stageRect.height;

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

  /**
   * Handles touch end/cancel events on the stage.
   * Differentiates between tap (toggles element actions) and drag end (updates state).
   * Cleans up drag state and listeners.
   * @param {TouchEvent} e - The touch end/cancel event object.
   */
  function touchEndOnStage(e) {
    if (!draggedElement) return;
    e.preventDefault();

    if (window.enableConsole) window.enableConsole();

    const touchEndTime = Date.now();
    const touchDuration = touchEndTime - touchStartTime;

    if (isTap && touchDuration < TAP_DURATION_THRESHOLD) {
      const elementId = parseInt(draggedElement.getAttribute('data-id'));
      const isCurrentlyVisible = draggedElement.classList.contains('actions-visible');
      const now = Date.now();

      console.log('Single tap detected on element:', elementId);

      document.querySelectorAll('.placed-element.actions-visible').forEach((el) => {
        if (el !== draggedElement) {
          el.classList.remove('actions-visible');
        }
      });

      draggedElement.classList.toggle('actions-visible');

      lastTapTime = now;
    } else if (isDragging) {
      console.log('Drag end detected.');

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

      if (typeof markPlotAsModified === 'function') {
        markPlotAsModified(plotState);
      }

      if (typeof renderElementInfoList === 'function') {
        renderElementInfoList(plotState);
      }
    }

    draggedElement = null;
    isDragging = false;
    isTap = true;
    isDraggingGroup = false;
    groupOffsets = [];
    document.removeEventListener('touchmove', touchMoveOnStage);
    document.removeEventListener('touchend', touchEndOnStage);
    document.removeEventListener('touchcancel', touchEndOnStage);
  }

  /**
   * Constrains the desired element position within the stage boundaries.
   * @param {HTMLElement} element - The element being positioned.
   * @param {number} desiredX - The desired horizontal position (left).
   * @param {number} desiredY - The desired vertical position (top).
   * @param {number} stageWidth - The width of the stage container.
   * @param {number} stageHeight - The height of the stage container.
   * @returns {{x: number, y: number}} The constrained x and y coordinates.
   */
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

  /**
   * Disables console output methods (log, warn, error).
   */
  window.disableConsole = () => {
    if (!consoleDisabled) {
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
      consoleDisabled = true;
    }
  };

  /**
   * Re-enables console output methods (log, warn, error) by restoring the original functions.
   */
  window.enableConsole = () => {
    if (consoleDisabled) {
      console.log = originalConsole.log;
      console.warn = originalConsole.warn;
      console.error = originalConsole.error;
      consoleDisabled = false;
    }
  };
}

window.initTouchInteraction = initTouchInteraction;
