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
    currentPlotName: null,
    currentPlotId: null,
    isModified: false
  };
  
  // Initialize components
  initPlotControls(plotState);
  initDragAndDrop(plotState);
  initModalControls(plotState);
  initCategoryFilter();
  initLoadPlotModal(plotState);
  initPageNavigation(plotState);
  
  // Try to restore state from localStorage first
  const stateRestored = restoreStateFromStorage(plotState);
  
  // Only set up initial state if we didn't restore from storage
  if (!stateRestored) {
    setupInitialState(plotState);
  }
  
  // Initialize venue select change handler
  setupVenueSelectHandler(plotState);
  
  // Initialize date change handlers
  setupDateHandlers(plotState);
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
  
  draggableElements.forEach(element => {
    element.addEventListener('dragstart', e => handleDragStart(e, plotState));
    element.setAttribute('draggable', true);
  });
  
  // Set up the stage as drop target
  stage.addEventListener('dragover', handleDragOver);
  stage.addEventListener('drop', e => handleDrop(e, plotState));
}

/**
 * Handle drag start event
 * @param {DragEvent} e - The drag event
 * @param {Object} plotState - The current plot state
 */
function handleDragStart(e, plotState) {
  // Store element ID in the dataTransfer object
  e.dataTransfer.setData('text/plain', e.target.getAttribute('data-element-id'));
  
  // Set dragged element information in state
  plotState.currentDragId = e.target.getAttribute('data-element-id');
  
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
  
  // Get the position relative to the stage
  let x = Math.max(0, Math.min(e.clientX - stageRect.left, stageRect.width - 80));
  let y = Math.max(0, Math.min(e.clientY - stageRect.top, stageRect.height - 50));
  
  // Create a new element object
  const newElement = {
    id: plotState.elements.length + 1, // Unique ID for this instance
    elementId: parseInt(elementId),
    elementName: elementName,
    categoryId: parseInt(categoryId),
    image: imageSrc,
    x: x,
    y: y,
    width: 75, // Initial default width that will be adjusted when image loads
    height: 75, // Fixed height
    rotation: 0,
    flipped: false,
    zIndex: plotState.nextZIndex++,
    label: '',
    notes: ''
  };
  
  // Add to state
  plotState.elements.push(newElement);
  
  // Create element in DOM
  createPlacedElement(newElement, plotState);
  
  // Mark as modified if we're editing an existing plot
  markPlotAsModified(plotState);
}

/**
 * Create a placed element on the stage
 * @param {Object} elementData - The element data object
 * @param {Object} plotState - The current plot state
 */
function createPlacedElement(elementData, plotState) {
  const stage = document.getElementById('stage');
  if (!stage) return;
  
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
  
  // Apply rotation if any
  if (elementData.rotation) {
    element.style.transform = `rotate(${elementData.rotation}deg)`;
  }
  
  // Apply flip if needed
  if (elementData.flipped) {
    element.style.transform = element.style.transform 
      ? `${element.style.transform} scaleX(-1)` 
      : 'scaleX(-1)';
  }
  
  // Create image
  const img = document.createElement('img');
  img.src = `/images/elements/${elementData.image}`;
  img.alt = elementData.elementName;
  
  // Add onload handler to adjust width based on actual image dimensions
  img.onload = function() {
    // Calculate the appropriate width based on the image's aspect ratio
    const aspectRatio = this.naturalWidth / this.naturalHeight;
    const newWidth = Math.round(elementData.height * aspectRatio);
    
    // Update the element width in the DOM
    element.style.width = `${newWidth}px`;
    
    // Update the element width in state
    const elementIndex = plotState.elements.findIndex(el => el.id === elementData.id);
    if (elementIndex !== -1) {
      plotState.elements[elementIndex].width = newWidth;
    }
    
    // Only mark as modified if not loading an existing plot
    if (plotState.currentPlotId && plotState.isModified) {
      markPlotAsModified(plotState);
    }
  };
  
  element.appendChild(img);
  
  // Add label if present
  if (elementData.label) {
    const label = document.createElement('div');
    label.className = 'element-label';
    label.textContent = elementData.label;
    element.appendChild(label);
  }
  
  // Add edit button
  const actions = document.createElement('div');
  actions.className = 'element-actions';
  
  const editBtn = document.createElement('button');
  editBtn.className = 'edit-element';
  editBtn.innerHTML = '<i class="fa-regular fa-pen-to-square"></i>';
  editBtn.title = 'Edit properties';
  editBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    openPropertiesModal(elementData.id, plotState);
  });
  
  actions.appendChild(editBtn);
  element.appendChild(actions);
  
  // Make draggable within stage
  makeDraggableOnStage(element, plotState);
  
  // Double-click to edit
  element.addEventListener('dblclick', () => {
    openPropertiesModal(elementData.id, plotState);
  });
  
  // Add to stage
  stage.appendChild(element);
}

