/**
 * Student Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Elements
    const sidebar = document.getElementById('sidebar');
    const sidebarToggle = document.getElementById('sidebar-toggle');
    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
    const navItems = document.querySelectorAll('.nav-item');
    const sections = document.querySelectorAll('.section');
    const logoutBtn = document.getElementById('logout-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const alertEl = document.getElementById('alert');
    const alertCloseBtn = document.querySelector('.alert-close');

    // Profile elements
    const welcomeName = document.getElementById('welcome-name');
    const userName = document.getElementById('user-name');
    const userRole = document.getElementById('user-role');
    const userAvatar = document.getElementById('user-avatar');

    // Profile summary elements
    const profileName = document.getElementById('profile-name');
    const profileEmail = document.getElementById('profile-email');
    const profileCollege = document.getElementById('profile-college');
    const profileRegulation = document.getElementById('profile-regulation');
    const profileRole = document.getElementById('profile-role');

    // Edit profile form
    const profileForm = document.getElementById('profile-form');
    const editName = document.getElementById('edit-name');
    const editEmail = document.getElementById('edit-email');
    const editCollege = document.getElementById('edit-college');
    const editRegulation = document.getElementById('edit-regulation');
    const cancelEditBtn = document.getElementById('cancel-edit');

    // Password form
    const passwordForm = document.getElementById('password-form');

    // API Key management
    const createApiKeyBtn = document.getElementById('create-api-key-btn');
    const apiKeysList = document.getElementById('api-keys-list');

    // Course items
    const courseItems = document.querySelectorAll('.course-item');

    let currentUser = null;

    // ===== Helper Functions =====
    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    function showAlert(type, message, autoClose = true) {
        alertEl.className = `alert alert-${type}`;
        alertEl.querySelector('.alert-message').textContent = message;
        alertEl.style.display = 'flex';
        if (autoClose) {
            setTimeout(hideAlert, 5000);
        }
    }

    function hideAlert() {
        alertEl.style.display = 'none';
    }

    function setLoading(btn, loading) {
        btn.disabled = loading;
        if (loading) {
            btn.classList.add('loading');
        } else {
            btn.classList.remove('loading');
        }
    }

    // ===== Authentication Check =====
    async function initAuth() {
        try {
            currentUser = await checkAuth();
            if (!currentUser) {
                // Not authenticated, redirect to login
                window.location.href = 'login.html';
                return;
            }

            // If admin somehow logged in, redirect to admin dashboard
            if (currentUser.role === 'admin') {
                window.location.href = 'admin-dashboard.html';
                return;
            }

            // Populate UI
            populateUserInfo();
            setupCourseLinks();
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = 'login.html';
        }
    }

    function populateUserInfo() {
        if (!currentUser) return;

        // Header
        userName.textContent = currentUser.name || 'User';
        userRole.textContent = currentUser.role === 'student' ? 'Student' : currentUser.role;

        // Welcome banner
        welcomeName.textContent = currentUser.name?.split(' ')[0] || 'Student';

        // User avatar tooltip (we use student.png as placeholder)
        // Could be replaced with actual avatar image in future

        // Profile summary
        profileName.textContent = currentUser.name || '-';
        profileEmail.textContent = currentUser.email || '-';
        profileCollege.textContent = currentUser.college || '-';
        profileRegulation.textContent = currentUser.regulation || '-';
        profileRole.textContent = currentUser.role === 'student' ? 'Student' : currentUser.role;

        // Edit profile form
        editName.value = currentUser.name || '';
        editEmail.value = currentUser.email || '';
        editCollege.value = currentUser.college || '';
        editRegulation.value = currentUser.regulation || '';
    }

    // ===== Course Links Setup =====
    function setupCourseLinks() {
        if (!currentUser?.regulation) return;

        courseItems.forEach(item => {
            const course = item.dataset.course;
            if (course) {
                // Determine correct branch folder based on user's regulation
                const branchFolder = currentUser.regulation === 'R20' ? 'R20' : 'R23';
                const pathMap = {
                    'CSE': `${branchFolder}/CSE/cse-semisters.html`,
                    'AIML': `${branchFolder}/AIML/aiml-semisters.html`,
                    'ECE': `${branchFolder}/ECE/ece-semisters.html`,
                    'EEE': `${branchFolder}/EEE/eee-semisters.html`
                };

                if (pathMap[course]) {
                    item.href = pathMap[course];
                } else {
                    item.style.pointerEvents = 'none';
                    item.style.opacity = '0.6';
                }
            }
        });
    }

    // ===== Navigation =====
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = item.dataset.section;
            if (sectionId) {
                switchSection(sectionId);
                updateActiveNav(sectionId);
            }
        });
    });

    function switchSection(sectionId) {
        sections.forEach(sec => {
            sec.classList.toggle('active', sec.id === `section-${sectionId}`);
        });

        // Load API keys when settings tab is opened
        if (sectionId === 'settings' && currentUser) {
            loadApiKeys();
        }
    }

    function updateActiveNav(sectionId) {
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.section === sectionId);
        });
    }

    // Sidebar toggle for mobile
    if (sidebarToggle) {
        sidebarToggle.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
        });
    }

    if (mobileMenuBtn) {
        mobileMenuBtn.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });
    }

    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (window.innerWidth <= 768) {
            if (!sidebar.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
                sidebar.classList.remove('active');
            }
        }
    });

    // ===== Profile Edit =====
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const updates = {
                name: editName.value.trim(),
                college: editCollege.value.trim()
            };

            const submitBtn = profileForm.querySelector('button[type="submit"]');
            setLoading(submitBtn, true);

            try {
                const response = await api.updateProfile(updates);
                if (response.success) {
                    showAlert('success', 'Profile updated successfully!');
                    // Update cached user and UI
                    currentUser = { ...currentUser, ...updates };
                    cacheUser(currentUser);
                    populateUserInfo();
                } else {
                    showAlert('error', response.message || 'Failed to update profile');
                }
            } catch (error) {
                showAlert('error', error.data?.message || error.message);
            } finally {
                setLoading(submitBtn, false);
            }
        });
    }

    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            editName.value = currentUser.name || '';
            editCollege.value = currentUser.college || '';
            showAlert('success', 'Changes cancelled', false);
            setTimeout(hideAlert, 2000);
        });
    }

    // ===== API Key Management =====
    let apiKeys = [];

    async function loadApiKeys() {
        try {
            const response = await api.get('/apikeys');
            if (!response.success) throw new Error(response.message);
            apiKeys = response.apiKeys;
            renderApiKeys();
        } catch (error) {
            console.error('Error loading API keys:', error);
            apiKeysList.innerHTML = '<p class="error">Failed to load API keys.</p>';
        }
    }

    function renderApiKeys() {
        if (apiKeys.length === 0) {
            apiKeysList.innerHTML = '<p class="no-data">No API keys yet. Create one to get started.</p>';
            return;
        }

        apiKeysList.innerHTML = `
            <table class="api-keys-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Status</th>
                        <th>Created</th>
                        <th>Last Used</th>
                        <th>Usage</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${apiKeys.map(key => `
                        <tr data-id="${key.id}">
                            <td>${escapeHtml(key.key_name)}</td>
                            <td><span class="badge ${key.is_active ? 'active' : 'inactive'}">${key.is_active ? 'Active' : 'Inactive'}</span></td>
                            <td>${formatDate(key.created_at)}</td>
                            <td>${key.last_used_at ? formatDate(key.last_used_at) : 'Never'}</td>
                            <td>${key.usage_count || 0} requests</td>
                            <td>
                                <button class="btn-edit-api-key" data-id="${key.id}">Edit</button>
                                <button class="btn-delete-api-key" data-id="${key.id}">Revoke</button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;

        // Attach event listeners
        document.querySelectorAll('.btn-edit-api-key').forEach(btn => {
            btn.addEventListener('click', () => openEditApiKeyModal(btn.dataset.id));
        });
        document.querySelectorAll('.btn-delete-api-key').forEach(btn => {
            btn.addEventListener('click', () => deleteApiKey(btn.dataset.id));
        });
    }

    // Modal elements
    const apiKeyModal = document.getElementById('api-key-modal');
    const modalTitle = document.getElementById('modal-title');
    const apiKeyForm = document.getElementById('api-key-form');
    const apiKeyIdInput = document.getElementById('api-key-id');
    const apiKeyNameInput = document.getElementById('api-key-name');
    const apiKeyActiveInput = document.getElementById('api-key-active');
    const apiKeyExpiresInput = document.getElementById('api-key-expires');
    const apiKeyDisplay = document.getElementById('api-key-display');
    const plainApiKeySpan = document.getElementById('plain-api-key');
    const cancelApiKeyBtn = document.getElementById('cancel-api-key');
    const apiKeyModalClose = document.getElementById('api-key-modal-close');

    function openCreateApiKeyModal() {
        modalTitle.textContent = 'Generate New API Key';
        apiKeyForm.reset();
        apiKeyIdInput.value = '';
        apiKeyDisplay.style.display = 'none';
        apiKeyModal.classList.add('active');
    }

    function openEditApiKeyModal(id) {
        const key = apiKeys.find(k => k.id == id);
        if (!key) return;

        modalTitle.textContent = 'Edit API Key';
        apiKeyIdInput.value = key.id;
        apiKeyNameInput.value = key.key_name;
        apiKeyActiveInput.value = key.is_active ? 'true' : 'false';
        apiKeyExpiresInput.value = key.expires_at ? key.expires_at.slice(0, 16) : '';
        apiKeyDisplay.style.display = 'none';
        apiKeyModal.classList.add('active');
    }

    function closeApiKeyModal() {
        apiKeyModal.classList.remove('active');
    }

    createApiKeyBtn.addEventListener('click', openCreateApiKeyModal);
    cancelApiKeyBtn.addEventListener('click', closeApiKeyModal);
    apiKeyModalClose.addEventListener('click', closeApiKeyModal);
    apiKeyModal.addEventListener('click', (e) => {
        if (e.target === apiKeyModal) closeApiKeyModal();
    });

    apiKeyForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const id = apiKeyIdInput.value;
        const keyName = apiKeyNameInput.value.trim();
        const isActive = apiKeyActiveInput.value === 'true';
        const expiresAt = apiKeyExpiresInput.value || null;

        try {
            let response;
            if (id) {
                // Update existing
                response = await api.updateApiKey(id, {
                    keyName,
                    isActive,
                    expiresAt
                });
                if (!response.success) throw new Error(response.message);
                showAlert('success', response.message || 'API key updated');
                closeApiKeyModal();
                await loadApiKeys();
            } else {
                // Create new
                response = await api.createApiKey({ keyName });
                if (!response.success) throw new Error(response.message);

                // Show the generated API key in the modal
                plainApiKeySpan.textContent = response.apiKey.api_key;
                apiKeyDisplay.style.display = 'block';
                apiKeyIdInput.value = response.apiKey.id;
                apiKeyNameInput.value = response.apiKey.key_name;
                apiKeyActiveInput.value = response.apiKey.is_active ? 'true' : 'false';

                // Change button to "Done" - user can close after copying
                const submitBtn = apiKeyForm.querySelector('button[type="submit"]');
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Done';
                submitBtn.onclick = () => {
                    closeApiKeyModal();
                    submitBtn.textContent = originalText;
                    submitBtn.onclick = null;
                    loadApiKeys();
                };
            }
        } catch (error) {
            showAlert('error', error.data?.message || error.message);
        }
    });

    async function deleteApiKey(id) {
        if (!confirm('Are you sure you want to revoke this API key? This cannot be undone.')) {
            return;
        }

        try {
            const response = await api.deleteApiKey(id);
            if (!response.success) throw new Error(response.message);
            showAlert('success', 'API key revoked');
            await loadApiKeys();
        } catch (error) {
            showAlert('error', error.data?.message || error.message);
        }
    }

    // Helper to escape HTML
    function escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // ===== Change Password =====
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('current-password').value;
            const newPassword = document.getElementById('new-password').value;
            const confirmPassword = document.getElementById('confirm-password').value;

            if (newPassword !== confirmPassword) {
                showAlert('error', 'New passwords do not match');
                return;
            }

            if (newPassword.length < 6) {
                showAlert('error', 'Password must be at least 6 characters');
                return;
            }

            const submitBtn = passwordForm.querySelector('button[type="submit"]');
            setLoading(submitBtn, true);

            try {
                const response = await api.changePassword({
                    currentPassword,
                    newPassword
                });
                if (response.success) {
                    showAlert('success', 'Password changed successfully!');
                    passwordForm.reset();
                } else {
                    showAlert('error', response.message || 'Failed to change password');
                }
            } catch (error) {
                showAlert('error', error.data?.message || error.message);
            } finally {
                setLoading(submitBtn, false);
            }
        });
    }

    // ===== Logout =====
    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            if (confirm('Are you sure you want to logout?')) {
                try {
                    await logout();
                    window.location.href = 'index.html';
                } catch (error) {
                    showAlert('error', 'Logout failed. Please try again.');
                }
            }
        });
    }

    // ===== Alert Close =====
    if (alertCloseBtn) {
        alertCloseBtn.addEventListener('click', hideAlert);
    }

    // ===== Initialize =====
    await initAuth();
});