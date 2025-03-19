/**
 * StageWrite - Stage Plot Editor
 * Handles drag and drop functionality, element placement, and saving/loading
 */
document.addEventListener("DOMContentLoaded", () => {
  // State management
  const plotState = {
    elements: [],
    nextZIndex: 1,
    currentDragId: null,
    selectedElement: null,
    currentPlotName: null,
    currentPlotId: null,
    isModified: false
  };
  
  // DOM Elements
  const stage = document.getElementById('stage');
  const categoryFilter = document.getElementById('category-filter');
  const saveButton = document.getElementById('save-plot');
  const saveChangesButton = document.getElementById('save-changes');
  const loadButton = document.getElementById('my-plots');
  const clearButton = document.getElementById('clear-plot');
  const saveModal = document.getElementById('save-plot-modal');
  const loadModal = document.getElementById('my-plots-modal');
  const propsModal = document.getElementById('element-props-modal');
  const venueSelect = document.getElementById('venue_select');
  const eventStartInput = document.getElementById('event_start');
  const eventEndInput = document.getElementById('event_end');
  const newPlotButton = document.getElementById('new-plot');
  const addVenueButton = document.getElementById('add-venue-button');
  const addVenueModal = document.getElementById('add-venue-modal');
  
  // Initialize
  initDragAndDrop();
  initModalControls();
  initCategoryFilter();
  initLoadPlotModal();
  initPageNavigation();
  initAddVenueModal();
  
  // Try to restore state from localStorage first
  const stateRestored = restoreStateFromStorage();
  
  // Only set up initial state if we didn't restore from storage
  if (!stateRestored) {
    // Set up initial stage dimensions based on default venue
    if (stage) {
      const stageWidth = stage.getAttribute('data-stage-width');
      const stageDepth = stage.getAttribute('data-stage-depth');
      
      // Scale the stage size proportionally to fit our 500x600 container
      const scaleFactor = Math.min(500 / stageWidth, 600 / stageDepth);
      
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
  }
  
  // Update venue select change handler
  if (venueSelect) {
    venueSelect.addEventListener('change', () => {
      const venueValue = venueSelect.value;
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
              markPlotAsModified();
            }
          }
        })
        .catch(error => {
          console.error('Error fetching venue:', error);
          alert('Failed to load venue information. Please try again.');
        });
    });
  }
  
  // Add event listeners for date/time changes
  if (eventStartInput) {
    eventStartInput.addEventListener('change', () => {
      if (plotState.currentPlotId) {
        markPlotAsModified();
      }
    });
  }

  if (eventEndInput) {
    eventEndInput.addEventListener('change', () => {
      if (plotState.currentPlotId) {
        markPlotAsModified();
      }
    });
  }

  /**
   * Initialize drag and drop functionality
   */
  function initDragAndDrop() {
    // Make elements from the list draggable
    const draggableElements = document.querySelectorAll('.draggable-element');
    
    draggableElements.forEach(element => {
      element.addEventListener('dragstart', handleDragStart);
      element.setAttribute('draggable', true);
    });
    
    // Set up the stage as drop target
    if (stage) {
      stage.addEventListener('dragover', handleDragOver);
      stage.addEventListener('drop', handleDrop);
    }
  }
  
  /**
   * Handle drag start event
   */
  function handleDragStart(e) {
    // Store element ID in the dataTransfer object
    e.dataTransfer.setData('text/plain', e.target.getAttribute('data-element-id'));
    
    // Set dragged element information in state
    plotState.currentDragId = e.target.getAttribute('data-element-id');
    
    // Set drag image and effect
    e.dataTransfer.effectAllowed = 'copy';
  }
  
  /**
   * Handle drag over event to allow dropping
   */
  function handleDragOver(e) {
    // Prevent default to allow drop
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }
  
  /**
   * Handle drop event
   */
  function handleDrop(e) {
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
    createPlacedElement(newElement);
    
    // Mark as modified if we're editing an existing plot
    markPlotAsModified();
  }
  
  /**
   * Create a placed element on the stage
   */
  function createPlacedElement(elementData) {
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
        markPlotAsModified();
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
    // editBtn.innerHTML = '⚙';
    editBtn.innerHTML = '<i class="fa-regular fa-pen-to-square"></i>';
    editBtn.title = 'Edit properties';
    editBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      openPropertiesModal(elementData.id);
    });
    
    actions.appendChild(editBtn);
    element.appendChild(actions);
    
    // Make draggable within stage
    makeDraggableOnStage(element);
    
    // Double-click to edit
    element.addEventListener('dblclick', () => {
      openPropertiesModal(elementData.id);
    });
    
    // Add to stage
    stage.appendChild(element);
  }
  
  /**
   * Make an element draggable within the stage
   */
  function makeDraggableOnStage(element) {
    let startX, startY, startLeft, startTop;
    
    element.addEventListener('mousedown', startDrag);
    element.addEventListener('touchstart', startDrag, { passive: false });
    
    function startDrag(e) {
      e.preventDefault();
      e.stopPropagation();
      
      // Bring to front
      const elementId = parseInt(element.getAttribute('data-id'));
      bringToFront(elementId);
      
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
        markPlotAsModified();
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
   */
  function bringToFront(elementId) {
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
   */
  function openPropertiesModal(elementId) {
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
    propsModal.classList.remove('hidden');
    propsModal.classList.add('visible');
    
    // Focus on label input
    document.getElementById('element_label').focus();
    
    // Handle rotation slider input event
    document.getElementById('element_rotation').addEventListener('input', (e) => {
      document.getElementById('rotation_value').textContent = `${e.target.value}°`;
    });
    
    // Handle form submission
    form.onsubmit = (e) => {
      e.preventDefault();
      applyElementProperties();
    };
    
    // Handle delete button
    document.querySelector('#element-props-form .delete-button').onclick = () => {
      if (confirm('Are you sure you want to delete this element?')) {
        deleteElement(elementId);
        closeModal(propsModal);
      }
    };
  }
  
  /**
   * Apply properties from modal to element
   */
  function applyElementProperties() {
    const form = document.getElementById('element-props-form');
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
    
    markPlotAsModified();
  }
  
  /**
   * Delete element from stage and state
   */
  function deleteElement(elementId) {
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
    
    markPlotAsModified();
  }
  
  /**
   * Initialize modal controls
   */
  function initModalControls() {
    // Setup save button
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        // Only show save modal if there are elements on the stage
        if (plotState.elements.length > 0) {
          openModal(saveModal);
          
          // Load existing plots for overwrite options
          loadExistingPlotsForOverwrite();
          
          // Handle form submission for new plot
          const saveForm = document.getElementById('save-new-plot-form');
          if (saveForm) {
            saveForm.onsubmit = (e) => {
              e.preventDefault();
              savePlot(true); // Save as new plot
            };
          }
        } else {
          alert('Please add elements to the stage before saving.');
        }
      });
    }
    
    // Setup load button
    if (loadButton) {
      loadButton.addEventListener('click', () => {
        openModal(loadModal);
        loadSavedPlots();
      });
    }
    
    // Setup clear button
    if (clearButton) {
      clearButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all elements from the stage?')) {
          clearElements();
        }
      });
    }
    
    // Setup new plot button
    if (newPlotButton) {
      newPlotButton.addEventListener('click', () => {
        if (confirm('Are you sure you want to create a new plot? All unsaved changes will be lost.')) {
          newPlot();
        }
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
          savePlot(false, plotState.currentPlotId);
        }
      });
    }
  }
  
  /**
   * Open a modal
   */
  function openModal(modal) {
    if (!modal) return;
    modal.classList.remove('hidden');
    modal.classList.add('visible');
  }
  
  /**
   * Close a modal
   */
  function closeModal(modal) {
    if (!modal) return;
    modal.classList.remove('visible');
    modal.classList.add('hidden');
  }
  
  /**
   * Initialize category filter
   */
  function initCategoryFilter() {
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
   * Save plot to database
   */
  function savePlot(isNew = true, existingPlotId = null, newName = null, existingName = null) {
    // When saving changes to an existing plot or overwriting with a new name
    // we need to determine what name to use
    let plotName;
    
    if (isNew) {
      // New plot - always use the input field
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
      
    const venueId = venueSelect ? venueSelect.value : document.getElementById('venue_id').value;
    const eventDateStart = eventStartInput ? eventStartInput.value : document.getElementById('event_date_start').value;
    const eventDateEnd = eventEndInput ? eventEndInput.value : document.getElementById('event_date_end').value;
    
    if ((isNew || newName) && !plotName) {
      alert('Please enter a plot name.');
      return;
    }
    
    if (!plotName || !venueId) {
      alert('Please fill all required fields.');
      return;
    }
    
    // Create plot data
    const plotData = {
      plot_name: plotName,
      venue_id: venueId,
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
    
    // Rest of the function remains the same
    // ...
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
        alert('Plot saved successfully!');
        
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
          
          // Change save button text to "Save As"
          if (saveButton) {
            saveButton.textContent = 'Save As';
          }
        }
        
        // Reset modified state
        plotState.isModified = false;
        
        // Hide save changes button
        if (saveChangesButton) {
          saveChangesButton.classList.add('hidden');
        }
        
        // Close modal if we're showing one
        closeModal(saveModal);
        
        // Update the saved state in localStorage
        saveStateToStorage();
      } else {
        alert('Error saving plot: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(error => {
      console.error('Error saving plot:', error);
      alert('Error saving plot. Please try again.');
    });
  }
  
  /**
   * Load saved plots from database
   */
  function loadSavedPlots() {
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
            html += `<li class ="plot-item">
              <a href="#" class="plot-info" data-plot-id="${plot.plot_id}">
                <div class="plot-name">${plot.plot_name}</div>
                <div class="plot-details">
                  <span class="venue">${plot.venue_name}</span>
                  <span class="date">${formattedDate}</span>
                </div>
              </a>
              <button class="delete-plot-btn" data-plot-id="${plot.plot_id}" title="Delete plot"><i class="fa-solid fa-delete-left"></i></button>
            </li>`;
          });
          html += '</ul>';
          plotsList.innerHTML = html;
          
          // Add click handlers
          document.querySelectorAll('.plot-info').forEach(item => {
            item.addEventListener('click', (e) => {
              e.preventDefault();
              const plotId = item.getAttribute('data-plot-id');
              loadPlot(plotId);
            });
          });
          
          // Add delete button handlers
          document.querySelectorAll('.delete-plot-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
              e.stopPropagation();
              
              if (btn.classList.contains('confirming')) {
                // This is the second click (confirmation)
                const plotId = btn.getAttribute('data-plot-id');
                deletePlot(plotId, true);
              } else {
                // This is the first click - transform to confirmation state
                btn.classList.add('confirming');
                btn.textContent = 'Are you Sure?';
                btn.setAttribute('title', 'Click again to confirm deletion');
                
                // Reset after a timeout if not clicked
                setTimeout(() => {
                  if (btn.classList.contains('confirming')) {
                    btn.classList.remove('confirming');
                    btn.innerHTML = '<i class="fa-solid fa-delete-left"></i>';
                    btn.setAttribute('title', 'Delete plot');
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
   * Load a specific plot
   */
  function loadPlot(plotId) {
    fetch(`/handlers/get_plot.php?id=${plotId}`)
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        if (data.plot) {
          // Confirm if we should clear the current stage
          if (plotState.elements.length > 0) {
            if (!confirm('Loading this plot will replace your current stage. Continue?')) {
              return;
            }
          }
          
          // Clear current stage
          clearStage();
          
          // Update plot title and state
          const plotTitle = document.getElementById('plot-title');
          if (plotTitle) {
            plotTitle.textContent = data.plot.plot_name;
          }
          
          // Store current plot info
          plotState.currentPlotName = data.plot.plot_name;
          plotState.currentPlotId = data.plot.plot_id;
          
          // Update venue dropdown to match the plot's venue
          // We're now using effective_venue_id which already includes the 'user_' prefix if needed
          if (venueSelect && data.plot.effective_venue_id) {
            venueSelect.value = data.plot.effective_venue_id;
          }
          
          // Update event dates - handle null/empty values properly
          if (eventStartInput) {
            eventStartInput.value = data.plot.event_date_start || '';
          }
          
          if (eventEndInput) {
            eventEndInput.value = data.plot.event_date_end || '';
          }
          
          // Update stage dimensions
          if (stage) {
            stage.setAttribute('data-venue-id', data.plot.effective_venue_id);
            stage.setAttribute('data-stage-width', data.plot.stage_width);
            stage.setAttribute('data-stage-depth', data.plot.stage_depth);
            stage.setAttribute('data-is-user-venue', data.plot.is_user_venue);
            
            // Update stage dimensions label
            const dimensionsLabel = stage.querySelector('.stage-dimensions');
            if (dimensionsLabel) {
              dimensionsLabel.textContent = `${data.plot.stage_width}' × ${data.plot.stage_depth}'`;
            }
          }

          // Update button text to "Save As" since we're editing an existing plot
          if (saveButton) {
            saveButton.textContent = 'Save As';
          }
          
          // Hide the save changes button initially
          if (saveChangesButton) {
            saveChangesButton.classList.add('hidden');
          }
          
          // Reset modified flag
          plotState.isModified = false;

          // Load placed elements
          if (data.elements && data.elements.length > 0) {
            loadPlacedElements(data.elements);
          }
          
          closeModal(loadModal);
        }
      })
      .catch(error => {
        console.error('Error loading plot:', error);
        alert('Error loading plot. Please try again.');
      });
  }
  
  /**
   * Clear all elements from the stage
   */
  function clearStage() {
    newPlot(); // Use the new function for complete reset
  }
  
  /**
   * Add new function to load existing plots for the save dialog
   */
  function loadExistingPlotsForOverwrite() {
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
                <button type="button" class="delete-plot-btn" data-plot-id="${plot.plot_id}" title="Delete plot">×</button>
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
              
              if (confirm('Are you sure you want to overwrite this plot? This cannot be undone.')) {
                savePlot(false, plotId, newName, plotName); // Pass the existing plot name
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
                deletePlot(plotId, true);
              } else {
                // This is the first click - transform to confirmation state
                btn.classList.add('confirming');
                btn.textContent = 'Are you Sure?';
                btn.setAttribute('title', 'Click again to confirm deletion');
                
                // Reset after a timeout if not clicked
                setTimeout(() => {
                  if (btn.classList.contains('confirming')) {
                    btn.classList.remove('confirming');
                    btn.textContent = '×';
                    btn.setAttribute('title', 'Delete plot');
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
   * Initialize load plot modal
   */
  function initLoadPlotModal() {
    if (loadButton && loadModal) {
      loadButton.addEventListener('click', () => {
        // First show the modal
        openModal(loadModal);
        
        // Then populate it with plots
        loadSavedPlots();
      });
    }
  }

  /**
   * Mark the plot as modified
   */
  function markPlotAsModified() {
    if (!plotState.isModified && plotState.currentPlotId !== null) {
      plotState.isModified = true;
      
      // Show the save changes button
      if (saveChangesButton) {
        saveChangesButton.classList.remove('hidden');
      }
    }
  }

  // Initialize plot title
  const plotTitle = document.getElementById('plot-title');
  if (plotTitle) {
    plotTitle.textContent = 'New Plot';
  }

    /**
   * Load placed elements from server data
   */
  function loadPlacedElements(elements) {
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
      createPlacedElement(elementData);
      
      // Update next z-index if needed
      plotState.nextZIndex = Math.max(plotState.nextZIndex, element.z_index + 1);
    });
  }

  /**
   * Initialize page navigation handlers
   */
  function initPageNavigation() {
    // Save state when navigating away from the page
    window.addEventListener('beforeunload', function(e) {
      // Only prompt if there are unsaved changes
      if (plotState.elements.length > 0 && (plotState.isModified || !plotState.currentPlotId)) {
        // Save current state to localStorage
        saveStateToStorage();
        
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
        saveStateToStorage();
      });
    });
  }
  
  /**
   * Save current state to localStorage
   */
  function saveStateToStorage() {
    if (!stage) return;
    
    try {
      // Create a serializable state object
      const stateToSave = {
        elements: plotState.elements,
        nextZIndex: plotState.nextZIndex,
        currentPlotName: plotState.currentPlotName,
        currentPlotId: plotState.currentPlotId,
        isModified: plotState.isModified,
        venueId: venueSelect ? venueSelect.value : null,
        eventStart: eventStartInput ? eventStartInput.value : null,
        eventEnd: eventEndInput ? eventEndInput.value : null
      };
      
      // Save to localStorage
      localStorage.setItem('stageplot_state', JSON.stringify(stateToSave));
    } catch (e) {
      console.error('Error saving state to localStorage:', e);
    }
  }
  
  /**
   * Restore state from localStorage if available
   */
  function restoreStateFromStorage() {
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
        if (venueSelect && state.venueId) {
          venueSelect.value = state.venueId;
        }
        
        if (eventStartInput && state.eventStart) {
          eventStartInput.value = state.eventStart;
        }
        
        if (eventEndInput && state.eventEnd) {
          eventEndInput.value = state.eventEnd;
        }
        
        // Update save button text
        if (saveButton && state.currentPlotId) {
          saveButton.textContent = 'Save As';
        }
        
        // Show save changes button if needed
        if (saveChangesButton && state.isModified) {
          saveChangesButton.classList.remove('hidden');
        }
        
        // Create all elements on stage
        state.elements.forEach(elementData => {
          plotState.elements.push(elementData);
          createPlacedElement(elementData);
        });
        
        // Add stage dimensions label if it doesn't exist
        if (!stage.querySelector('.stage-dimensions')) {
          const stageWidth = stage.getAttribute('data-stage-width');
          const stageDepth = stage.getAttribute('data-stage-depth');
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
   * Clear the saved state from localStorage
   */
  function clearSavedState() {
    try {
      localStorage.removeItem('stageplot_state');
    } catch (e) {
      console.error('Error clearing state from localStorage:', e);
    }
  }

  /**
   * Delete a saved plot
   */
  function deletePlot(plotId, confirmed = false) {
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
        // If we're currently viewing the plot that was deleted, clear the stage
        if (plotState.currentPlotId && plotState.currentPlotId == plotId) {
          clearStage();
        }
        
        // Reload the plots list
        loadSavedPlots();
        
        // Also reload the overwrite list if the save modal is open
        if (!saveModal.classList.contains('hidden')) {
          loadExistingPlotsForOverwrite();
        }
      } else {
        alert('Error deleting plot: ' + (data.error || 'Unknown error'));
      }
    })
    .catch(error => {
      console.error('Error deleting plot:', error);
      alert('Error deleting plot. Please try again.');
    });
  }

  /**
   * Clear only elements from the stage
   */
  function clearElements() {
    // Clear all placed elements from DOM
    const placedElements = stage.querySelectorAll('.placed-element');
    placedElements.forEach(element => element.remove());
    
    // Reset elements state
    plotState.elements = [];
    plotState.nextZIndex = 1;
    plotState.selectedElement = null;
    
    // Mark as modified if there's a current plot
    if (plotState.currentPlotId) markPlotAsModified();
  }
  
  /**
   * Create a completely new plot (reset everything)
   */
  function newPlot() {
    // Clear all elements
    clearElements();
    
    // Reset plot info
    plotState.currentPlotName = null;
    plotState.currentPlotId = null;
    plotState.isModified = false;
    
    // Reset plot title
    const plotTitle = document.getElementById('plot-title');
    if (plotTitle) plotTitle.textContent = 'New Plot';
    
    // Reset buttons
    if (saveButton) saveButton.textContent = 'Save Plot';
    
    if (saveChangesButton) saveChangesButton.classList.add('hidden');
    
    // Clear saved state from localStorage
    clearSavedState();
    
    // Set default dates
    if (eventStartInput && eventEndInput) {
      const now = new Date();
      const formattedDate = now.toISOString().split('T')[0]; // Format for date input (YYYY-MM-DD)
      eventStartInput.value = formattedDate;
      eventEndInput.value = formattedDate;
    }
    
    // Reset venue
    if (venueSelect) venueSelect.value = "";
  }

  /**
   * Initialize the "Add Venue" modal and functionality for user venues
   */
  function initAddVenueModal() {
    if (!addVenueButton || !addVenueModal) return;
    
    // Open modal when button is clicked
    addVenueButton.addEventListener('click', () => {
      openModal(addVenueModal);
    });
    
    // Get form elements
    const venueForm = document.getElementById('add-venue-form');
    
    // Close button functionality
    const closeBtn = addVenueModal.querySelector('.close-button');
    if (closeBtn) {
      closeBtn.addEventListener('click', () => closeModal(addVenueModal));
    }
    
    // Cancel button functionality
    const cancelBtn = addVenueModal.querySelector('.cancel-button');
    if (cancelBtn) {
      cancelBtn.addEventListener('click', () => closeModal(addVenueModal));
    }
    
    // Close when clicking outside the modal
    addVenueModal.addEventListener('click', (e) => {
      if (e.target === addVenueModal) closeModal(addVenueModal);
    });
    
    // Handle form submission
    if (venueForm) {
      venueForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get form values
        const venueName = document.getElementById('venue_name').value.trim();
        const stageWidth = document.getElementById('stage_width').value.trim();
        const stageDepth = document.getElementById('stage_depth').value.trim();
        const venueStreet = document.getElementById('venue_street').value.trim();
        const venueCity = document.getElementById('venue_city').value.trim();
        const venueStateId = document.getElementById('venue_state_id').value;
        const venueZip = document.getElementById('venue_zip').value.trim();
        
        // Validate required fields - only venue name is required
        if (!venueName) {
          alert('The venue must have a name.');
          return;
        }
        
        // Create venue data - use empty values when appropriate to allow nulls in database
        const venueData = {
          venue_name: venueName,
          venue_street: venueStreet || null,
          venue_city: venueCity || null,
          venue_state_id: venueStateId || null,
          venue_zip: venueZip || null,
          stage_width: stageWidth ? parseInt(stageWidth) : null,
          stage_depth: stageDepth ? parseInt(stageDepth) : null
        };
        
        // Send to server
        fetch('/handlers/save_user_venue.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(venueData)
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Add new venue to dropdown
            const userVenueGroup = venueSelect.querySelector('optgroup[label="My Venues"]');
            
            if (!userVenueGroup) {
              // Create the optgroup if it doesn't exist
              const newGroup = document.createElement('optgroup');
              newGroup.label = "My Venues";
              
              // Create and add the new option
              const newOption = document.createElement('option');
              newOption.value = `user_${data.venue.user_venue_id}`;
              newOption.textContent = data.venue.venue_name;
              
              newGroup.appendChild(newOption);
              venueSelect.appendChild(newGroup);
            } else {
              // Add to existing group
              const newOption = document.createElement('option');
              newOption.value = `user_${data.venue.user_venue_id}`;
              newOption.textContent = data.venue.venue_name;
              userVenueGroup.appendChild(newOption);
            }
            
            // Select the new venue
            venueSelect.value = `user_${data.venue.user_venue_id}`;
            
            // Trigger change event to update stage dimensions
            const changeEvent = new Event('change');
            venueSelect.dispatchEvent(changeEvent);
            
            // Reset form and close modal
            venueForm.reset();
            closeModal(addVenueModal);
            
            // Show success message
            alert('Custom venue added successfully!');
          } else {
            alert('Error adding venue: ' + (data.error || 'Unknown error'));
          }
        })
        .catch(error => {
          console.error('Error saving venue:', error);
          alert('Error saving venue. Please try again.');
        });
      });
    }
  }
});
