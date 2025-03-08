<?php 

$current_page = 'Login';
require_once 'header.php'; 
?>

<div class="login-container">
  <div id="form-wrapper">
    <!-- Login Form -->
    <div id="login-form" class="form">
      <h2>Login</h2>
      <form action="/handlers/login_handler.php" method="POST">
        <label for="email">Email:</label>
        <input type="email" id="email" name="email" required>

        <label for="password">Password:</label>
        <input type="password" id="password" name="password" required>

        <button type="submit">Login</button>
      </form>
      <p>Don't have an account? <a href="#" id="switch-to-signup">Create one</a></p>
    </div>

    <!-- Signup Form -->
    <div id="signup-form" class="form hidden">
      <h2>Create Account</h2>
      <form action="/handlers/signup_handler.php" method="POST" novalidate>
        <label for="first_name">First Name:</label>
        <input type="text" id="first_name" name="first_name" required>

        <label for="last_name">Last Name:</label>
        <input type="text" id="last_name" name="last_name" required>

        <label for="email_signup">Email:</label>
        <input type="email" id="email_signup" name="email" required>

        <label for="password_signup">Password:</label>
        <input type="password" id="password_signup" name="password" required>

        <label for="confirm_password">Confirm Password:</label>
        <input type="password" id="confirm_password" name="confirm_password" required>

        <button type="submit">Sign Up</button>
      </form>
      <p>Already have an account? <a href="#" id="switch-to-login">Login</a></p>
    </div>
  </div>
</div>

<?php require_once 'footer.php'; ?>