/**
 * Make an element draggable within the stage
 * @param {HTMLElement} element - The element to make draggable
 * @param {Object} plotState - The current plot state
 */
function makeDraggableOnStage(element, plotState) {
  let startX, startY, startLeft, startTop;
  
  element.addEventListener('mousedown', startDrag);
  element.addEventListener('touchstart', startDrag, { passive: false });
  
  function startDrag(e) {
    e.preventDefault();
    e.stopPropagation();
    
    // Bring to front
    const elementId = parseInt(element.getAttribute('data-id'));
    bringToFront(elementId, plotState);
    
    // Track initial positions
    if (e.type === 'touchstart') {
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
    } else {
      startX = e.clientX;
      startY = e.clientY;
    }
    
    startLeft = parseInt(window.getComputedStyle(element).left);
    startTop = parseInt(window.getComputedStyle(element).top);
    
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
    
    // Calculate new position
    const dx = clientX - startX;
    const dy = clientY - startY;
    
    // Calculate the new position in pixels
    let newLeft = startLeft + dx;
    let newTop = startTop + dy;
    
    // Apply constraints to keep within stage
    const stage = document.getElementById('stage');
    const stageRect = stage.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    
    const maxLeft = stageRect.width - elementRect.width;
    const maxTop = stageRect.height - elementRect.height;
    
    // Apply constraints
    const constrainedLeft = Math.max(0, Math.min(maxLeft, newLeft));
    const constrainedTop = Math.max(0, Math.min(maxTop, newTop));
    
    // Update position
    element.style.left = `${constrainedLeft}px`;
    element.style.top = `${constrainedTop}px`;
    
    // Update state
    const elementId = parseInt(element.getAttribute('data-id'));
    const elementIndex = plotState.elements.findIndex(el => el.id === elementId);
    
    if (elementIndex !== -1) {
      plotState.elements[elementIndex].x = constrainedLeft;
      plotState.elements[elementIndex].y = constrainedTop;
      markPlotAsModified(plotState);
    }
  }
  
  function dragEnd() {
    document.removeEventListener('mousemove', dragMove);
    document.removeEventListener('touchmove', dragMove);
    document.removeEventListener('mouseup', dragEnd);
    document.removeEventListener('touchend', dragEnd);
  }
}

/**
 * Bring an element to the front (highest z-index)
 * @param {number} elementId - The ID of the element to bring to front
 * @param {Object} plotState - The current plot state
 */
