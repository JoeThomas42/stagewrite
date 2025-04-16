/**
 * Print, PDF, and Share functionality for stage plots
 */

/**
 * Initialize print and share functionality
 * @param {Object} plotState - The current plot state
 */
function initPrintAndShare(plotState) {
  console.log('Initializing print/share with plotState:', plotState);
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
        printStagePlot(window.plotState);
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
        generatePDF(window.plotState);
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
    sendEmailButton.addEventListener('click', () => {
      const email = document.getElementById('share_email').value;
      const message = document.getElementById('share_message').value;
      
      if (email) {
        sendPlotViaEmail(email, message, window.plotState);
      } else {
        showNotification('Please enter a valid email address', 'warning');
      }
    });
  }
}

/**
 * Create and open a printer-friendly version of the stage plot
 * @param {Object} plotState - The current plot state
 */
function printStagePlot(plotState) {
  // Safety check - if plotState is undefined, get it from the window
  if (!plotState && window.plotState) {
    console.log('Using global plotState instead of undefined parameter');
    plotState = window.plotState;
  }
  
  // Another safety check - if still undefined, show error and return
  if (!plotState) {
    console.error('Cannot print: plotState is undefined');
    showNotification('Error: Plot state not available. Please try again.', 'error');
    return;
  }

  // Add this check at the beginning of the function
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

  // Create a new window for printing
  const printWindow = window.open('', '_blank');
  
  // Get current data needed for the print version
  const plotTitle = document.getElementById('plot-title').textContent;
  const venueName = document.getElementById('venue-info-name').textContent;
  const venueAddress = document.getElementById('venue-info-address').textContent;
  const venueStage = document.getElementById('venue-info-stage').textContent;
  const eventStart = document.getElementById('event_start').value;
  const eventEnd = document.getElementById('event_end').value;
  
  // Format dates if available
  let dateString = '';
  if (eventStart) {
    dateString = new Date(eventStart).toLocaleDateString();
    if (eventEnd && eventEnd !== eventStart) {
      dateString += ' - ' + new Date(eventEnd).toLocaleDateString();
    }
  }
  
  // Get snapshot URL if plot is saved
  let snapshotUrl = '';
  if (plotState.currentPlotId) {
    // Use the existing snapshot via the get_snapshot.php handler
    snapshotUrl = `/handlers/get_snapshot.php?filename=plot_${plotState.currentPlotId}.png&v=${new Date().getTime()}`;
  }
  
  // Create HTML for the print window
  const printContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Stage Plot: ${plotTitle}</title>
      <link rel="stylesheet" href="/css/base.css">
      <link rel="stylesheet" href="/css/components.css">
      <link rel="stylesheet" href="/css/stage-plot.css">
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          background: white;
        }
        .print-page {
          page-break-after: always;
          padding: 20px;
        }
        .print-heading {
          font-size: 20pt;
          margin-bottom: 10px;
          text-align: center;
        }
        .print-subheading {
          font-size: 14pt;
          margin-bottom: 20px;
          text-align: center;
          color: #666;
        }
        .venue-info {
          margin-bottom: 20px;
          text-align: center;
        }
        .stage-container {
          display: flex;
          justify-content: center;
          align-items: center;
          margin: 20px 0;
        }
        .stage-image {
          max-width: 100%;
          max-height: 70vh;
          object-fit: contain;
        }
        @media print {
          .no-print {
            display: none;
          }
        }
        .print-button {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
          margin-bottom: 20px;
        }
        .element-list, .input-list {
          width: 100%;
          border-collapse: collapse;
          margin-top: 20px;
        }
        .element-list th, .element-list td, 
        .input-list th, .input-list td {
          border: 1px solid #ddd;
          padding: 8px;
          text-align: left;
        }
        .element-list th, .input-list th {
          background-color: #f2f2f2;
        }
        .no-snapshot-message {
          text-align: center;
          color: #999;
          border: 1px dashed #ddd;
          padding: 50px;
          margin: 20px 0;
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="text-align: center; margin: 20px;">
        <button class="print-button" onclick="window.print()">Print Stage Plot</button>
      </div>
      
      <!-- Page 1: Stage -->
      <div class="print-page">
        <h1 class="print-heading">${plotTitle}</h1>
        <p class="print-subheading">${dateString}</p>
        
        <div class="venue-info">
          <p><strong>Venue:</strong> ${venueName}</p>
          <p><strong>Address:</strong> ${venueAddress}</p>
          <p><strong>Stage:</strong> ${venueStage}</p>
        </div>
        
        <div class="stage-container">
          ${snapshotUrl ? 
            `<img src="${snapshotUrl}" alt="Stage Plot" class="stage-image">` : 
            `<div class="no-snapshot-message">
              <p>This plot hasn't been saved yet. Save the plot to generate a snapshot for printing.</p>
            </div>`
          }
        </div>
      </div>
      
      <!-- Page 2: Elements List -->
      <div class="print-page">
        <h1 class="print-heading">Stage Elements List</h1>
        <div class="element-list-container">
          ${generateElementsListHTML(plotState.elements)}
        </div>
      </div>
      
      <!-- Page 3: Input List -->
      <div class="print-page">
        <h1 class="print-heading">Input List</h1>
        <div class="input-list-container">
          ${generateInputListHTML(plotState.inputs)}
        </div>
      </div>
    </body>
    <script>
      // Helper function to generate elements list HTML
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
      
      // Helper function to generate input list HTML
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
    </script>
    </html>
  `;
  
  // Write to the new window and prepare printing
  printWindow.document.open();
  printWindow.document.write(printContent);
  printWindow.document.close();
  
  // Wait for content to load before printing
  printWindow.onload = function() {
    // Trigger print after a slight delay to ensure all content is rendered
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };
}

/**
 * Generate and download a PDF of the stage plot
 * @param {Object} plotState - The current plot state
 */
function generatePDF(plotState) {
  // Safety checks remain the same...
  
  showNotification('Generating PDF...', 'info');
  
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
    eventEnd: document.getElementById('event_end').value
  };
  
  // Use a direct form post approach to trigger browser download
  const form = document.createElement('form');
  form.method = 'POST';
  form.action = '/handlers/generate_pdf.php';
  form.target = '_blank'; // Open in a new window/tab
  form.style.display = 'none';
  
  // Create a hidden input for the JSON data
  const input = document.createElement('input');
  input.type = 'hidden';
  input.name = 'data';
  input.value = JSON.stringify(plotData);
  
  // Add the input to the form
  form.appendChild(input);
  
  // Add form to document and submit it
  document.body.appendChild(form);
  form.submit();
  
  // Clean up the form
  setTimeout(() => {
    document.body.removeChild(form);
  }, 1000);
  
  showNotification('PDF download initiated!', 'success');
}

/**
 * Share the stage plot via email
 * @param {string} email - Recipient email address
 * @param {string} message - Optional message to include
 * @param {Object} plotState - The current plot state
 */
function sendPlotViaEmail(email, message, plotState) {
  // Safety check - if plotState is undefined, get it from the window
  if (!plotState && window.plotState) {
    console.log('Using global plotState instead of undefined parameter');
    plotState = window.plotState;
  }
  
  // Another safety check - if still undefined, show error and return
  if (!plotState) {
    console.error('Cannot send email: plotState is undefined');
    showNotification('Error: Plot state not available. Please try again.', 'error');
    return;
  }
  
  showNotification('Preparing to send email...', 'info');
  
  // Generate snapshot or get plot data
  const plotData = {
    title: document.getElementById('plot-title').textContent,
    recipient: email,
    message: message,
    plotId: plotState.currentPlotId,
    elements: plotState.elements,
    inputs: plotState.inputs || [],
    stageWidth: document.getElementById('stage').dataset.stageWidth,
    stageDepth: document.getElementById('stage').dataset.stageDepth,
    eventStart: document.getElementById('event_start').value,
    eventEnd: document.getElementById('event_end').value
  };
  
  // Send data to an email handler endpoint
  fetch('/handlers/send_plot_email.php', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(plotData)
  })
  .then(response => response.json())
  .then(data => {
    if (data.success) {
      showNotification('Stage plot sent successfully!', 'success');
      
      // Reset form and go back to share options
      document.getElementById('share_email').value = '';
      document.getElementById('share_message').value = '';
      document.getElementById('email-share-form').classList.add('hidden');
      document.querySelector('.share-options-container').classList.remove('hidden');
    } else {
      throw new Error(data.error || 'Failed to send email');
    }
  })
  .catch(error => {
    console.error('Error sending email:', error);
    showNotification('Error sending email: ' + error.message, 'error');
  });
}

// Improved initialization that's more robust
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
window.printStagePlot = printStagePlot;
window.generatePDF = generatePDF;
window.sendPlotViaEmail = sendPlotViaEmail;
window.generateElementsListHTML = generateElementsListHTML;
window.generateInputListHTML = generateInputListHTML;
