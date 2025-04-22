/**
 * Print, PDF, and Share functionality for stage plots
 */

/**
 * Initialize print and share functionality
 * @param {Object} [initialPlotState] - Optional initial plot state, primarily for profile page usage.
 */
function initPrintAndShare(initialPlotState) {
  // Use a flag to prevent multiple initializations if called repeatedly
  if (window.printShareInitialized) {
    // Always update the state when this function is called, not just with initialPlotState
    if (document.getElementById('stage')) {
      // We're on the stage plot page, so rebuild state from UI completely
      window.plotState = buildCurrentPlotState();
      console.log('Print/share plotState updated from UI:', window.plotState);
    } else if (initialPlotState) {
      // We have an initialPlotState (likely from profile.js), so use it
      window.plotState = { ...(window.plotState || {}), ...initialPlotState };
      console.log('Print/share plotState updated from initialPlotState:', window.plotState);
    }
    return;
  }
  window.printShareInitialized = true; // Set flag after first run

  // Initialize or update the global plotState
  if (document.getElementById('stage')) {
    // If on stage editor page, build from UI
    window.plotState = buildCurrentPlotState();
    console.log('Initializing print/share by building state from UI:', window.plotState);
  } else if (initialPlotState) {
    // If state is passed (likely from profile.js), use it
    window.plotState = initialPlotState;
    console.log('Initializing print/share with provided state:', window.plotState);
  } else {
    // No state exists and not on editor page
    window.plotState = {}; // Initialize empty
    console.warn('Initializing print/share without initial plot state.');
  }

  const shareButton = document.getElementById('share-plot'); // Button on index.php
  const shareModal = document.getElementById('share-plot-modal');
  const printButton = document.getElementById('print-plot-btn');
  const pdfButton = document.getElementById('pdf-download-btn');
  const emailButton = document.getElementById('email-share-btn');
  const emailForm = document.getElementById('email-share-form');
  const backButton = document.getElementById('back-to-options-btn');
  const sendEmailButton = document.getElementById('send-email-btn');
  const shareOptions = shareModal ? shareModal.querySelector('.share-options-container') : null;
  const closeButtons = shareModal ? shareModal.querySelectorAll('.close-button, .cancel-button') : [];

  // Function to build state from the current UI (for index.php)
  function buildCurrentPlotState() {
    // Gathers current data from UI elements on index.php
    const stageElement = document.getElementById('stage');
    const plotTitleElement = document.getElementById('plot-title');
    const venueSelectElement = document.getElementById('venue_select');
    const venueInfoNameElement = document.getElementById('venue-info-name');
    const venueInfoAddressElement = document.getElementById('venue-info-address');
    const eventStartElement = document.getElementById('event_start');
    const eventEndElement = document.getElementById('event_end');

    // Use the existing plot state for elements and inputs
    const existingState = window.plotState || {};

    // Build state object with current UI data
    const state = {
      elements: existingState.elements || [],
      inputs: existingState.inputs || [],
      currentPlotId: existingState.currentPlotId || null,
      currentPlotName: plotTitleElement ? plotTitleElement.textContent : 'Stage Plot',
      venueId: venueSelectElement ? venueSelectElement.value : null,
      // Get venue name from the info panel if possible, fallback to selected option text
      venueName: venueInfoNameElement && venueInfoNameElement.textContent !== 'N/A' ? venueInfoNameElement.textContent : venueSelectElement && venueSelectElement.selectedIndex >= 0 ? venueSelectElement.options[venueSelectElement.selectedIndex].text : '',
      venueAddress: venueInfoAddressElement && venueInfoAddressElement.textContent !== 'N/A' ? venueInfoAddressElement.textContent : 'N/A',
      eventStart: eventStartElement ? eventStartElement.value : null,
      eventEnd: eventEndElement ? eventEndElement.value : null,
      stageWidth: stageElement ? stageElement.dataset.stageWidth : 40,
      stageDepth: stageElement ? stageElement.dataset.stageDepth : 30,
    };

    console.log('Built state from UI:', state);
    return state;
  }

  // Open share modal (for index.php button)
  if (shareButton && shareModal) {
    shareButton.addEventListener('click', () => {
      // First, make sure plotState is updated with current data
      if (document.getElementById('stage')) {
        window.plotState = buildCurrentPlotState();
        console.log('Updated window.plotState before share modal check:', window.plotState);
      }

      // Check if plot has been saved (only for new plots or those with "New Plot" title)
      const plotTitleElement = document.getElementById('plot-title');
      const plotTitle = plotTitleElement ? plotTitleElement.textContent.trim() : '';

      // Improved check for whether a plot has been saved
      const isNewPlot =
        !window.plotState.currentPlotId || // No plot ID means not saved
        plotTitle === 'New Plot' || // Default title means not saved
        plotTitle === ''; // Empty title means not saved

      console.log('Share check - Plot ID:', window.plotState.currentPlotId, 'Title:', plotTitle, 'isNewPlot:', isNewPlot);

      if (isNewPlot) {
        showNotification('Please save your plot before sharing or printing.', 'warning');

        // Highlight save button to draw attention to it
        const saveButton = document.getElementById('save-plot');
        if (saveButton) {
          saveButton.classList.add('highlight-button');
          setTimeout(() => saveButton.classList.remove('highlight-button'), 2000);
        }
        return; // Don't open modal if plot hasn't been saved
      }

      // Check if there are unsaved changes before opening the modal
      const saveChangesButton = document.getElementById('save-changes');
      const hasUnsavedChanges = saveChangesButton && (saveChangesButton.classList.contains('visible') || window.getComputedStyle(saveChangesButton).opacity !== '0');

      if (hasUnsavedChanges) {
        // Highlight the save changes button to draw attention to it
        if (saveChangesButton) {
          saveChangesButton.classList.add('highlight-button');
          setTimeout(() => saveChangesButton.classList.remove('highlight-button'), 2000);
        }

        showNotification('Save changes before sharing!', 'warning');
        return; // Don't open modal if there are unsaved changes
      }

      openModal(shareModal);
    });
  }

  // Close buttons for modal
  if (closeButtons.length > 0 && shareModal) {
    closeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        closeModal(shareModal);
        // Reset email form visibility when closing modal
        if (emailForm) emailForm.classList.add('hidden');
        if (shareOptions) shareOptions.classList.remove('hidden');
      });
    });
  }

  // Handle print button click
  if (printButton) {
    printButton.addEventListener('click', () => {
      // Always rebuild state from UI when on the stage page
      let currentState;
      if (document.getElementById('stage')) {
        currentState = buildCurrentPlotState();

        // Update window.plotState too to keep it in sync
        window.plotState = currentState;
        console.log('State updated before printing:', currentState);
      } else {
        currentState = window.plotState;
      }

      if (currentState && currentState.elements && currentState.elements.length > 0) {
        generatePDF(currentState, true); // Pass the current state
      } else {
        console.error('Cannot print: Plot data is missing or empty', currentState);
        showNotification('Error: Plot data is missing or empty.', 'error');
      }
    });
  }

  // Handle PDF download
  if (pdfButton) {
    pdfButton.addEventListener('click', () => {
      // Always rebuild state from UI when on the stage page
      let currentState;
      if (document.getElementById('stage')) {
        currentState = buildCurrentPlotState();

        // Update window.plotState too to keep it in sync
        window.plotState = currentState;
        console.log('State updated before PDF generation:', currentState);
      } else {
        currentState = window.plotState;
      }

      if (currentState && currentState.elements && currentState.elements.length > 0) {
        generatePDF(currentState, false); // Pass the current state
      } else {
        console.error('Cannot generate PDF: Plot data is missing or empty', currentState);
        showNotification('Error: Plot data is missing or empty.', 'error');
      }
    });
  }

  // Handle email share button click
  if (emailButton && emailForm && shareOptions) {
    emailButton.addEventListener('click', () => {
      // Show email form, hide share options
      emailForm.classList.remove('hidden');
      shareOptions.classList.add('hidden');
    });
  }

  // Back button in email form
  if (backButton && emailForm && shareOptions) {
    backButton.addEventListener('click', () => {
      // Show share options, hide email form
      emailForm.classList.add('hidden');
      shareOptions.classList.remove('hidden');
    });
  }

  // Send email button
  if (sendEmailButton && emailForm && shareOptions) {
    // Remove previous listener if any to prevent duplicates
    const newSendEmailButton = sendEmailButton.cloneNode(true);
    sendEmailButton.parentNode.replaceChild(newSendEmailButton, sendEmailButton);

    newSendEmailButton.addEventListener('click', (e) => {
      const emailInput = document.getElementById('share_email');
      const messageInput = document.getElementById('share_message');
      const email = emailInput ? emailInput.value : null;
      const message = messageInput ? messageInput.value : null;

      // Always rebuild state from UI when on the stage page
      let currentState;
      if (document.getElementById('stage')) {
        currentState = buildCurrentPlotState();

        // Update window.plotState too to keep it in sync
        window.plotState = currentState;
        console.log('State updated before email send:', currentState);
      } else {
        currentState = window.plotState;
      }

      if (email && currentState && currentState.elements) {
        setupConfirmButton(
          newSendEmailButton, // Use the new button instance
          () => {
            sendPlotViaEmail(email, message, currentState); // Pass the current state
          },
          {
            confirmText: 'Confirm',
            confirmTitle: 'Click again to send this email',
            originalText: 'Send',
            originalTitle: 'Send stage plot via email',
            timeout: 3000,
            stopPropagation: true,
            event: e,
          }
        );
      } else if (!email) {
        showNotification('Please enter a valid email address', 'warning');
      } else {
        console.error('Cannot send email: Plot state is unavailable');
        showNotification('Error: Plot state not available.', 'error');
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
  // Safety check - if plotState is undefined, show error and return
  if (!plotState) {
    console.error('Cannot generate PDF: plotState is undefined');
    showNotification('Error: Plot data is not available.', 'error');
    return;
  }

  showNotification(printMode ? 'Preparing print preview...' : 'Generating PDF...', 'info');

  // Create data object using plotState
  const plotData = {
    title: plotState.currentPlotName || 'Stage Plot',
    venue: plotState.venueName || 'N/A',
    address: plotState.venueAddress || 'N/A',
    plotId: plotState.currentPlotId,
    venueId: plotState.venueId || null,
    elements: plotState.elements || [],
    inputs: plotState.inputs || [],
    stageWidth: plotState.stageWidth || 40,
    stageDepth: plotState.stageDepth || 30,
    eventStart: plotState.eventStart || null,
    eventEnd: plotState.eventEnd || null,
    display_mode: printMode.toString(),
  };

  console.log('Data sent to generatePDF handler:', plotData); // Debug log

  // Create and submit form
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/handlers/generate_pdf.php';
  form.target = '_blank';
  form.style.display = 'none';

  // Add data as a hidden input
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'data';
  input.value = JSON.stringify(plotData);
  form.appendChild(input);

  // Add display_mode parameter
  const displayModeInput = document.createElement('input');
  displayModeInput.type = 'hidden';
  displayModeInput.name = 'display_mode';
  displayModeInput.value = printMode.toString();
  form.appendChild(displayModeInput);

  document.body.appendChild(form);
  form.submit();

  // Clean up form after submission
  setTimeout(() => {
    document.body.removeChild(form);
  }, 1000);

  // Show appropriate notification based on mode
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
  // Validate plotState
  if (!plotState || typeof plotState !== 'object') {
    // Removed check for plotState.elements as it might not be needed if backend uses plotId
    showNotification('Error: Plot data not available.', 'error');
    console.error('Invalid plotState:', plotState);
    return;
  }

  // Check if plot has been saved (needed for snapshot/PDF generation on backend)
  if (!plotState.currentPlotId) {
    showNotification('Please save the plot first to share it via email.', 'warning');
    // Highlight save button logic (similar to generatePDF)
    const saveButton = document.getElementById('save-plot');
    if (saveButton) {
      saveButton.classList.add('highlight-button');
      setTimeout(() => saveButton.classList.remove('highlight-button'), 2000);
    }
    const saveChangesButton = document.getElementById('save-changes');
    if (saveChangesButton && saveChangesButton.classList.contains('visible')) {
      saveChangesButton.classList.add('highlight-button');
      setTimeout(() => saveChangesButton.classList.remove('highlight-button'), 2000);
    }
    return;
  }

  // Create data object using plotState
  const plotData = {
    recipient: email,
    message: message,
    title: plotState.currentPlotName || 'Stage Plot',
    plotId: plotState.currentPlotId,
    address: plotState.venueAddress || 'N/A',
    venue: plotState.venueName || '',
    eventStart: plotState.eventStart || null,
    eventEnd: plotState.eventEnd || null,
    venueId: plotState.venueId || null,
  };

  console.log('Data sent to sendPlotViaEmail handler:', plotData); // Debug log

  showNotification('Sending email...', 'info');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

  fetch('/handlers/send_plot_email.php', {
    // Use public handler URL
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify(plotData),
    signal: controller.signal,
  })
    .then((response) => {
      clearTimeout(timeoutId);
      const contentType = response.headers.get('content-type');
      if (response.ok && contentType && contentType.indexOf('application/json') !== -1) {
        return response.json(); // Only parse if it's JSON
      } else {
        // Get text for error context if not OK or not JSON
        return response.text().then((text) => {
          console.error('Non-JSON or error response:', response.status, text);
          // Construct a more specific error message
          let errorMsg = `Server error ${response.status}. `;
          if (text) {
            // Try to extract a meaningful message from the text (e.g., from an HTML error page)
            const match = text.match(/<title>(.*?)<\/title>/i) || text.match(/<b>(.*?)<\/b>/i);
            errorMsg += match ? match[1] : text.substring(0, 100) + '...';
          } else {
            errorMsg += response.statusText;
          }
          throw new Error(errorMsg);
        });
      }
    })
    .then((data) => {
      // Now data is guaranteed to be parsed JSON if we reach here
      if (data.success) {
        showNotification(data.message || 'Email sent successfully!', 'success');

        // Reset form
        const emailInput = document.getElementById('share_email');
        const messageInput = document.getElementById('share_message');
        const emailForm = document.getElementById('email-share-form');
        const shareOptions = document.querySelector('.share-options-container');

        if (emailInput) emailInput.value = '';
        if (messageInput) messageInput.value = '';
        if (emailForm) emailForm.classList.add('hidden');
        if (shareOptions) shareOptions.classList.remove('hidden');

        // Close the main share modal
        const shareModal = document.getElementById('share-plot-modal');
        if (shareModal) closeModal(shareModal);
      } else {
        // Backend indicated failure in the JSON response
        throw new Error(data.error || 'Failed to send email (server error)');
      }
    })
    .catch((error) => {
      clearTimeout(timeoutId); // Ensure timeout is cleared on error too
      if (error.name === 'AbortError') {
        showNotification('Request timeout. The server took too long to respond.', 'error');
      } else {
        console.error('Email sending error:', error);
        showNotification(`Error sending email: ${error.message}`, 'error');
      }
    });
}

// Re-export functions for global access
window.initPrintAndShare = initPrintAndShare;
window.generatePDF = generatePDF;
window.sendPlotViaEmail = sendPlotViaEmail;
