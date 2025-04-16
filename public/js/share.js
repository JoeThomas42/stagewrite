/**
 * Print, PDF, and Share functionality for stage plots
 */

/**
 * Initialize print and share functionality
 * @param {Object} plotState - The current plot state
 */
function initPrintAndShare(plotState) {
  console.log('Initializing print/share with plotState:', plotState);

  if (window.printShareInitialized) {
    console.log('Print/share already initialized, skipping');
    return;
  }

  const shareButton = document.getElementById('share-plot');
  const shareModal = document.getElementById('share-plot-modal');
  const printButton = document.getElementById('print-plot-btn');
  const pdfButton = document.getElementById('pdf-download-btn');
  const emailButton = document.getElementById('email-share-btn');
  const emailForm = document.getElementById('email-share-form');
  const backButton = document.getElementById('back-to-options-btn');
  const sendEmailButton = document.getElementById('send-email-btn');
  const shareOptions = document.querySelector('.share-options-container');
  const closeButtons = shareModal ? shareModal.querySelectorAll('.close-button, .cancel-button') : [];

  window.printShareInitialized = true;

  // Open share modal
  if (shareButton) {
    shareButton.addEventListener('click', () => {
      console.log('Share button clicked, current plotState:', window.plotState);
      openModal(shareModal);
    });
  }

  // Close buttons for modal
  if (closeButtons.length > 0) {
    closeButtons.forEach(button => {
      button.addEventListener('click', () => {
        closeModal(shareModal);
      });
    });
  }

  // Handle print button click
  if (printButton) {
    printButton.addEventListener('click', () => {
      if (window.plotState) {
        // Use the PDF generator with print mode
        generatePDF(window.plotState, true);
      } else {
        console.error('Cannot print: window.plotState is undefined');
        showNotification('Error: Plot state not available. Please try again.', 'error');
      }
    });
  }

  // Handle PDF download
  if (pdfButton) {
    pdfButton.addEventListener('click', () => {
      if (window.plotState) {
        // Use the PDF generator with download mode
        generatePDF(window.plotState, false);
      } else {
        console.error('Cannot generate PDF: window.plotState is undefined');
        showNotification('Error: Plot state not available. Please try again.', 'error');
      }
    });
  }

  // Handle email share button click
  if (emailButton) {
    emailButton.addEventListener('click', () => {
      // Show email form, hide share options
      emailForm.classList.remove('hidden');
      shareOptions.classList.add('hidden');
    });
  }

  // Back button in email form
  if (backButton) {
    backButton.addEventListener('click', () => {
      // Show share options, hide email form
      emailForm.classList.add('hidden');
      shareOptions.classList.remove('hidden');
    });
  }

  // Send email button
  if (sendEmailButton) {
    sendEmailButton.addEventListener('click', (e) => {
      const email = document.getElementById('share_email').value;
      const message = document.getElementById('share_message').value;
      
      if (email) {
        setupConfirmButton(
          sendEmailButton,
          () => {
            sendPlotViaEmail(email, message, window.plotState);
          },
          {
            confirmText: 'Confirm',
            confirmTitle: 'Click again to send this email',
            originalText: 'Send',
            originalTitle: 'Send stage plot via email',
            timeout: 3000,
            stopPropagation: true,
            event: e
          }
        );
      } else {
        showNotification('Please enter a valid email address', 'warning');
      }
    });
  }
}

/**
 * Generate and either download or print a PDF of the stage plot
 * @param {Object} plotState - The current plot state
 * @param {boolean} printMode - Whether to open in print mode (true) or download (false)
 */
