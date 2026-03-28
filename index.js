// Toggle mobile menu
function toggleMenu() {
    const navbar = document.getElementById("navbar");
    navbar.style.display = (navbar.style.display === "flex") ? "none" : "flex";
}

// Typing Animation
const headingText = "Welcome to EASY WORLD";
const paraText = "Learn, Grow, and Succeed with our immersive learning experience";

let i = 0, j = 0;
const headingSpeed = 100;
const paraSpeed = 30;

function typeHeading() {
    if (i < headingText.length) {
        document.getElementById("typing-text").innerHTML += headingText.charAt(i);
        i++;
        setTimeout(typeHeading, headingSpeed);
    }
}

function typePara() {
    if (j < paraText.length) {
        document.getElementById("typing-para").innerHTML += paraText.charAt(j);
        j++;
        setTimeout(typePara, paraSpeed);
    }
}

async function updateAuthUI() {
    const authNav = document.getElementById('auth-nav');
    const heroCta = document.getElementById('hero-cta');
    const footerLogin = document.getElementById('footer-login');

    try {
        const user = await checkAuth(); // from auth.js

        if (user) {
            // User is logged in
            const isAdmin = user.role === 'admin';
            const dashboardUrl = isAdmin ? 'admin-dashboard.html' : 'user-dashboard.html';

            // Update navbar
            if (authNav) {
                authNav.innerHTML = `
                    <div class="user-menu-container">
                        <button class="user-menu-btn" id="user-menu-btn">
                            <span class="user-icon">👤</span>
                            <span class="user-name">${user.name || (isAdmin ? 'Admin' : 'Student')}</span>
                            <span class="dropdown-icon">▼</span>
                        </button>
                        <div class="dropdown-menu" id="user-dropdown" style="display: none;">
                            <a href="${dashboardUrl}">Go to Dashboard</a>
                            <a href="#" id="nav-logout">Logout</a>
                        </div>
                    </div>
                `;

                // Add dropdown toggle
                const menuBtn = document.getElementById('user-menu-btn');
                const dropdown = document.getElementById('user-dropdown');
                if (menuBtn && dropdown) {
                    menuBtn.addEventListener('click', (e) => {
                        e.stopPropagation();
                        dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
                    });

                    document.addEventListener('click', () => {
                        dropdown.style.display = 'none';
                    });

                    document.getElementById('nav-logout').addEventListener('click', async (e) => {
                        e.preventDefault();
                        if (confirm('Logout?')) {
                            await logout();
                            window.location.reload();
                        }
                    });
                }
            }

            // Update hero CTA
            if (heroCta) {
                heroCta.textContent = 'Go to Dashboard';
                heroCta.href = dashboardUrl;
            }

            // Update footer login link
            if (footerLogin) {
                footerLogin.textContent = 'Dashboard';
                footerLogin.href = dashboardUrl;
            }
        } else {
            // Not logged in - show default login
            if (authNav) {
                authNav.innerHTML = `
                    <a href="login.html" class="login-btn">Login</a>
                `;
            }

            if (heroCta) {
                heroCta.textContent = 'Get Started';
                heroCta.href = 'login.html';
            }

            if (footerLogin) {
                footerLogin.textContent = 'Login';
                footerLogin.href = 'login.html';
            }
        }
    } catch (error) {
        console.error('Auth check failed:', error);
        // Default to not logged in
        if (authNav) {
            authNav.innerHTML = `<a href="login.html" class="login-btn">Login</a>`;
        }
    }
}

// Add styles for user menu dynamically
const authStyles = `
    <style>
        .user-menu-container {
            position: relative;
        }
        .user-menu-btn {
            display: flex;
            align-items: center;
            gap: 8px;
            background: rgba(255,255,255,0.2);
            border: none;
            color: white;
            padding: 8px 16px;
            border-radius: 25px;
            cursor: pointer;
            font-family: inherit;
            font-size: 0.9rem;
            transition: background 0.3s;
        }
        .user-menu-btn:hover {
            background: rgba(255,255,255,0.3);
        }
        .user-icon {
            font-size: 1.2rem;
        }
        .dropdown-icon {
            font-size: 0.6rem;
        }
        .dropdown-menu {
            position: absolute;
            top: 100%;
            right: 0;
            background: white;
            border-radius: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            min-width: 180px;
            overflow: hidden;
            z-index: 1000;
        }
        .dropdown-menu a {
            display: block;
            padding: 12px 20px;
            color: var(--text-dark);
            text-decoration: none;
            transition: background 0.2s;
        }
        .dropdown-menu a:hover {
            background: var(--bg-color);
        }
        .dropdown-menu a:first-child {
            border-bottom: 1px solid var(--border-color);
        }
        .login-btn {
            background: var(--primary-color) !important;
            color: white !important;
            padding: 8px 20px;
            border-radius: 25px;
            text-decoration: none;
            transition: background 0.3s;
        }
        .login-btn:hover {
            background: #e61e38;
        }
    </style>
`;
document.head.insertAdjacentHTML('beforeend', authStyles);

// On page load
window.onload = function () {
    typeHeading();
    typePara();
    updateAuthUI();
};