function bringToFront(elementId, plotState) {
  const elementIndex = plotState.elements.findIndex(el => el.id === elementId);
  
  if (elementIndex !== -1) {
    // Update z-index in state
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
  
  const elementIndex = plotState.elements.findIndex(el => el.id === elementId);
  
  if (elementIndex === -1) return;
  
  // Store selected element info
  plotState.selectedElement = elementId;
  
  // Fill form with element data
  const form = document.getElementById('element-props-form');
  form.reset();
  
  document.getElementById('element_index').value = elementIndex;
  document.getElementById('element_label').value = plotState.elements[elementIndex].label || '';
  document.getElementById('element_notes').value = plotState.elements[elementIndex].notes || '';
  document.getElementById('element_rotation').value = plotState.elements[elementIndex].rotation || 0;
  document.getElementById('rotation_value').textContent = `${plotState.elements[elementIndex].rotation || 0}°`;
  document.getElementById('element_flipped').checked = plotState.elements[elementIndex].flipped || false;
  
  // Show modal
  openModal(propsModal);
  
  // Focus on label input
  document.getElementById('element_label').focus();
  
  // Handle rotation slider input event
  document.getElementById('element_rotation').addEventListener('input', (e) => {
    document.getElementById('rotation_value').textContent = `${e.target.value}°`;
  });
  
  // Handle form submission
  form.onsubmit = (e) => {
    e.preventDefault();
    applyElementProperties(plotState);
  };
  
  // Handle delete button
  document.querySelector('#element-props-form .delete-button').onclick = () => {
    if (confirm('Are you sure you want to delete this element?')) {
      deleteElement(elementId, plotState);
      closeModal(propsModal);
    }
  };
}

/**
 * Apply properties from modal to element
 * @param {Object} plotState - The current plot state
 */
function applyElementProperties(plotState) {
  const propsModal = document.getElementById('element-props-modal');
  
  const elementIndex = parseInt(document.getElementById('element_index').value);
  const rotation = parseInt(document.getElementById('element_rotation').value);
  const flipped = document.getElementById('element_flipped').checked;
  const label = document.getElementById('element_label').value.trim();
  const notes = document.getElementById('element_notes').value.trim();
  
  if (elementIndex < 0 || elementIndex >= plotState.elements.length) return;
  
  // Update state
  plotState.elements[elementIndex].rotation = rotation;
  plotState.elements[elementIndex].flipped = flipped;
  plotState.elements[elementIndex].label = label;
  plotState.elements[elementIndex].notes = notes;
  
  // Update DOM element
  const elementId = plotState.elements[elementIndex].id;
  const domElement = document.querySelector(`.placed-element[data-id="${elementId}"]`);
  
  if (domElement) {
    // Apply rotation and flip
    let transform = '';
    if (rotation) {
      transform = `rotate(${rotation}deg)`;
    }
    if (flipped) {
      transform += transform ? ' scaleX(-1)' : 'scaleX(-1)';
    }
    domElement.style.transform = transform;
    
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
  
  markPlotAsModified(plotState);
}

/**
 * Delete element from stage and state
 * @param {number} elementId - The ID of the element to delete
 * @param {Object} plotState - The current plot state
 */
function deleteElement(elementId, plotState) {
  // Remove from DOM
  const domElement = document.querySelector(`.placed-element[data-id="${elementId}"]`);
  if (domElement) {
    domElement.remove();
  }
  
  // Remove from state
  const elementIndex = plotState.elements.findIndex(el => el.id === elementId);
  if (elementIndex !== -1) {
    plotState.elements.splice(elementIndex, 1);
  }
  
  markPlotAsModified(plotState);
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
        openModal(saveModal);
        
        // Load existing plots for overwrite options
        loadExistingPlotsForOverwrite(plotState);
        
        // Handle form submission for new plot
        const saveForm = document.getElementById('save-new-plot-form');
        const saveNewButton = saveForm ? saveForm.querySelector('#save-new-button') : null;
        
        if (saveForm && saveNewButton) {
          // Remove any existing listener
          saveForm.onsubmit = null;
          
          saveForm.addEventListener('submit', (e) => {
            e.preventDefault();
          });
          
          // Add click handler to the save button with confirmation
          saveNewButton.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Get the plot name
            const plotName = document.getElementById('plot_name').value.trim();
            
            if (!plotName) {
              showNotification('Please enter a plot name', 'warning');
              return;
            }
            
            if (saveNewButton.classList.contains('confirming')) {
              // This is the second click (confirmation)
              savePlot(true, null, null, null, plotState); // Save as new plot
              
              // Reset button appearance after action
              saveNewButton.classList.remove('confirming');
              saveNewButton.textContent = 'Save as New';
            } else {
              // This is the first click - add class then change content
              saveNewButton.classList.add('confirming');
              saveNewButton.textContent = 'Confirm Save';
              
              // Reset after a timeout if not clicked
              setTimeout(() => {
                if (saveNewButton.classList.contains('confirming')) {
                  saveNewButton.classList.remove('confirming');
                  saveNewButton.textContent = 'Save as New';
                }
              }, 3000); // Reset after 3 seconds
            }
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
  document.querySelectorAll('.modal .close-button, .modal .cancel-button').forEach(button => {
    button.addEventListener('click', (e) => {
      e.preventDefault();
      const modal = button.closest('.modal');
      closeModal(modal);
    });
  });
  
  // Close modal on outside click
  document.querySelectorAll('.modal').forEach(modal => {
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
    elements: plotState.elements.map(el => ({
      element_id: el.elementId,
      x_position: el.x,
      y_position: el.y,
      width: el.width,
      height: el.height,
      rotation: el.rotation,
      flipped: el.flipped ? 1 : 0,
      z_index: el.zIndex,
      label: el.label || '',
      notes: el.notes || ''
    }))
  };
  
  // For overwrite, add plot_id
  if (!isNew && existingPlotId) {
    plotData.plot_id = existingPlotId;
  }
  
  console.log('Sending plot data:', plotData);
  
  fetch('/handlers/save_plot.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(plotData)
  })
  .then(response => {
    return response.json();
  })
  .then(data => {
    if (data.success) {
      // Show notification based on type of save
      if (isNew) {
        showNotification('New Plot Saved!', 'success');
      } else if (newName) {
        showNotification('Plot Overwritten!', 'success');
      } else if (existingName) {
        showNotification('Plot Overwritten!', 'success');
      } else {
        showNotification('Changes Saved!', 'success');
      }
      
      // Update plot title and state for new plots, when overwriting with a new name,
      // or when overwriting an existing plot with its original name
      if ((isNew && data.plot_id) || newName || existingPlotId) {
        // Update the current plot ID if this is a new plot
        if (isNew && data.plot_id) {
          plotState.currentPlotId = data.plot_id;
        }
        
        // Update the current plot name
        plotState.currentPlotName = plotData.plot_name;
        
        // Update the visible plot title
        const plotTitle = document.getElementById('plot-title');
        if (plotTitle) {
          plotTitle.textContent = plotData.plot_name;
        }
        
        const saveButton = document.getElementById('save-plot');
        if (saveButton) {
          saveButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';
        }
      }
      
      // Reset modified state
      plotState.isModified = false;
      
      // Hide save changes button with animation
      const saveChangesButton = document.getElementById('save-changes');
      if (saveChangesButton) {
        saveChangesButton.classList.remove('visible');
        // Remove hidden class after transition completes
        setTimeout(() => {
          saveChangesButton.classList.add('hidden');
        }, 500);
      }
      
      // Close modal if we're showing one
      const saveModal = document.getElementById('save-plot-modal');
      closeModal(saveModal);
      
      // Update the saved state in localStorage
      saveStateToStorage(plotState);
    } else {
      showNotification('Error saving plot: ' + (data.error || 'Unknown error'), 'error');
    }
  })
  .catch(error => {
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
  
  // Show loading message
  plotsList.innerHTML = '<p class="loading-message">Loading your saved plots...</p>';
  
  // Fetch saved plots
  fetch('/handlers/get_plots.php')
    .then(response => response.json())
    .then(data => {
      if (data.plots && data.plots.length > 0) {
        // Create plots list
        let html = '<ul class="plots-list">';
        data.plots.forEach(plot => {
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
        document.querySelectorAll('.overwrite-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            const plotId = btn.getAttribute('data-plot-id');
            const plotName = btn.getAttribute('data-plot-name');
            
            // Check if there's a new name entered
            const newNameInput = document.getElementById('plot_name');
            const newName = newNameInput && newNameInput.value.trim() ? newNameInput.value.trim() : null;
            
            if (btn.classList.contains('confirming')) {
              // This is the second click (confirmation)
              savePlot(false, plotId, newName, plotName, plotState); // Pass the existing plot name
              
              // Reset button appearance after action
              btn.classList.remove('confirming');
              btn.textContent = 'Overwrite';
            } else {
              // This is the first click - add class then change content
              btn.classList.add('confirming');
              btn.textContent = 'Confirm';
              
              // Reset after a timeout if not clicked
              setTimeout(() => {
                if (btn.classList.contains('confirming')) {
                  btn.classList.remove('confirming');
                  btn.textContent = 'Overwrite';
                }
              }, 3000); // Reset after 3 seconds
            }
          });
        });
        
        // Add delete button handlers
        document.querySelectorAll('.existing-plots-list .delete-plot-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (btn.classList.contains('confirming')) {
              // This is the second click (confirmation)
              const plotId = btn.getAttribute('data-plot-id');
              deletePlot(plotId, true, plotState);
            } else {
              // This is the first click - first add the class then change content
              const originalContent = btn.innerHTML;
              
              // Add class first to trigger width transition
              btn.classList.add('confirming');
              
              // Change content after a small delay to let width transition start
              setTimeout(() => {
                btn.textContent = 'Delete';
                btn.setAttribute('title', 'This is permanent!');
              }, 50);
              
              // Reset after a timeout if not clicked
              setTimeout(() => {
                if (btn.classList.contains('confirming')) {
                  // First remove the class to trigger width transition
                  btn.classList.remove('confirming');
                  
                  // After transition starts, restore original content
                  setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.setAttribute('title', 'Delete plot');
                  }, 150);
                }
              }, 3000); // Reset after 3 seconds
              
              // Stop event propagation
              e.stopPropagation();
            }
          });
        });
      } else {
        plotsList.innerHTML = '<p class="no-plots-message">You have no saved plots.</p>';
      }
    })
    .catch(error => {
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
  
  // Show loading message
  plotsList.innerHTML = '<p class="loading-message">Loading your saved plots...</p>';
  
  // Fetch saved plots
  fetch('/handlers/get_plots.php')
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.plots && data.plots.length > 0) {
        // Create plots list
        let html = '<ul class="plots-list">';
        data.plots.forEach(plot => {
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
        document.querySelectorAll('.load-plot-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const plotId = btn.getAttribute('data-plot-id');
            
            // Check if there are elements on stage that would be replaced
            if (plotState.elements.length > 0) {
              if (btn.classList.contains('confirming')) {
                // This is the second click (confirmation)
                loadPlot(plotId, plotState);
                
                // Reset button appearance after action
                btn.classList.remove('confirming');
                setTimeout(() => {
                  btn.textContent = 'Load';
                  btn.setAttribute('title', 'Load plot');
                }, 150);
              } else {
                // This is the first click - add class then change content
                btn.classList.add('confirming');
                
                // Change content after a small delay
                setTimeout(() => {
                  btn.textContent = 'Confirm';
                  btn.setAttribute('title', 'This will replace your current stage');
                }, 50);
                
                // Reset after a timeout if not clicked
                setTimeout(() => {
                  if (btn.classList.contains('confirming')) {
                    btn.classList.remove('confirming');
                    
                    // After transition starts, restore original content
                    setTimeout(() => {
                      btn.textContent = 'Load';
                      btn.setAttribute('title', 'Load plot');
                    }, 150);
                  }
                }, 3000); // Reset after 3 seconds
              }
            } else {
              // No confirmation needed, just load
              loadPlot(plotId, plotState);
            }
          });
        });
        
        // Add delete button handlers
        document.querySelectorAll('.saved-plots-list .delete-plot-btn').forEach(btn => {
          btn.addEventListener('click', (e) => {
            e.stopPropagation();
            
            if (btn.classList.contains('confirming')) {
              // This is the second click (confirmation)
              const plotId = btn.getAttribute('data-plot-id');
              deletePlot(plotId, true, plotState);
            } else {
              // This is the first click - first add the class then change content
              const originalContent = btn.innerHTML;
              btn.classList.add('confirming');

              // Change content after a small delay to let width transition start
              setTimeout(() => {
                btn.textContent = 'Delete';
                btn.setAttribute('title', 'This is permanent!');
              }, 50);
              
              // Reset after a timeout if not clicked
              setTimeout(() => {
                if (btn.classList.contains('confirming')) {
                  btn.classList.remove('confirming');
                  
                  // After transition starts, restore original content
                  setTimeout(() => {
                    btn.innerHTML = originalContent;
                    btn.setAttribute('title', 'Delete plot');
                  }, 150);
                }
              }, 3000); // Reset after 3 seconds
              
              e.stopPropagation();
            }
          });
        });
      } else {
        plotsList.innerHTML = '<p class="no-plots-message">You have no saved plots.</p>';
      }
    })
    .catch(error => {
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
    .then(response => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.json();
    })
    .then(data => {
      if (data.plot) {
        // Clear current elements
        clearElements(plotState);
        
        // Update plot title and state
        const plotTitle = document.getElementById('plot-title');
        if (plotTitle) {
          plotTitle.textContent = data.plot.plot_name;
        }
        
        // Store current plot info
        plotState.currentPlotName = data.plot.plot_name;
        plotState.currentPlotId = data.plot.plot_id;
        
        // Update venue dropdown to match the plot's venue
        const venueSelect = document.getElementById('venue_select');
        if (venueSelect && data.plot.effective_venue_id) {
          venueSelect.value = data.plot.effective_venue_id;
        }
        
        // Update event dates - handle null/empty values properly
        const eventStartInput = document.getElementById('event_start');
        const eventEndInput = document.getElementById('event_end');
        
        if (eventStartInput) {
          eventStartInput.value = data.plot.event_date_start || '';
        }
        
        if (eventEndInput) {
          eventEndInput.value = data.plot.event_date_end || '';
        }
        
        // Update stage dimensions
        const stage = document.getElementById('stage');
        if (stage) {
          stage.setAttribute('data-venue-id', data.plot.effective_venue_id);
          stage.setAttribute('data-stage-width', data.plot.stage_width || '20');
          stage.setAttribute('data-stage-depth', data.plot.stage_depth || '15');
          stage.setAttribute('data-is-user-venue', data.plot.is_user_venue || '0');
          
          // Update stage dimensions label
          const dimensionsLabel = stage.querySelector('.stage-dimensions');
          if (dimensionsLabel) {
            dimensionsLabel.textContent = `${data.plot.stage_width || '20'}' × ${data.plot.stage_depth || '15'}'`;
          }
        }

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

        // Load placed elements
        if (data.elements && data.elements.length > 0) {
          loadPlacedElements(data.elements, plotState);
        }
        
        const loadModal = document.getElementById('my-plots-modal');
        closeModal(loadModal);
        showNotification('Plot loaded!', 'success');
      }
    })
    .catch(error => {
      console.error('Error loading plot:', error);
      showNotification('Error loading plot. Please try again.', 'error');
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
  
  // Clear existing elements first
  const placedElements = stage.querySelectorAll('.placed-element');
  placedElements.forEach(element => element.remove());
  
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
      flipped: element.flipped === 1,
      zIndex: element.z_index,
      label: element.label || '',
      notes: element.notes || ''
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
    body: formData
  })
  .then(response => response.json())
  .then(data => {
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
  .catch(error => {
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
  window.addEventListener('beforeunload', function(e) {
    // Only prompt if there are unsaved changes
    if (plotState.elements.length > 0 && (plotState.isModified || !plotState.currentPlotId)) {
      // Save current state to localStorage
      saveStateToStorage(plotState);
      
      // Show confirmation dialog for unsaved changes
      const confirmationMessage = 'You have unsaved changes. Are you sure you want to leave?';
      e.returnValue = confirmationMessage;
      return confirmationMessage;
    }
  });
  
  // Add click handlers to all navigation links to save state
  document.querySelectorAll('nav a').forEach(link => {
    link.addEventListener('click', function(e) {
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
      nextZIndex: plotState.nextZIndex,
      currentPlotName: plotState.currentPlotName,
      currentPlotId: plotState.currentPlotId,
      isModified: plotState.isModified,
      venueId: document.getElementById('venue_select') ? document.getElementById('venue_select').value : null,
      eventStart: document.getElementById('event_start') ? document.getElementById('event_start').value : null,
      eventEnd: document.getElementById('event_end') ? document.getElementById('event_end').value : null
    };
    
    // Save to localStorage
    localStorage.setItem('stageplot_state', JSON.stringify(stateToSave));
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
    // Check if we have a saved state
    const savedState = localStorage.getItem('stageplot_state');
    if (!savedState) return false;
    
    // Parse the saved state
    const state = JSON.parse(savedState);
    
    // Only restore if we have elements
    if (state.elements && state.elements.length > 0) {
      // Update plot title
      const plotTitle = document.getElementById('plot-title');
      if (plotTitle && state.currentPlotName) {
        plotTitle.textContent = state.currentPlotName;
      } else if (plotTitle) {
        plotTitle.textContent = 'Restored Plot';
      }
      
      // Restore state values
      plotState.elements = [];
      plotState.nextZIndex = state.nextZIndex || 1;
      plotState.currentPlotName = state.currentPlotName;
      plotState.currentPlotId = state.currentPlotId;
      plotState.isModified = state.isModified;
      
      // Restore form inputs
      const venueSelect = document.getElementById('venue_select');
      const eventStartInput = document.getElementById('event_start');
      const eventEndInput = document.getElementById('event_end');
      
      if (venueSelect) {
        if (state.venueId) {
          venueSelect.value = state.venueId;
        } else {
          venueSelect.value = "";
        }
      }
      
      if (eventStartInput && state.eventStart) {
        eventStartInput.value = state.eventStart;
      }
      
      if (eventEndInput && state.eventEnd) {
        eventEndInput.value = state.eventEnd;
      }
      
      // Update save button text
      const saveButton = document.getElementById('save-plot');
      if (saveButton && state.currentPlotId) {
        saveButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';
      }
      
      // Show save changes button if needed
      const saveChangesButton = document.getElementById('save-changes');
      if (saveChangesButton && state.isModified) {
        saveChangesButton.classList.remove('hidden');
      }
      
      // Create all elements on stage
      state.elements.forEach(elementData => {
        plotState.elements.push(elementData);
        createPlacedElement(elementData, plotState);
      });
      
      // Add stage dimensions label if it doesn't exist
      if (!stage.querySelector('.stage-dimensions')) {
        const stageWidth = stage.getAttribute('data-stage-width') || '20';
        const stageDepth = stage.getAttribute('data-stage-depth') || '15';
        const dimensionsLabel = document.createElement('div');
        dimensionsLabel.className = 'stage-dimensions';
        dimensionsLabel.textContent = `${stageWidth}' × ${stageDepth}'`;
        stage.appendChild(dimensionsLabel);
      }
      
      console.log('Stage plot state restored from localStorage');
      return true;
    }
    return false;
  } catch (e) {
    console.error('Error restoring state from localStorage:', e);
    return false;
  }
}

/**
 * Additional functions and modules would go here
 * For brevity, I'm not including all functions from the original stage-plot.js
 * as they would make this artifact too long. The full version would include:
 * - clearSavedState
 */

/**
 * Initialize plot controls and buttons
 * @param {Object} plotState - The current plot state 
 */
function initPlotControls(plotState) {
  const stage = document.getElementById('stage');
  const saveButton = document.getElementById('save-plot');
  const saveChangesButton = document.getElementById('save-changes');
  const loadButton = document.getElementById('my-plots');
  const clearButton = document.getElementById('clear-plot');
  const newPlotButton = document.getElementById('new-plot');

  // Setup clear button
  if (clearButton) {
    clearButton.addEventListener('click', () => {
      if (clearButton.classList.contains('confirming')) {
        // This is the second click (confirmation)
        clearElements(plotState);
        showNotification('Stage cleared!', 'success');

        // Reset button appearance after action
        clearButton.classList.remove('confirming');
        
        // Restore the original icon after a small delay
        setTimeout(() => {
          clearButton.innerHTML = '<i class="fa-solid fa-trash"></i>';
          clearButton.setAttribute('title', 'Clear Stage');
        }, 150);
      } else {
        // This is the first click - first add the class then change content
        const originalContent = clearButton.innerHTML;
        
        // Add class first to trigger width transition
        clearButton.classList.add('confirming');
        
        // Change content after a small delay to let width transition start
        setTimeout(() => {
          clearButton.textContent = 'Clear Stage';
          clearButton.setAttribute('title', 'Clear all placed elements');
        }, 50);
        
        // Reset after a timeout if not clicked
        setTimeout(() => {
          if (clearButton.classList.contains('confirming')) {
            // First remove the class to trigger width transition
            clearButton.classList.remove('confirming');
            
            // After transition starts, restore original content
            setTimeout(() => {
              clearButton.innerHTML = originalContent;
              clearButton.setAttribute('title', 'Clear Stage');
            }, 150);
          }
        }, 3000); // Reset after 3 seconds
      }
    });
  }

  // Setup new plot button
  if (newPlotButton) {
    newPlotButton.addEventListener('click', () => {
      if (newPlotButton.classList.contains('confirming')) {
        // This is the second click (confirmation)
        newPlot(plotState);
        
        // Reset button appearance after action
        newPlotButton.classList.remove('confirming');
        
        // Restore the original icon after a small delay
        setTimeout(() => {
          newPlotButton.innerHTML = '<i class="fa-solid fa-file-circle-plus"></i>';
          newPlotButton.setAttribute('title', 'New Plot');
        }, 150);
      } else {
        // This is the first click - first add the class then change content
        const originalContent = newPlotButton.innerHTML;
        
        // Add class first to trigger width transition
        newPlotButton.classList.add('confirming');
        
        // Change content after a small delay to let width transition start
        setTimeout(() => {
          newPlotButton.textContent = 'New Plot';
          newPlotButton.setAttribute('title', 'You will lose unsaved changes');
        }, 50);
        
        // Reset after a timeout if not clicked
        setTimeout(() => {
          if (newPlotButton.classList.contains('confirming')) {
            // First remove the class to trigger width transition
            newPlotButton.classList.remove('confirming');
            
            // After transition starts, restore original content
            setTimeout(() => {
              newPlotButton.innerHTML = originalContent;
              newPlotButton.setAttribute('title', 'New Plot');
            }, 150);
          }
        }, 3000); // Reset after 3 seconds
      }
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
    const stageWidth = stage.getAttribute('data-stage-width');
    const stageDepth = stage.getAttribute('data-stage-depth');
    
    // Display stage dimensions
    const dimensionsLabel = document.createElement('div');
    dimensionsLabel.className = 'stage-dimensions';
    dimensionsLabel.textContent = `${stageWidth}' × ${stageDepth}'`;
    stage.appendChild(dimensionsLabel);
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
    const stage = document.getElementById('stage');
    if (!stage) return;
    
    const venueValue = venueSelect.value;
    
    // If no venue is selected, set default stage dimensions
    if (!venueValue) {
      // Set default stage dimensions (e.g., 20' x 15')
      stage.setAttribute('data-venue-id', '');
      stage.setAttribute('data-stage-width', '20');
      stage.setAttribute('data-stage-depth', '15');
      stage.setAttribute('data-is-user-venue', '0');
      
      // Update stage dimensions label
      const dimensionsLabel = stage.querySelector('.stage-dimensions');
      if (dimensionsLabel) {
        dimensionsLabel.textContent = `20' × 15'`;
      }
      
      // Mark plot as modified if we're editing an existing plot
      if (plotState.currentPlotId) {
        markPlotAsModified(plotState);
      }
      return;
    }
    
    let venueId, isUserVenue = false;
    
    // Check if this is a user venue
    if (venueValue.startsWith('user_')) {
      isUserVenue = true;
      venueId = venueValue.replace('user_', '');
    } else {
      venueId = venueValue;
    }
    
    // Fetch venue details from server
    const endpoint = isUserVenue ? 
      `/handlers/get_user_venue.php?id=${venueId}` : 
      `/handlers/get_venue.php?id=${venueId}`;
    
    fetch(endpoint)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.success && data.venue) {
          // Update stage dimensions
          stage.setAttribute('data-venue-id', venueId);
          stage.setAttribute('data-stage-width', data.venue.stage_width);
          stage.setAttribute('data-stage-depth', data.venue.stage_depth);
          stage.setAttribute('data-is-user-venue', isUserVenue ? '1' : '0');
          
          // Update stage dimensions label
          const dimensionsLabel = stage.querySelector('.stage-dimensions');
          if (dimensionsLabel) {
            dimensionsLabel.textContent = `${data.venue.stage_width}' × ${data.venue.stage_depth}'`;
          }
          
          // Mark plot as modified if we're editing an existing plot
          if (plotState.currentPlotId) {
            markPlotAsModified(plotState);
          }
        }
      })
      .catch(error => {
        console.error('Error fetching venue:', error);
        alert('Failed to load venue information. Please try again.');
      });
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
 * Initialize the category filter dropdown
 */
function initCategoryFilter() {
  const categoryFilter = document.getElementById('category-filter');
  if (!categoryFilter) return;
  
  categoryFilter.addEventListener('change', () => {
    const categoryId = categoryFilter.value;
    
    document.querySelectorAll('.category-section').forEach(section => {
      if (categoryId === '0' || section.getAttribute('data-category-id') === categoryId) {
        section.style.display = '';
      } else {
        section.style.display = 'none';
      }
    });
  });
}

/**
 * Mark the plot as modified
 * @param {Object} plotState - The current plot state
 */
function markPlotAsModified(plotState) {
  const saveChangesButton = document.getElementById('save-changes');
  
  if (!plotState.isModified && plotState.currentPlotId !== null) {
    plotState.isModified = true;
    
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
  
  // Clear all placed elements from DOM
  const placedElements = stage.querySelectorAll('.placed-element');
  placedElements.forEach(element => element.remove());
  
  // Reset elements state
  plotState.elements = [];
  plotState.nextZIndex = 1;
  plotState.selectedElement = null;
  
  // Mark as modified if there's a current plot
  if (plotState.currentPlotId) markPlotAsModified(plotState);
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
  
  // Clear all elements
  clearElements(plotState);
  
  // Reset plot info
  plotState.currentPlotName = null;
  plotState.currentPlotId = null;
  plotState.isModified = false;
  
  // Reset plot title
  const plotTitle = document.getElementById('plot-title');
  if (plotTitle) plotTitle.textContent = 'New Plot';
  
  // Reset buttons
  if (saveButton) saveButton.innerHTML = '<i class="fa-solid fa-floppy-disk"></i>';
  
  if (saveChangesButton) {
    saveChangesButton.classList.remove('visible');
    // Remove hidden class after transition completes
    setTimeout(() => {
      saveChangesButton.classList.add('hidden');
    }, 500);
  }
      
  // Clear saved state from localStorage
  try {
    localStorage.removeItem('stageplot_state');
  } catch (e) {
    console.error('Error clearing state from localStorage:', e);
  }
  
  // Set default dates
  if (eventStartInput && eventEndInput) {
    const now = new Date();
    const formattedDate = now.toISOString().split('T')[0]; // Format for date input (YYYY-MM-DD)
    eventStartInput.value = formattedDate;
    eventEndInput.value = formattedDate;
  }
  
  // Reset venue
  if (venueSelect) venueSelect.value = "";

  showNotification('New plot created!', 'success');
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
window.loadPlacedElements = loadPlacedElements;
window.initLoadPlotModal = initLoadPlotModal;
window.deletePlot = deletePlot;
window.initPageNavigation = initPageNavigation;
window.saveStateToStorage = saveStateToStorage;
window.restoreStateFromStorage = restoreStateFromStorage;
