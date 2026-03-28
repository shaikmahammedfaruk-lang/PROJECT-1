/**
 * API Client
 * Handles all HTTP requests to the backend
 */

const API_BASE_URL = (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_API_URL) ||
                     (typeof window !== 'undefined' && window.API_URL) ||
                     '/api';

/**
 * Internal fetch wrapper that includes credentials (cookies)
 */
async function apiFetch(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;

    const fetchOptions = {
        ...options,
        credentials: 'include', // Send cookies automatically
        headers: {
            'Content-Type': 'application/json',
            ...(options.headers || {})
        }
    };

    // Don't stringify body if it's FormData
    if (fetchOptions.body && typeof fetchOptions.body !== 'string' && !(fetchOptions.body instanceof FormData)) {
        fetchOptions.body = JSON.stringify(fetchOptions.body);
    }

    try {
        const response = await fetch(url, fetchOptions);

        // Handle empty responses (like logout)
        const contentType = response.headers.get('content-type');
        let data = null;
        if (contentType && contentType.includes('application/json')) {
            data = await response.json();
        } else {
            data = { success: response.ok, message: response.statusText };
        }

        if (!response.ok) {
            const error = new Error(data.message || 'API request failed');
            error.statusCode = response.status;
            error.data = data;
            throw error;
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

/**
 * Public API methods
 */
const api = {
    // Auth endpoints
    register: (userData) => apiFetch('/auth/register', {
        method: 'POST',
        body: userData
    }),

    login: (credentials) => apiFetch('/auth/login', {
        method: 'POST',
        body: credentials
    }),

    logout: () => apiFetch('/auth/logout', {
        method: 'POST'
    }),

    getCurrentUser: () => apiFetch('/auth/me'),

    // User endpoints
    getProfile: () => apiFetch('/users/profile'),

    updateProfile: (updates) => apiFetch('/users/profile', {
        method: 'PUT',
        body: updates
    }),

    changePassword: ({ currentPassword, newPassword }) => apiFetch('/users/password', {
        method: 'PUT',
        body: { currentPassword, newPassword }
    }),

    // Admin endpoints
    getAdminStats: () => apiFetch('/admin/stats'),

    getStudents: (filters) => apiFetch(`/admin/students?${new URLSearchParams(filters).toString()}`),

    getStudent: (id) => apiFetch(`/admin/students/${id}`),

    updateStudent: (id, updates) => apiFetch(`/admin/students/${id}`, {
        method: 'PUT',
        body: updates
    }),

    deleteStudent: (id) => apiFetch(`/admin/students/${id}`, {
        method: 'DELETE'
    }),

    uploadFile: (formData) => {
        // FormData is sent directly; don't JSON.stringify
        return fetch(`${API_BASE_URL}/admin/upload`, {
            method: 'POST',
            credentials: 'include',
            body: formData
        }).then(async (res) => {
            const data = await res.json();
            if (!res.ok) {
                const error = new Error(data.message || 'Upload failed');
                error.statusCode = res.status;
                error.data = data;
                throw error;
            }
            return data;
        });
    },

    // API Key endpoints
    getApiKeys: () => apiFetch('/apikeys'),

    createApiKey: (keyData) => apiFetch('/apikeys', {
        method: 'POST',
        body: keyData
    }),

    getApiKeyStats: () => apiFetch('/apikeys/stats'),

    updateApiKey: (id, updates) => apiFetch(`/apikeys/${id}`, {
        method: 'PUT',
        body: updates
    }),

    deleteApiKey: (id) => apiFetch(`/apikeys/${id}`, {
        method: 'DELETE'
    }),
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
}