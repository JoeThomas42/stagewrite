/**
 * Database Table Interaction JavaScript
 * 
 * Handles dynamic content loading, pagination, and sorting 
 * for database table display without full page reloads.
 * 
 * @module DatabaseInteraction
 */
(function() {
  /**
   * Initializes the database interaction functionality
   * when the DOM is fully loaded.
   */
  document.addEventListener('DOMContentLoaded', function() {
      /**
       * Fetches content via AJAX request
       * 
       * @param {string} url - The URL to fetch content from
       * @returns {Promise} - Promise resolving with fetched content
       */
      async function fetchContent(url) {
          return fetch(url, {
              headers: {
                  'X-Requested-With': 'XMLHttpRequest'
              }
          })
          .then(response => {
              if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
              return response.text();
          })
          .then(html => {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = html;
              
              const newContent = tempDiv.querySelector('#content');
              if (newContent) {
                  document.getElementById('content').innerHTML = newContent.innerHTML;  
                  attachEventListeners();
              }
          })
          .catch(error => {
              console.error('Error fetching content:', error);
              displayErrorMessage('Unable to load content. Please try again.');
          });
      }

      /**
       * Displays an error message to the user
       * 
       * @param {string} message - The error message to display
       */
      function displayErrorMessage(message) {
          let errorEl = document.getElementById('ajax-error-message');
          if (!errorEl) {
              errorEl = document.createElement('div');
              errorEl.id = 'ajax-error-message';
              errorEl.style.cssText = `
                  position: fixed;
                  top: 20px;
                  left: 50%;
                  transform: translateX(-50%);
                  background-color: #f44336;
                  color: white;
                  padding: 15px;
                  border-radius: 5px;
                  z-index: 1000;
              `;
              document.body.appendChild(errorEl);
          }
          
          errorEl.textContent = message;
          
          setTimeout(() => {errorEl.remove();}, 5000);
      }

      /**
       * Attaches click event listeners to pagination and sorting links
       * Enables dynamic content loading without full page reload
       */
      function attachEventListeners() {
          document.querySelectorAll('.pagination a, .data-table th a').forEach(link => {
              link.removeEventListener('click', handleLinkClick);
              link.addEventListener('click', handleLinkClick);
          });
      }

      /**
       * Handles click events for pagination and sorting links
       * 
       * @param {Event} e - The click event
       */
      function handleLinkClick(e) {
          e.preventDefault();
          
          sessionStorage.setItem('scrollPosition', window.scrollY);
          
          fetchContent(this.href);
      }

      /**
       * Restores scroll position if previously saved
       * Useful for maintaining user's view after dynamic content load
       */
      function restoreScrollPosition() {
          const savedScrollPosition = sessionStorage.getItem('scrollPosition');
          if (savedScrollPosition) {
              requestAnimationFrame(() => {
                  window.scrollTo(0, parseInt(savedScrollPosition));
                  sessionStorage.removeItem('scrollPosition');
              });
          }
      }

      /**
       * Adds additional event listeners for enhanced interactivity
       */
      function addAdditionalListeners() {
          document.addEventListener('mouseover', function(e) {
              const row = e.target.closest('tr');
              if (row && row.parentNode.tagName === 'TBODY') row.classList.add('row-hover');
          });

          document.addEventListener('mouseout', function(e) {
              const row = e.target.closest('tr');
              if (row && row.parentNode.tagName === 'TBODY') row.classList.remove('row-hover');
          });
      }

      /**
       * Initializes the entire database interaction system
       */
      function init() {
          attachEventListeners();
          restoreScrollPosition();
          addAdditionalListeners();
      }

      init();
  });
})(); 
