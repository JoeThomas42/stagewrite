/**
 * StageWrite UI Enhancements
 * Additional interactive features and visual improvements
 */

document.addEventListener('DOMContentLoaded', () => {
  try {
    initUIEnhancements();
  } catch (e) {
    console.error('Error initializing UI enhancements:', e);
  }
});

/**
 * Initialize all UI enhancements
 */
function initUIEnhancements() {
  // initTooltips();
  initStageGrid();
  console.log('UI enhancements initialized');
}

/**
 * Add grid to stage for better positioning
 */
function initStageGrid() {
  const stage = document.getElementById('stage');
  if (!stage) return;
  
  // Check if grid toggle already exists
  if (stage.querySelector('.grid-toggle')) return;
  
  // Create grid toggle button
  const gridToggle = document.createElement('button');
  gridToggle.className = 'grid-toggle';
  gridToggle.innerHTML = '<i class="fa-solid fa-border-all"></i>';
  gridToggle.title = 'Toggle Grid';
  gridToggle.style.position = 'absolute';
  gridToggle.style.top = '5px';
  gridToggle.style.left = '5px';
  gridToggle.style.zIndex = '2';
  gridToggle.style.backgroundColor = 'rgba(82, 108, 129, 0.7)';
  gridToggle.style.border = 'none';
  gridToggle.style.borderRadius = '3px';
  gridToggle.style.color = 'white';
  gridToggle.style.cursor = 'pointer';
  gridToggle.style.fontSize = '12px';
  gridToggle.style.padding = '3px 6px';
  
  // Create grid overlay
  const gridOverlay = document.createElement('div');
  gridOverlay.className = 'grid-overlay';
  gridOverlay.style.position = 'absolute';
  gridOverlay.style.top = '0';
  gridOverlay.style.left = '0';
  gridOverlay.style.width = '100%';
  gridOverlay.style.height = '100%';
  gridOverlay.style.backgroundImage = 'linear-gradient(to right, rgba(82, 108, 129, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(82, 108, 129, 0.1) 1px, transparent 1px)';
  gridOverlay.style.backgroundSize = '50px 50px';
  gridOverlay.style.pointerEvents = 'none';
  gridOverlay.style.zIndex = '1';
  gridOverlay.style.opacity = '0';
  gridOverlay.style.transition = 'opacity 0.3s ease';
  
  stage.appendChild(gridToggle);
  stage.appendChild(gridOverlay);
  
  // Add toggle functionality
  let gridVisible = false;
  gridToggle.addEventListener('click', () => {
    gridVisible = !gridVisible;
    gridOverlay.style.opacity = gridVisible ? '1' : '0';
    gridToggle.style.backgroundColor = gridVisible ? 'rgba(82, 108, 129, 0.9)' : 'rgba(82, 108, 129, 0.7)';
  });
}

/**
 * Initialize tooltips
 */
// function initTooltips() {
//   document.querySelectorAll('[title]').forEach(element => {
//     // Skip elements that are already enhanced or don't need tooltips
//     if (element.classList.contains('tooltip-enhanced') || 
//         element.classList.contains('close-button')) {
//       return;
//     }
    
//     element.classList.add('tooltip-enhanced');
    
//     const title = element.getAttribute('title');
//     if (!title) return;
    
//     // Store original title and remove to prevent default tooltip
//     element.dataset.tooltip = title;
//     element.removeAttribute('title');
    
//     // Create tooltip
//     const tooltip = document.createElement('div');
//     tooltip.className = 'custom-tooltip';
//     tooltip.textContent = title;
//     tooltip.style.position = 'absolute';
//     tooltip.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
//     tooltip.style.color = 'white';
//     tooltip.style.padding = '5px 10px';
//     tooltip.style.borderRadius = '3px';
//     tooltip.style.fontSize = '12px';
//     tooltip.style.zIndex = '9999';
//     tooltip.style.pointerEvents = 'none';
//     tooltip.style.opacity = '0';
//     tooltip.style.transition = 'opacity 0.3s ease';
    
//     // Add tooltip to body
//     document.body.appendChild(tooltip);
    
//     // Show tooltip on hover
//     element.addEventListener('mouseenter', (e) => {
//       tooltip.style.opacity = '1';
//       positionTooltip(tooltip, element);
//     });
    
//     // Hide tooltip on leave
//     element.addEventListener('mouseleave', () => {
//       tooltip.style.opacity = '0';
//     });
    
//     // Update position on scroll and resize
//     window.addEventListener('scroll', () => {
//       if (tooltip.style.opacity === '1') {
//         positionTooltip(tooltip, element);
//       }
//     });
    
//     window.addEventListener('resize', () => {
//       if (tooltip.style.opacity === '1') {
//         positionTooltip(tooltip, element);
//       }
//     });
//   });
// }

// /**
//  * Position tooltip relative to element
//  * @param {HTMLElement} tooltip - The tooltip element
//  * @param {HTMLElement} element - The element to position relative to
//  */
// function positionTooltip(tooltip, element) {
//   const rect = element.getBoundingClientRect();
//   const tooltipRect = tooltip.getBoundingClientRect();
  
//   // Position above element by default
//   let top = rect.top - tooltipRect.height - 5;
//   let left = rect.left + (rect.width / 2) - (tooltipRect.width / 2);
  
//   // If tooltip would be off the top of the screen, position below element
//   if (top < 5) {
//     top = rect.bottom + 5;
//   }
  
//   // Adjust horizontal position if needed
//   if (left < 5) {
//     left = 5;
//   } else if (left + tooltipRect.width > window.innerWidth - 5) {
//     left = window.innerWidth - tooltipRect.width - 5;
//   }
  
//   tooltip.style.top = `${top}px`;
//   tooltip.style.left = `${left}px`;
// }

// Make functions available globally
window.initUIEnhancements = initUIEnhancements;
window.initStageGrid = initStageGrid;
