/**
 * StageWrite Main JavaScript
 * Main entry point that imports all module scripts
 */

document.addEventListener('DOMContentLoaded', () => {
  const scripts = [
    '/js/core.js',
    '/js/auth.js',
    '/js/venues.js', 
    '/js/ui.js',
    '/js/share.js',
    '/js/notifications.js',
    '/js/theme.js',
    '/js/stage-plot.js',
    '/js/touch.js',
    '/js/portfolio.js',
    '/js/login.js',
  ];
  
  loadScriptsSequentially(scripts, 0);
});

// Function to load scripts one after another
function loadScriptsSequentially(scripts, index) {
  if (index >= scripts.length) {
    console.log('All scripts loaded successfully');
    if (typeof window.initializeApp === 'function') {
      window.initializeApp();
    } else {
      console.error('initializeApp function not found');
    }
    return;
  }
  
  const script = document.createElement('script');
  script.src = scripts[index];
  script.onload = () => loadScriptsSequentially(scripts, index + 1);
  script.onerror = () => console.error(`Failed to load script: ${scripts[index]}`);
  document.head.appendChild(script);
}
