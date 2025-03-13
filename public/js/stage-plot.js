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
    selectedElement: null
  };
  
  // DOM Elements
  const stage = document.getElementById('stage');
  const categoryFilter = document.getElementById('category-filter');
  const saveButton = document.getElementById('save-plot');
  const loadButton = document.getElementById('load-plot');
  const clearButton = document.getElementById('clear-plot');
  const saveModal = document.getElementById('save-plot-modal');
  const loadModal = document.getElementById('load-plot-modal');
  const propsModal = document.getElementById('element-props-modal');
  
  // Initialize
  initDragAndDrop();
  initModalControls();
  initCategoryFilter();
  
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
      width: 80, // Default width
      height: 50, // Default height
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
    element.style.width = `${elementData.width}px`;
    element.style.height = `${elementData.height}px`;
    element.style.zIndex = elementData.zIndex;
    
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
    editBtn.innerHTML = '⚙';
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
          
          // Set current date and time for event dates
          const now = new Date();
          const formattedDate = now.toISOString().slice(0, 16); // Format for datetime-local input
          
          document.getElementById('event_date_start').value = formattedDate;
          document.getElementById('event_date_end').value = formattedDate;
          
          // Handle form submission
          const saveForm = document.getElementById('save-plot-form');
          if (saveForm) {
            saveForm.onsubmit = (e) => {
              e.preventDefault();
              savePlot(saveForm);
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
        if (confirm('Are you sure you want to clear the stage? All unsaved changes will be lost.')) {
          clearStage();
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
  function savePlot(form) {
    const plotName = document.getElementById('plot_name').value.trim();
    const venueId = document.getElementById('venue_id').value;
    const eventDateStart = document.getElementById('event_date_start').value;
    const eventDateEnd = document.getElementById('event_date_end').value;
    
    if (!plotName || !venueId || !eventDateStart || !eventDateEnd) {
      alert('Please fill all required fields.');
      return;
    }
    
    // Create plot data
    const plotData = {
      plot_name: plotName,
      venue_id: venueId,
      event_date_start: eventDateStart,
      event_date_end: eventDateEnd,
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
    
    console.log('Sending plot data:', plotData);
    
    // Send data to server
    fetch('/handlers/save_plot.php', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(plotData)
    })
    .then(response => {
      // First log the raw response for debugging
      return response.text().then(text => {
        console.log('Raw server response:', text);
        
        try {
          // Try to parse as JSON
          return JSON.parse(text);
        } catch (e) {
          console.error('JSON parse error:', e);
          console.error('Response was:', text);
          throw new Error('Invalid server response');
        }
      });
    })
    .then(data => {
      if (data.success) {
        alert('Plot saved successfully!');
        closeModal(saveModal);
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
            const formattedDate = new Date(plot.event_date_start).toLocaleDateString();
            html += `<li>
              <a href="#" class="plot-item" data-plot-id="${plot.plot_id}">
                <div class="plot-name">${plot.plot_name}</div>
                <div class="plot-details">
                  <span class="venue">${plot.venue_name}</span>
                  <span class="date">${formattedDate}</span>
                </div>
              </a>
            </li>`;
          });
          html += '</ul>';
          plotsList.innerHTML = html;
          
          // Add click handlers
          document.querySelectorAll('.plot-item').forEach(item => {
            item.addEventListener('click', (e) => {
              e.preventDefault();
              const plotId = item.getAttribute('data-plot-id');
              loadPlot(plotId);
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
          
          // Update stage size if venue is different
          if (stage && data.plot.venue_id) {
            stage.setAttribute('data-venue-id', data.plot.venue_id);
            stage.setAttribute('data-stage-width', data.plot.stage_width);
            stage.setAttribute('data-stage-depth', data.plot.stage_depth);
            
            // Update stage dimensions label
            const dimensionsLabel = stage.querySelector('.stage-dimensions');
            if (dimensionsLabel) {
              dimensionsLabel.textContent = `${data.plot.stage_width}' × ${data.plot.stage_depth}'`;
            }
          }
          
          // Load elements
          if (data.elements && data.elements.length > 0) {
            let maxZIndex = 0;
            
            data.elements.forEach(el => {
              // Create element object for state
              const newElement = {
                id: plotState.elements.length + 1,
                elementId: el.element_id,
                elementName: el.element_name,
                categoryId: el.category_id,
                image: el.element_image,
                x: el.x_position,
                y: el.y_position,
                width: el.width,
                height: el.height,
                rotation: el.rotation,
                flipped: el.flipped === 1,
                zIndex: el.z_index,
                label: el.label || '',
                notes: el.notes || ''
              };
              
              // Track highest z-index
              maxZIndex = Math.max(maxZIndex, el.z_index);
              
              // Add to state
              plotState.elements.push(newElement);
              
              // Create element in DOM
              createPlacedElement(newElement);
            });
            
            // Set next z-index
            plotState.nextZIndex = maxZIndex + 1;
          }
          
          // Close modal
          closeModal(loadModal);
        } else {
          alert('Error loading plot: ' + (data.error || 'Plot not found'));
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
    // Clear all placed elements from DOM
    const placedElements = stage.querySelectorAll('.placed-element');
    placedElements.forEach(element => element.remove());
    
    // Reset state
    plotState.elements = [];
    plotState.nextZIndex = 1;
    plotState.selectedElement = null;
  }
});
