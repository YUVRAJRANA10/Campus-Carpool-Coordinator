// Hamburger Menu Functionality
document.addEventListener('DOMContentLoaded', function() {
    const menuToggle = document.getElementById('menu-toggle');
    const navActions = document.querySelector('.nav-actions');
    const hamburgerIcon = document.querySelector('.hamburger-icon');
    
    // Enhanced hamburger menu functionality
    if (menuToggle && navActions) {
        menuToggle.addEventListener('change', function() {
            if (this.checked) {
                navActions.style.right = '0';
                hamburgerIcon.classList.add('active');
                document.body.style.overflow = 'hidden'; // Prevent scrolling when menu is open
            } else {
                navActions.style.right = '-100%';
                hamburgerIcon.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
        
        // Close menu when clicking on nav links
        const navLinks = navActions.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', function() {
                menuToggle.checked = false;
                navActions.style.right = '-100%';
                hamburgerIcon.classList.remove('active');
                document.body.style.overflow = '';
            });
        });
        
        // Close menu when clicking outside
        document.addEventListener('click', function(e) {
            if (!hamburgerIcon.contains(e.target) && !navActions.contains(e.target)) {
                menuToggle.checked = false;
                navActions.style.right = '-100%';
                hamburgerIcon.classList.remove('active');
                document.body.style.overflow = '';
            }
        });
    }
});
