/**
 * StageWrite Theme Functionality
 * Handles theme switching between light and dark modes
 */

/**
 * Initialize theme system
 * This function is called by core.js during application initialization
 */
window.initThemeSystem = function () {
  applyThemePreference();

  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    if (!localStorage.getItem('theme')) {
      setTheme(e.matches ? 'dark' : 'light');
    }
  });
};

/**
 * Apply theme preference from localStorage or system preference
 */
function applyThemePreference() {
  const savedTheme = localStorage.getItem('theme');

  if (savedTheme) {
    setTheme(savedTheme);
  } else {
    const prefersDarkMode = window.matchMedia('(prefers-color-scheme: dark)').matches;

    setTheme(prefersDarkMode ? 'dark' : 'light');
  }
}

/**
 * Toggle between light and dark themes
 */
function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';

  setTheme(newTheme);

  localStorage.setItem('theme', newTheme);

  // Show notification about theme change
  if (typeof window.showNotification === 'function') {
    const message = newTheme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled';
    window.showNotification(message, 'info', 2000);
  } else if (typeof showNotification === 'function') {
    const message = newTheme === 'dark' ? 'Dark mode enabled' : 'Light mode enabled';
    showNotification(message, 'info', 2000);
  }
}

/**
 * Set the theme by applying the data-theme attribute to the html element
 * @param {string} theme - Theme to apply ('light' or 'dark')
 */
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);

  // Update icon based on current theme
  const themeToggle = document.getElementById('theme-toggle');
  if (themeToggle) {
    const icon = themeToggle.querySelector('i');
    if (icon) {
      if (theme === 'dark') {
        icon.classList.remove('fa-moon');
        icon.classList.add('fa-sun');
      } else {
        icon.classList.remove('fa-sun');
        icon.classList.add('fa-moon');
      }
    }
  }
}

// Make functions available globally
window.toggleTheme = toggleTheme;
window.setTheme = setTheme;
window.applyThemePreference = applyThemePreference;
