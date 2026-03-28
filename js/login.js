/**
 * Login Page Logic
 * Handles tab switching, form validation, and authentication
 */

document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const formWrappers = document.querySelectorAll('.form-wrapper');
    const switchTabLinks = document.querySelectorAll('.switch-tab');
    const errorAlert = document.getElementById('error-alert');
    const successAlert = document.getElementById('success-alert');
    const alertCloseBtn = document.querySelector('.alert-close');

    let isProcessing = false;

    // ===== Tab Navigation =====
    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            switchTab(targetTab);
        });
    });

    // Switch tab via link
    switchTabLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const targetTab = link.dataset.target;
            switchTab(targetTab);
        });
    });

    function switchTab(tabId) {
        // Update buttons
        tabButtons.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.tab === tabId);
        });

        // Update form wrappers
        formWrappers.forEach(wrapper => {
            wrapper.classList.toggle('active', wrapper.id === tabId);
        });

        // Clear any alerts
        hideAlerts();
    }

    // ===== Form Validation =====
    function validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    function validatePassword(password) {
        return password && password.length >= 6;
    }

    function getPasswordStrength(password) {
        if (!password) return '';
        if (password.length < 6) return 'weak';
        let strength = 0;
        if (password.length >= 8) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;
        return strength >= 3 ? 'strong' : strength >= 2 ? 'medium' : 'weak';
    }

    function setFieldError(fieldId, message) {
        const errorEl = document.getElementById(`${fieldId}-error`);
        const input = document.getElementById(fieldId);
        if (errorEl) errorEl.textContent = message;
        if (input) input.style.borderColor = message ? 'var(--error-color)' : 'var(--border-color)';
    }

    function clearFieldErrors(formId) {
        const wrapper = document.getElementById(formId);
        if (!wrapper) return;
        wrapper.querySelectorAll('.error-message').forEach(el => {
            el.textContent = '';
        });
        wrapper.querySelectorAll('input, select').forEach(input => {
            input.style.borderColor = 'var(--border-color)';
        });
    }

    function showAlert(type, message) {
        const alert = type === 'error' ? errorAlert : successAlert;
        const msgEl = alert.querySelector('.alert-message');
        msgEl.textContent = message;
        alert.style.display = 'flex';
    }

    function hideAlerts() {
        errorAlert.style.display = 'none';
        successAlert.style.display = 'none';
    }

    // Close alert on X click
    if (alertCloseBtn) {
        alertCloseBtn.addEventListener('click', hideAlerts);
    }

    // ===== Student Login Form =====
    const studentLoginForm = document.getElementById('student-login-form');
    if (studentLoginForm) {
        studentLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (isProcessing) return;

            clearFieldErrors('student-login');
            const email = document.getElementById('student-email').value.trim();
            const password = document.getElementById('student-password').value.trim();
            const btn = document.getElementById('student-login-btn');

            // Validation
            let hasError = false;
            if (!validateEmail(email)) {
                setFieldError('student-email', 'Please enter a valid email address');
                hasError = true;
            }
            if (!password) {
                setFieldError('student-password', 'Password is required');
                hasError = true;
            }
            if (hasError) return;

            setLoading(btn, true);
            hideAlerts();

            try {
                const response = await login(email, password);
                if (response.success) {
                    showAlert('success', 'Login successful! Redirecting...');
                    setTimeout(() => {
                        const redirectUrl = getRedirectUrl('user-dashboard.html');
                        window.location.href = redirectUrl;
                    }, 1000);
                } else {
                    showAlert('error', response.message || 'Login failed');
                }
            } catch (error) {
                showAlert('error', error.data?.message || error.message || 'Network error');
            } finally {
                setLoading(btn, false);
            }
        });

        // Real-time validation
        document.getElementById('student-email').addEventListener('blur', function() {
            if (!validateEmail(this.value.trim())) {
                setFieldError('student-email', 'Please enter a valid email address');
            } else {
                setFieldError('student-email', '');
            }
        });
    }

    // ===== Admin Login Form =====
    const adminLoginForm = document.getElementById('admin-login-form');
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (isProcessing) return;

            clearFieldErrors('admin-login');
            const email = document.getElementById('admin-email').value.trim();
            const password = document.getElementById('admin-password').value.trim();
            const btn = document.getElementById('admin-login-btn');

            // Validation
            let hasError = false;
            if (!validateEmail(email)) {
                setFieldError('admin-email', 'Please enter a valid email address');
                hasError = true;
            }
            if (!password) {
                setFieldError('admin-password', 'Password is required');
                hasError = true;
            }
            if (hasError) return;

            setLoading(btn, true);
            hideAlerts();

            try {
                const response = await login(email, password);
                if (response.success) {
                    if (response.user.role !== 'admin') {
                        showAlert('error', 'Access denied. Admin account required.');
                        setLoading(btn, false);
                        return;
                    }
                    showAlert('success', 'Admin login successful! Redirecting...');
                    setTimeout(() => {
                        const redirectUrl = getRedirectUrl('admin-dashboard.html');
                        window.location.href = redirectUrl;
                    }, 1000);
                } else {
                    showAlert('error', response.message || 'Invalid admin credentials');
                }
            } catch (error) {
                showAlert('error', error.data?.message || error.message || 'Network error');
            } finally {
                setLoading(btn, false);
            }
        });
    }

    // ===== Registration Form =====
    const registerForm = document.getElementById('register-form');
    if (registerForm) {
        // Password strength indicator
        const passwordInput = document.getElementById('reg-password');
        const confirmInput = document.getElementById('reg-confirm');
        const strengthEl = document.getElementById('password-strength');

        passwordInput.addEventListener('input', () => {
            const strength = getPasswordStrength(passwordInput.value);
            strengthEl.textContent = strength ? `Strength: ${strength}` : '';
            strengthEl.className = 'password-strength ' + strength;
        });

        confirmInput.addEventListener('input', () => {
            if (confirmInput.value && confirmInput.value !== passwordInput.value) {
                setFieldError('reg-confirm', 'Passwords do not match');
            } else {
                setFieldError('reg-confirm', '');
            }
        });

        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (isProcessing) return;

            clearFieldErrors('register');
            const name = document.getElementById('reg-name').value.trim();
            const email = document.getElementById('reg-email').value.trim();
            const college = document.getElementById('reg-college').value.trim();
            const regulation = document.getElementById('reg-regulation').value;
            const password = document.getElementById('reg-password').value;
            const confirmPassword = document.getElementById('reg-confirm').value;
            const btn = document.getElementById('register-btn');

            // Validation
            let hasError = false;
            if (name.length < 2) {
                setFieldError('reg-name', 'Name must be at least 2 characters');
                hasError = true;
            }
            if (!validateEmail(email)) {
                setFieldError('reg-email', 'Please enter a valid email address');
                hasError = true;
            }
            if (!college) {
                setFieldError('reg-college', 'College name is required');
                hasError = true;
            }
            if (!regulation) {
                setFieldError('reg-regulation', 'Please select your regulation');
                hasError = true;
            }
            if (!validatePassword(password)) {
                setFieldError('reg-password', 'Password must be at least 6 characters');
                hasError = true;
            }
            if (password !== confirmPassword) {
                setFieldError('reg-confirm', 'Passwords do not match');
                hasError = true;
            }
            if (hasError) return;

            setLoading(btn, true);
            hideAlerts();

            try {
                const response = await register({
                    name,
                    email,
                    password,
                    college,
                    regulation
                });
                if (response.success) {
                    showAlert('success', 'Account created successfully! Redirecting to your dashboard...');
                    setTimeout(() => {
                        const redirectUrl = getRedirectUrl('user-dashboard.html');
                        window.location.href = redirectUrl;
                    }, 1500);
                } else {
                    showAlert('error', response.message || 'Registration failed');
                }
            } catch (error) {
                showAlert('error', error.data?.message || error.message || 'Network error');
            } finally {
                setLoading(btn, false);
            }
        });
    }

    // ===== Redirect Handling =====
    function getRedirectUrl(defaultUrl) {
        const params = new URLSearchParams(window.location.search);
        const redirect = params.get('redirect');
        if (redirect) {
            // Security: only allow relative redirects within the app
            if (!redirect.startsWith('http') && !redirect.startsWith('//') && !redirect.startsWith('javascript:')) {
                return redirect;
            }
        }
        return defaultUrl;
    }

    // ===== Helper: Set button loading state =====
    function setLoading(btn, loading) {
        isProcessing = loading;
        if (btn) {
            btn.disabled = loading;
            btn.classList.toggle('loading', loading);
        }
    }

    // Check if user is already logged in
    (async () => {
        try {
            const user = await checkAuth();
            if (user) {
                // Determine default dashboard based on role
                const defaultUrl = user.role === 'admin' ? 'admin-dashboard.html' : 'user-dashboard.html';
                const redirectUrl = getRedirectUrl(defaultUrl);
                window.location.href = redirectUrl;
            }
        } catch (error) {
            // Not logged in, stay on page
        }
    })();
});