function generatePDF(plotState, printMode = false) {
  // Safety check - if plotState is undefined, get it from the window
  if (!plotState && window.plotState) {
    console.log('Using global plotState instead of undefined parameter');
    plotState = window.plotState;
  }
  
  // Another safety check - if still undefined, show error and return
  if (!plotState) {
    console.error('Cannot generate PDF: plotState is undefined');
    showNotification('Error: Plot state not available. Please try again.', 'error');
    return;
  }

  // Check if plot has been saved
  if (!plotState.currentPlotId) {
    showNotification('Please save your plot first to create a snapshot for printing/PDF', 'warning');
    const saveButton = document.getElementById('save-plot');
    if (saveButton) {
      // Highlight the save button
      saveButton.classList.add('highlight-button');
      setTimeout(() => {
        saveButton.classList.remove('highlight-button');
      }, 2000);
    }
    return;
  }
  
  showNotification(printMode ? 'Preparing print preview...' : 'Generating PDF...', 'info');
  
  // Create data for server-side PDF generation
  const plotData = {
    title: document.getElementById('plot-title').textContent,
    venue: document.getElementById('venue-info-name').textContent,
    plotId: plotState.currentPlotId,
    venueId: document.getElementById('stage').dataset.venueId,
    elements: plotState.elements || [],
    inputs: plotState.inputs || [],
    stageWidth: document.getElementById('stage').dataset.stageWidth,
    stageDepth: document.getElementById('stage').dataset.stageDepth,
    eventStart: document.getElementById('event_start').value,
    eventEnd: document.getElementById('event_end').value,
    display_mode: printMode.toString()
  };
  
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/handlers/generate_pdf.php';
  form.target = '_blank';
  form.style.display = 'none';
  
  // Create hidden inputs for the data
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'data';
  input.value = JSON.stringify(plotData);
  form.appendChild(input);
  
  // Add display mode parameter
  const displayModeInput = document.createElement('input');
  displayModeInput.type = 'hidden';
  displayModeInput.name = 'display_mode';
  displayModeInput.value = printMode.toString();
  form.appendChild(displayModeInput);
  
  // Add form to document and submit it
  document.body.appendChild(form);
  form.submit();
  
  // Clean up the form
  setTimeout(() => {
    document.body.removeChild(form);
  }, 1000);
  
  // Show appropriate notification
  if (printMode) {
    showNotification('Print dialog opening soon...', 'success');
  } else {
    showNotification('PDF download initiated!', 'success');
  }
}

/**
 * Share the stage plot via email
 * @param {string} email - Recipient email address
 * @param {string} message - Optional message to include
 * @param {Object} plotState - The current plot state
 */
function sendPlotViaEmail(email, message, plotState) {
  // Validate plotState first
  if (!plotState || typeof plotState !== 'object') {
    showNotification('Error: Plot data not available. Please try again.', 'error');
    console.error('Invalid plotState:', plotState);
    return;
  }

  // Create a copy of the data we need (to avoid reference issues)
  const plotData = {
    recipient: email,
    message: message,
    title: plotState.currentPlotName || 'Stage Plot',
    plotId: plotState.currentPlotId || null,
    venue: document.getElementById('venue_select') ? 
      document.querySelector('#venue_select option:checked').textContent : '',
    eventStart: document.getElementById('event_start') ? 
      document.getElementById('event_start').value : null,
    eventEnd: document.getElementById('event_end') ? 
      document.getElementById('event_end').value : null,
    elements: plotState.elements || [],
    inputs: plotState.inputs || []
  };

  // Show loading indicator
  showNotification('Sending email...', 'info');
  
  // Add timeout to the fetch request
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

  fetch('/handlers/send_plot_email.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(plotData),
    signal: controller.signal
  })
  .then(response => {
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`Server returned ${response.status} ${response.statusText}`);
    }
    return response.text();
  })
  .then(text => {
    // Debug what's being returned
    console.log('Server response:', text);
    
    // Try to parse as JSON, but handle non-JSON responses
    try {
      return JSON.parse(text);
    } catch (e) {
      console.error('JSON parse error:', e);
      throw new Error('Server returned an invalid response format');
    }
  })
  .then(data => {
    if (data.success) {
      showNotification(data.message || 'Email sent successfully!', 'success');
      
      // Reset form
      document.getElementById('share_email').value = '';
      document.getElementById('share_message').value = '';
      document.getElementById('email-share-form').classList.add('hidden');
      document.querySelector('.share-options-container').classList.remove('hidden');
    } else {
      throw new Error(data.error || 'Failed to send email');
    }
  })
  .catch(error => {
    clearTimeout(timeoutId);
    // Handle AbortController timeout specifically
    if (error.name === 'AbortError') {
      showNotification('Request timeout. The server took too long to respond.', 'error');
    } else {
      console.error('Email sending error:', error);
      showNotification('Error: ' + error.message, 'error');
    }
  });
}

