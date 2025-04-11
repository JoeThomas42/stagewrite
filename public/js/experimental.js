/**
 * StageWrite UI Enhancements
 * Additional interactive features and visual improvements
 */

/**
 * Initialize all UI enhancements
 */
function initUIEnhancements() {
  initTooltips();
  console.log('UI enhancements initialized');
}

/**
 * Initialize tooltips
 */
function initTooltips() {
  document.querySelectorAll('[title]').forEach(element => {
    // Skip elements that are already enhanced or don't need tooltips
    if (element.classList.contains('tooltip-enhanced') || 
        (element.classList.contains('close-button')) ||
        (element.classList.contains('delete-plot-btn')) ||
        (element.classList.contains('plot-card-snapshot')) ||
        (element.id.includes('delete-action-btn')) ||
        (element.classList.contains('modal-close-button'))) {
      return;
    }
    
    element.classList.add('tooltip-enhanced');
    
    const title = element.getAttribute('title');
    if (!title) return;
    
    // Store original title and remove to prevent default tooltip
    element.dataset.tooltip = title;
    element.removeAttribute('title');
    
    // Create tooltip
    const tooltip = document.createElement('div');
    tooltip.className = 'custom-tooltip';
    tooltip.textContent = title;
    tooltip.style.position = 'absolute';
    tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    tooltip.style.color = 'white';
    tooltip.style.padding = '5px 10px';
    tooltip.style.borderRadius = '3px';
    tooltip.style.fontSize = '12px';
    tooltip.style.zIndex = '9999';
    tooltip.style.pointerEvents = 'none';
    tooltip.style.opacity = '0';
    tooltip.style.transition = 'opacity 0.3s ease';
    
    // Add tooltip to body
    document.body.appendChild(tooltip);
    
    // Show tooltip on hover
    element.addEventListener('mouseenter', (e) => {
      tooltip.style.opacity = '1';
      positionTooltip(tooltip, element);
    });
    
    // Hide tooltip on leave
    element.addEventListener('mouseleave', () => {
      tooltip.style.opacity = '0';
    });
    
    // Update position on scroll and resize
    window.addEventListener('scroll', () => {
      if (tooltip.style.opacity === '1') {
        positionTooltip(tooltip, element);
      }
    });
    
    window.addEventListener('resize', () => {
      if (tooltip.style.opacity === '1') {
        positionTooltip(tooltip, element);
      }
    });
  });
}

/**
 * Position tooltip relative to element
 * @param {HTMLElement} tooltip - The tooltip element
 * @param {HTMLElement} element - The element to position relative to
 */
function positionTooltip(tooltip, element) {
  const rect = element.getBoundingClientRect();
  const tooltipRect = tooltip.getBoundingClientRect();
  
  // Position above element by default
  let top = rect.top - tooltipRect.height - 5;
  let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
  
  // If tooltip would be off the top of the screen, position below element
  if (top < 5) {
    top = rect.bottom + 5;
  }
  
  // Adjust horizontal position if needed
  if (left < 5) {
    left = 5;
  } else if (left + tooltipRect.width > window.innerWidth - 5) {
    left = window.innerWidth - tooltipRect.width - 5;
  }
  
  tooltip.style.top = `${top}px`;
  tooltip.style.left = `${left}px`;
}

// Make functions available globally
window.initUIEnhancements = initUIEnhancements;
