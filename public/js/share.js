/**
 * Print, PDF, and Share functionality for stage plots
 */

/**
 * Initialize print and share functionality
 * @param {Object} [initialPlotState] - Optional initial plot state, primarily for portfolio page usage.
 */
function initPrintAndShare(initialPlotState) {
  if (window.printShareInitialized) {
    if (document.getElementById('stage')) {
      window.plotState = buildCurrentPlotState();
      console.log('Print/share plotState updated from UI:', window.plotState);
    } else if (initialPlotState) {
      window.plotState = { ...(window.plotState || {}), ...initialPlotState };
      console.log('Print/share plotState updated from initialPlotState:', window.plotState);
    }
    return;
  }
  window.printShareInitialized = true;

  if (document.getElementById('stage')) {
    window.plotState = buildCurrentPlotState();
    console.log('Initializing print/share by building state from UI:', window.plotState);
  } else if (initialPlotState) {
    window.plotState = initialPlotState;
    console.log('Initializing print/share with provided state:', window.plotState);
  } else {
    window.plotState = {};
    console.warn('Initializing print/share without initial plot state.');
  }

  const shareButton = document.getElementById('share-plot');
  const shareModal = document.getElementById('share-plot-modal');
  const printButton = document.getElementById('print-plot-btn');
  const pdfButton = document.getElementById('pdf-download-btn');
  const emailButton = document.getElementById('email-share-btn');
  const emailForm = document.getElementById('email-share-form');
  const backButton = document.getElementById('back-to-options-btn');
  const sendEmailButton = document.getElementById('send-email-btn');
  const shareOptions = shareModal ? shareModal.querySelector('.share-options-container') : null;
  const closeButtons = shareModal ? shareModal.querySelectorAll('.close-button, .cancel-button') : [];

  /**
   * Builds the current plot state object by gathering data from UI elements.
   * Primarily used on the main stage plot editor page (index.php).
   * @returns {Object} The current plot state including elements, inputs, title, venue details, etc.
   */
  function buildCurrentPlotState() {
    const stageElement = document.getElementById('stage');
    const plotTitleElement = document.getElementById('plot-title');
    const venueSelectElement = document.getElementById('venue_select');
    const venueInfoNameElement = document.getElementById('venue-info-name');
    const venueInfoAddressElement = document.getElementById('venue-info-address');
    const eventStartElement = document.getElementById('event_start');
    const eventEndElement = document.getElementById('event_end');

    const existingState = window.plotState || {};

    const state = {
      elements: existingState.elements || [],
      inputs: existingState.inputs || [],
      currentPlotId: existingState.currentPlotId || null,
      currentPlotName: plotTitleElement ? plotTitleElement.textContent : 'Stage Plot',
      venueId: venueSelectElement ? venueSelectElement.value : null,
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

  if (shareButton && shareModal) {
    shareButton.addEventListener('click', () => {
      if (document.getElementById('stage')) {
        window.plotState = buildCurrentPlotState();
        console.log('Updated window.plotState before share modal check:', window.plotState);
      }

      const plotTitleElement = document.getElementById('plot-title');
      const plotTitle = plotTitleElement ? plotTitleElement.textContent.trim() : '';

      const isNewPlot = !window.plotState.currentPlotId || plotTitle === 'New Plot' || plotTitle === '';

      console.log('Share check - Plot ID:', window.plotState.currentPlotId, 'Title:', plotTitle, 'isNewPlot:', isNewPlot);

      if (isNewPlot) {
        showNotification('Please save your plot before sharing or printing.', 'warning');

        const saveButton = document.getElementById('save-plot');
        if (saveButton) {
          saveButton.classList.add('highlight-button');
          setTimeout(() => saveButton.classList.remove('highlight-button'), 2000);
        }
        return;
      }

      const saveChangesButton = document.getElementById('save-changes');
      const hasUnsavedChanges = saveChangesButton && (saveChangesButton.classList.contains('visible') || window.getComputedStyle(saveChangesButton).opacity !== '0');

      if (hasUnsavedChanges) {
        if (saveChangesButton) {
          saveChangesButton.classList.add('highlight-button');
          setTimeout(() => saveChangesButton.classList.remove('highlight-button'), 2000);
        }

        showNotification('Save changes before sharing!', 'warning');
        return;
      }

      openModal(shareModal);
    });
  }

  if (closeButtons.length > 0 && shareModal) {
    closeButtons.forEach((button) => {
      button.addEventListener('click', () => {
        closeModal(shareModal);
        if (emailForm) emailForm.classList.add('hidden');
        if (shareOptions) shareOptions.classList.remove('hidden');
      });
    });
  }

  if (printButton) {
    printButton.addEventListener('click', () => {
      let currentState;
      if (document.getElementById('stage')) {
        currentState = buildCurrentPlotState();
        window.plotState = currentState;
        console.log('State updated before printing:', currentState);
      } else {
        currentState = window.plotState;
      }

      if (currentState && currentState.elements && currentState.elements.length > 0) {
        generatePDF(currentState, true);
      } else {
        console.error('Cannot print: Plot data is missing or empty', currentState);
        showNotification('Error: Plot data is missing or empty.', 'error');
      }
    });
  }

  if (pdfButton) {
    pdfButton.addEventListener('click', () => {
      let currentState;
      if (document.getElementById('stage')) {
        currentState = buildCurrentPlotState();
        window.plotState = currentState;
        console.log('State updated before PDF generation:', currentState);
      } else {
        currentState = window.plotState;
      }

      if (currentState && currentState.elements && currentState.elements.length > 0) {
        generatePDF(currentState, false);
      } else {
        console.error('Cannot generate PDF: Plot data is missing or empty', currentState);
        showNotification('Error: Plot data is missing or empty.', 'error');
      }
    });
  }

  if (emailButton && emailForm && shareOptions) {
    emailButton.addEventListener('click', () => {
      emailForm.classList.remove('hidden');
      shareOptions.classList.add('hidden');
    });
  }

  if (backButton && emailForm && shareOptions) {
    backButton.addEventListener('click', () => {
      emailForm.classList.add('hidden');
      shareOptions.classList.remove('hidden');
    });
  }

  if (sendEmailButton && emailForm && shareOptions) {
    const newSendEmailButton = sendEmailButton.cloneNode(true);
    sendEmailButton.parentNode.replaceChild(newSendEmailButton, sendEmailButton);

    newSendEmailButton.addEventListener('click', (e) => {
      const emailInput = document.getElementById('share_email');
      const messageInput = document.getElementById('share_message');
      const email = emailInput ? emailInput.value : null;
      const message = messageInput ? messageInput.value : null;

      let currentState;
      if (document.getElementById('stage')) {
        currentState = buildCurrentPlotState();
        window.plotState = currentState;
        console.log('State updated before email send:', currentState);
      } else {
        currentState = window.plotState;
      }

      if (email && currentState && currentState.elements) {
        setupConfirmButton(
          newSendEmailButton,
          () => {
            sendPlotViaEmail(email, message, currentState);
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
 * @param {boolean} [printMode=false] - Whether to open in print mode (true) or download (false)
 */
function generatePDF(plotState, printMode = false) {
  if (!plotState) {
    console.error('Cannot generate PDF: plotState is undefined');
    showNotification('Error: Plot data is not available.', 'error');
    return;
  }

  showNotification(printMode ? 'Preparing print preview...' : 'Generating PDF...', 'info');

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

  console.log('Data sent to generatePDF handler:', plotData);

  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/handlers/generate_pdf.php';
  form.target = '_blank';
  form.style.display = 'none';

  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'data';
  input.value = JSON.stringify(plotData);
  form.appendChild(input);

  const displayModeInput = document.createElement('input');
  displayModeInput.type = 'hidden';
  displayModeInput.name = 'display_mode';
  displayModeInput.value = printMode.toString();
  form.appendChild(displayModeInput);

  document.body.appendChild(form);
  form.submit();

  setTimeout(() => {
    document.body.removeChild(form);
  }, 1000);

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
  if (!plotState || typeof plotState !== 'object') {
    showNotification('Error: Plot data not available.', 'error');
    console.error('Invalid plotState:', plotState);
    return;
  }

  if (!plotState.currentPlotId) {
    showNotification('Please save the plot first to share it via email.', 'warning');
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
    elements: plotState.elements || [],
    inputs: plotState.inputs || [],
  };

  console.log('Data sent to sendPlotViaEmail handler:', plotData);

  showNotification('Sending email...', 'info');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  fetch('/handlers/send_plot_email.php', {
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
        return response.json();
      } else {
        return response.text().then((text) => {
          console.error('Non-JSON or error response:', response.status, text);
          let errorMsg = `Server error ${response.status}. `;
          if (text) {
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
      if (data.success) {
        showNotification(data.message || 'Email sent successfully!', 'success');

        const emailInput = document.getElementById('share_email');
        const messageInput = document.getElementById('share_message');
        const emailForm = document.getElementById('email-share-form');
        const shareOptions = document.querySelector('.share-options-container');

        if (emailInput) emailInput.value = '';
        if (messageInput) messageInput.value = '';
        if (emailForm) emailForm.classList.add('hidden');
        if (shareOptions) shareOptions.classList.remove('hidden');

        const shareModal = document.getElementById('share-plot-modal');
        if (shareModal) closeModal(shareModal);
      } else {
        throw new Error(data.error || 'Failed to send email (server error)');
      }
    })
    .catch((error) => {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        showNotification('Request timeout. The server took too long to respond.', 'error');
      } else {
        console.error('Email sending error:', error);
        showNotification(`Error sending email: ${error.message}`, 'error');
      }
    });
}

window.initPrintAndShare = initPrintAndShare;
window.generatePDF = generatePDF;
window.sendPlotViaEmail = sendPlotViaEmail;
