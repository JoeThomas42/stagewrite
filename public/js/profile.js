document.addEventListener('DOMContentLoaded', () => {
  // User removal functionality
  document.querySelectorAll('.remove-user').forEach(link => {
    link.addEventListener('click', e => {
      e.preventDefault();
      if (confirm('Are you sure you want to remove this user?')) {
        const userId = link.getAttribute('data-user-id');
        fetch('/handlers/delete_user.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
          },
          body: `user_id=${encodeURIComponent(userId)}`
        })
        .then(response => response.json())
        .then(data => {
          if (data.success) {
            // Remove the row from the table
            link.closest('tr').remove();
          } else {
            alert(data.error || 'An error occurred while trying to remove the user');
          }
        })
        .catch(err => {
          console.error('Error:', err);
          alert('An unexpected error occurred');
        });
      }
    });
  });
});