document.addEventListener('DOMContentLoaded', function() {
  console.log('DOM loaded, checking for plotState');
  
  // Try to initialize right away if plotState exists
  if (typeof window.plotState !== 'undefined') {
    console.log('plotState already exists, initializing print/share');
    initPrintAndShare(window.plotState);
  } else {
    console.log('Waiting for plotState to be defined...');
    // If plotState isn't available yet, wait for it
    const checkInterval = setInterval(() => {
      if (typeof window.plotState !== 'undefined') {
        console.log('plotState found, initializing share functionality');
        initPrintAndShare(window.plotState);
        clearInterval(checkInterval);
      }
    }, 100);
    
    // Stop checking after 5 seconds to prevent infinite loop
    setTimeout(() => {
      clearInterval(checkInterval);
      console.log('Timed out waiting for plotState');
    }, 5000);
  }
  
  // As a fallback, check if there's a share button and attach a direct handler
  const shareButton = document.getElementById('share-plot');
  if (shareButton && !shareButton.hasAttribute('data-handler-attached')) {
    console.log('Attaching fallback handler to share button');
    shareButton.setAttribute('data-handler-attached', 'true');
    shareButton.addEventListener('click', () => {
      const shareModal = document.getElementById('share-plot-modal');
      if (shareModal) {
        openModal(shareModal);
      }
    });
  }
});

/**
 * Generate HTML for the elements list table
 * @param {Array} elements - Array of stage elements
 * @returns {string} HTML content
 */
function generateElementsListHTML(elements) {
  if (!elements || elements.length === 0) {
    return '<p>No elements placed.</p>';
  }
  
  let html = '<table class="element-list">';
  html += '<tr><th>#</th><th>Element</th><th>Label</th><th>Notes</th></tr>';
  
  elements.forEach((element, index) => {
    html += '<tr>';
    html += '<td>' + (index + 1) + '</td>';
    html += '<td>' + (element.elementName || '') + '</td>';
    html += '<td>' + (element.label || '') + '</td>';
    html += '<td>' + (element.notes || '') + '</td>';
    html += '</tr>';
  });
  
  html += '</table>';
  return html;
}

/**
 * Generate HTML for the input list table
 * @param {Array} inputs - Array of input list items
 * @returns {string} HTML content
 */
function generateInputListHTML(inputs) {
  if (!inputs || inputs.length === 0) {
    return '<p>No inputs defined.</p>';
  }
  
  let html = '<table class="input-list">';
  html += '<tr><th>Input #</th><th>Description</th></tr>';
  
  inputs.forEach(input => {
    if (input.label || input.input_name) {
      const number = input.number || input.input_number || '';
      const label = input.label || input.input_name || '';
      
      html += '<tr>';
      html += '<td>' + number + '</td>';
      html += '<td>' + label + '</td>';
      html += '</tr>';
    }
  });
  
  html += '</table>';
  return html;
}

window.initPrintAndShare = initPrintAndShare;
window.generatePDF = generatePDF;
window.sendPlotViaEmail = sendPlotViaEmail;
window.generateElementsListHTML = generateElementsListHTML;
window.generateInputListHTML = generateInputListHTML;
