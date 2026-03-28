/**
 * Admin Dashboard Logic
 */

document.addEventListener('DOMContentLoaded', async () => {
    // Elements
    const navItems = document.querySelectorAll('.nav-item');
    const tabContents = document.querySelectorAll('.tab-content');
    const logoutBtn = document.getElementById('logout-btn');
    const loadingOverlay = document.getElementById('loading-overlay');
    const alertEl = document.getElementById('alert');
    const userNameEl = document.getElementById('user-name');

    // Overview tab elements
    const totalStudentsEl = document.getElementById('stat-total-students');
    const todaySignupsEl = document.getElementById('stat-today-signups');
    const totalAdminsEl = document.getElementById('stat-total-admins');
    const regulationChart = document.getElementById('regulation-chart');
    const recentStudentsEl = document.getElementById('recent-students');

    // Students tab elements
    const searchInput = document.getElementById('search-input');
    const filterRole = document.getElementById('filter-role');
    const filterCollege = document.getElementById('filter-college');
    const filterRegulation = document.getElementById('filter-regulation');
    const studentsTbody = document.getElementById('students-tbody');
    const selectAllCheckbox = document.getElementById('select-all');
    const paginationEl = document.getElementById('pagination');
    const editModal = document.getElementById('edit-modal');
    const editStudentForm = document.getElementById('edit-student-form');
    const cancelEditBtn = document.getElementById('cancel-edit');

    // Upload tab elements
    const uploadForm = document.getElementById('upload-form');
    const uploadBtn = document.getElementById('upload-btn');
    const uploadProgress = document.querySelector('.upload-progress');
    const progressFill = document.getElementById('upload-progress');
    const uploadsGrid = document.getElementById('uploads-grid');

    let currentPage = 1;
    const pageSize = 10;
    let allStudents = [];
    let currentFilters = {};

    // ===== Helper Functions =====
    function showLoading() {
        loadingOverlay.style.display = 'flex';
    }

    function hideLoading() {
        loadingOverlay.style.display = 'none';
    }

    function showAlert(type, message, autoClose = true) {
        alertEl.className = `alert ${type === 'success' ? 'alert-success' : 'alert-error'}`;
        alertEl.querySelector('.alert-message').textContent = message;
        alertEl.style.display = 'flex';
        if (autoClose) setTimeout(() => alertEl.style.display = 'none', 5000);
    }

    function hideAlert() {
        alertEl.style.display = 'none';
    }

    function setLoading(element, loading) {
        if (!element) return;
        element.disabled = loading;
        if (loading) {
            element.classList.add('loading');
        } else {
            element.classList.remove('loading');
        }
    }

    function formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    // ===== Authentication Check =====
    async function initAuth() {
        try {
            const user = await checkAuth();
            if (!user) {
                window.location.href = 'login.html';
                return;
            }

            if (user.role !== 'admin') {
                window.location.href = 'user-dashboard.html';
                return;
            }

            userNameEl.textContent = user.name || 'Administrator';
            await loadDashboard();
        } catch (error) {
            console.error('Auth check failed:', error);
            window.location.href = 'login.html';
        }
    }

    // ===== Tab Navigation =====
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            const tabId = item.dataset.tab;
            switchTab(tabId);
        });
    });

    function switchTab(tabId) {
        navItems.forEach(item => {
            item.classList.toggle('active', item.dataset.tab === tabId);
        });
        tabContents.forEach(content => {
            content.classList.toggle('active', content.id === `tab-${tabId}`);
        });

        // Load data specific to tab
        if (tabId === 'students') {
            loadStudents();
        } else if (tabId === 'upload') {
            loadRecentUploads();
        } else if (tabId === 'overview') {
            loadStats();
        }
    }

    // ===== Dashboard Data Loading =====
    async function loadDashboard() {
        showLoading();
        try {
            await loadStats();
        } catch (error) {
            showAlert('error', 'Failed to load dashboard data');
        } finally {
            hideLoading();
        }
    }

    async function loadStats() {
        try {
            const response = await api.getAdminStats();
            if (!response.success) throw new Error(response.message);

            const stats = response.stats;

            totalStudentsEl.textContent = stats.totalStudents;
            todaySignupsEl.textContent = stats.todaySignups;
            totalAdminsEl.textContent = stats.totalAdmins;

            // Regulation chart
            updateRegulationChart(stats.byRegulation);

            // Recent students
            displayRecentStudents(allStudents.slice(0, 5));
        } catch (error) {
            console.error('Error loading stats:', error);
            totalStudentsEl.textContent = '-';
            todaySignupsEl.textContent = '-';
            totalAdminsEl.textContent = '-';
        }
    }

    function updateRegulationChart(byRegulation) {
        // Clear existing bars except the template
        regulationChart.innerHTML = '';

        const r23Data = byRegulation.find(r => r.regulation === 'R23');
        const r20Data = byRegulation.find(r => r.regulation === 'R20');

        const r23Count = r23Data ? parseInt(r23Data.count) : 0;
        const r20Count = r20Data ? parseInt(r20Data.count) : 0;
        const total = r23Count + r20Count;

        [ { label: 'R23', count: r23Count }, { label: 'R20', count: r20Count } ].forEach(item => {
            const percent = total > 0 ? (item.count / total) * 100 : 0;
            const barHtml = `
                <div class="chart-bar" data-regulation="${item.label}">
                    <span class="bar-label">${item.label}</span>
                    <div class="bar-fill-container">
                        <div class="bar-fill" style="width: ${percent}%"></div>
                    </div>
                    <span class="bar-value">${item.count}</span>
                </div>
            `;
            regulationChart.insertAdjacentHTML('beforeend', barHtml);
        });
    }

    function displayRecentStudents(students) {
        if (students.length === 0) {
            recentStudentsEl.innerHTML = '<p class="no-data">No students yet.</p>';
            return;
        }

        recentStudentsEl.innerHTML = students.map(student => `
            <div class="recent-item">
                <div class="recent-avatar">${student.name ? student.name.charAt(0).toUpperCase() : '?'}</div>
                <div class="recent-info">
                    <div class="recent-name">${student.name}</div>
                    <div class="recent-email">${student.email}</div>
                </div>
                <div class="recent-date">${formatDate(student.created_at)}</div>
            </div>
        `).join('');
    }

    // ===== Students Management =====
    async function loadStudents() {
        if (allStudents.length > 0) return; // Already loaded

        showLoading();
        try {
            const response = await api.getStudents(currentFilters);
            if (!response.success) throw new Error(response.message);

            allStudents = response.students;
            renderStudentsTable(allStudents);
            populateCollegeFilter(allStudents);
        } catch (error) {
            showAlert('error', 'Failed to load students: ' + (error.message || 'Unknown error'));
            studentsTbody.innerHTML = '<tr><td colspan="8" class="loading">Error loading students</td></tr>';
        } finally {
            hideLoading();
        }
    }

    function populateCollegeFilter(students) {
        const colleges = [...new Set(students.map(s => s.college).filter(Boolean))];
        filterCollege.innerHTML = '<option value="">All Colleges</option>';
        colleges.forEach(college => {
            filterCollege.innerHTML += `<option value="${college}">${college}</option>`;
        });
    }

    function renderStudentsTable(students, page = 1) {
        const start = (page - 1) * pageSize;
        const end = start + pageSize;
        const pageData = students.slice(start, end);
        const totalPages = Math.ceil(students.length / pageSize);

        if (students.length === 0) {
            studentsTbody.innerHTML = '<tr><td colspan="8" class="loading">No students found</td></tr>';
            paginationEl.innerHTML = '';
            return;
        }

        studentsTbody.innerHTML = pageData.map(student => `
            <tr>
                <td><input type="checkbox" class="student-checkbox" data-id="${student.id}"></td>
                <td>${student.name}</td>
                <td>${student.email}</td>
                <td>${student.college || '-'}</td>
                <td>${student.regulation || '-'}</td>
                <td><span class="role-badge ${student.role}">${student.role}</span></td>
                <td>${formatDate(student.created_at)}</td>
                <td class="actions-cell">
                    <button class="btn-edit" data-id="${student.id}">Edit</button>
                    <button class="btn-delete" data-id="${student.id}">Delete</button>
                </td>
            </tr>
        `).join('');

        renderPagination(totalPages, page);

        // Attach event listeners
        attachStudentTableEvents(pageData, page);
    }

    function renderPagination(totalPages, currentPage) {
        paginationEl.innerHTML = '';
        if (totalPages <= 1) return;

        for (let i = 1; i <= totalPages; i++) {
            const btn = document.createElement('button');
            btn.textContent = i;
            btn.classList.toggle('active', i === currentPage);
            btn.addEventListener('click', () => {
                currentPage = i;
                renderStudentsTable(allStudents, i);
            });
            paginationEl.appendChild(btn);
        }
    }

    function attachStudentTableEvents(students, page) {
        document.querySelectorAll('.btn-edit').forEach(btn => {
            btn.addEventListener('click', () => openEditModal(btn.dataset.id));
        });

        document.querySelectorAll('.btn-delete').forEach(btn => {
            btn.addEventListener('click', () => deleteStudent(btn.dataset.id));
        });
    }

    // ===== Filters & Search =====
    async function applyFilters() {
        currentFilters = {};
        if (filterRole.value) currentFilters.role = filterRole.value;
        if (filterCollege.value) currentFilters.college = filterCollege.value;
        if (filterRegulation.value) currentFilters.regulation = filterRegulation.value;
        if (searchInput.value.trim()) currentFilters.search = searchInput.value.trim();

        allStudents = [];
        currentPage = 1;
        await loadStudents();
    }

    [searchInput, filterRole, filterCollege, filterRegulation].forEach(el => {
        el.addEventListener('change', applyFilters);
        el.addEventListener('input', (e) => {
            if (e.target === searchInput) {
                // Debounce search
                clearTimeout(searchInput.timeout);
                searchInput.timeout = setTimeout(applyFilters, 300);
            } else {
                applyFilters();
            }
        });
    });

    // Select All Checkbox
    selectAllCheckbox.addEventListener('change', (e) => {
        document.querySelectorAll('.student-checkbox').forEach(cb => {
            cb.checked = e.target.checked;
        });
    });

    // ===== Edit Student Modal =====
    function openEditModal(studentId) {
        const student = allStudents.find(s => s.id == studentId);
        if (!student) return;

        document.getElementById('edit-student-id').value = student.id;
        document.getElementById('edit-name').value = student.name || '';
        document.getElementById('edit-email').value = student.email || '';
        document.getElementById('edit-college').value = student.college || '';
        document.getElementById('edit-regulation').value = student.regulation || '';
        document.getElementById('edit-role').value = student.role || 'student';

        editModal.classList.add('active');
    }

    function closeEditModal() {
        editModal.classList.remove('active');
    }

    cancelEditBtn.addEventListener('click', closeEditModal);
    editModal.querySelector('.modal-close').addEventListener('click', closeEditModal);
    editModal.addEventListener('click', (e) => {
        if (e.target === editModal) closeEditModal();
    });

    editStudentForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const studentId = document.getElementById('edit-student-id').value;
        const updates = {
            name: document.getElementById('edit-name').value.trim(),
            college: document.getElementById('edit-college').value.trim(),
            regulation: document.getElementById('edit-regulation').value,
            role: document.getElementById('edit-role').value
        };

        try {
            const response = await api.updateStudent(studentId, updates);
            if (response.success) {
                showAlert('success', 'Student updated successfully');
                closeEditModal();
                allStudents = []; // Reset cache to refetch
                await loadStudents();
            } else {
                showAlert('error', response.message || 'Failed to update student');
            }
        } catch (error) {
            showAlert('error', error.data?.message || error.message);
        }
    });

    // ===== Delete Student =====
    async function deleteStudent(studentId) {
        if (!confirm('Are you sure you want to delete this student? This action cannot be undone.')) {
            return;
        }

        try {
            const response = await api.deleteStudent(studentId);
            if (response.success) {
                showAlert('success', 'Student deleted successfully');
                allStudents = []; // Reset cache
                await loadStudents();
            } else {
                showAlert('error', response.message || 'Failed to delete student');
            }
        } catch (error) {
            showAlert('error', error.data?.message || error.message);
        }
    }

    // ===== File Upload =====
    const fileInput = document.getElementById('upload-file');
    const fileInfo = document.getElementById('file-info');

    fileInput.addEventListener('change', (e) => {
        if (e.target.files.length > 0) {
            const file = e.target.files[0];
            fileInfo.textContent = `${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)`;
        } else {
            fileInfo.textContent = '';
        }
    });

    uploadForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = new FormData();
        formData.append('title', document.getElementById('upload-title').value);
        formData.append('course', document.getElementById('upload-course').value);
        formData.append('branch', document.getElementById('upload-branch').value);
        formData.append('description', document.getElementById('upload-description').value);
        formData.append('file', fileInput.files[0]);

        setLoading(uploadBtn, true);
        uploadProgress.style.display = 'block';

        try {
            const xhr = new XMLHttpRequest();
            xhr.open('POST', '/api/admin/upload');

            xhr.upload.addEventListener('progress', (e) => {
                if (e.lengthComputable) {
                    const percent = (e.loaded / e.total) * 100;
                    progressFill.style.width = percent + '%';
                }
            });

            xhr.onload = () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    showAlert('success', response.message || 'File uploaded successfully');
                    uploadForm.reset();
                    fileInfo.textContent = '';
                    progressFill.style.width = '0%';
                    uploadProgress.style.display = 'none';
                    loadRecentUploads();
                } else {
                    const error = JSON.parse(xhr.responseText);
                    showAlert('error', error.message || 'Upload failed');
                    progressFill.style.width = '0%';
                    uploadProgress.style.display = 'none';
                }
                setLoading(uploadBtn, false);
            };

            xhr.onerror = () => {
                showAlert('error', 'Network error during upload');
                progressFill.style.width = '0%';
                uploadProgress.style.display = 'none';
                setLoading(uploadBtn, false);
            };

            xhr.send(formData);
        } catch (error) {
            showAlert('error', error.message || 'Upload failed');
            uploadProgress.style.display = 'none';
            setLoading(uploadBtn, false);
        }
    });

    async function loadRecentUploads() {
        // For now, just show placeholder - could be enhanced with API endpoint
        uploadsGrid.innerHTML = '<p class="no-uploads">Upload history not yet implemented. Coming soon!</p>';
    }

    // ===== Logout =====
    logoutBtn.addEventListener('click', async () => {
        if (confirm('Are you sure you want to logout?')) {
            try {
                await logout();
                window.location.href = 'login.html';
            } catch (error) {
                showAlert('error', 'Logout failed. Please try again.');
            }
        }
    });

    // ===== Initialize =====
    await initAuth();
});