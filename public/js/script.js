document.addEventListener("DOMContentLoaded", () => {
  // Toggle between Login and Signup forms
  const loginForm = document.getElementById("login-form");
  const signupForm = document.getElementById("signup-form");
  const switchToSignup = document.getElementById("switch-to-signup");
  const switchToLogin = document.getElementById("switch-to-login");

  switchToSignup.addEventListener("click", e => {
      e.preventDefault();
      loginForm.classList.add("hidden");
      signupForm.classList.remove("hidden");
  });

  switchToLogin.addEventListener("click", e => {
      e.preventDefault();
      signupForm.classList.add("hidden");
      loginForm.classList.remove("hidden");
  });

  // Form validation for Signup
  const signupPassword = document.getElementById("password_signup");
  const confirmPassword = document.getElementById("confirm_password");
  const signupFormElement = signupForm.querySelector("form");

  signupFormElement.addEventListener("submit", e => {
      if (signupPassword.value !== confirmPassword.value) {
          e.preventDefault();
          alert("Passwords do not match!");
      }
  });

  // Prevent empty fields submission
  document.querySelectorAll("form").forEach((form) => {
      form.addEventListener("submit", e => {
          const inputs = form.querySelectorAll("input[required]");
          for (const input of inputs) {
              if (!input.value.trim()) {
                  e.preventDefault();
                  alert("Please fill in all required fields.");
                  return;
              }
          }
      });
  });

  document.querySelector('#signup-form form').addEventListener('submit', async e => {
      e.preventDefault();
      const formData = new FormData(e.target);
      
      try {
          const response = await fetch('/handlers/signup_handler.php', {
              method: 'POST',
              body: formData
          });
          
          const data = await response.json();
          
          if (data.error === 'email_exists') {
              const errorDiv = document.createElement('div');
              errorDiv.className = 'error-message';
              errorDiv.textContent = 'This email already has an account associated with it';
              
              // Remove any existing error messages
              const existingError = document.querySelector('.error-message');
              if (existingError) {
                  existingError.remove();
              }
              
              // Insert error message after the submit button
              const submitButton = e.target.querySelector('button[type="submit"]');
              submitButton.parentNode.insertBefore(errorDiv, submitButton.nextSibling);
          } else {
              window.location.href = 'profile.php';
          }
      } catch (error) {
          console.error('Error:', error);
      }
  });
});
