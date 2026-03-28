/**
 * Authentication Utilities
 * Provides login, register, logout, and auth state management
 */

// Local storage key for cached user data (for quick UI updates, not for auth)
const USER_CACHE_KEY = 'easyworld_user';

/**
 * Store user data in localStorage for quick access
 */
function cacheUser(user) {
    try {
        localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } catch (e) {
        console.warn('Could not cache user:', e);
    }
}

/**
 * Clear cached user data
 */
function clearUserCache() {
    try {
        localStorage.removeItem(USER_CACHE_KEY);
    } catch (e) {
        console.warn('Could not clear user cache:', e);
    }
}

/**
 * Get cached user data
 */
function getCachedUser() {
    try {
        const cached = localStorage.getItem(USER_CACHE_KEY);
        return cached ? JSON.parse(cached) : null;
    } catch (e) {
        return null;
    }
}

/**
 * Check if user is authenticated by calling the server
 */
async function checkAuth() {
    try {
        const response = await api.getCurrentUser();
        if (response.success && response.user) {
            cacheUser(response.user);
            return response.user;
        }
    } catch (error) {
        // If not authenticated, clear cache
        clearUserCache();
    }
    return null;
}

/**
 * Register a new student account
 */
async function register(userData) {
    const response = await api.register(userData);
    if (response.success && response.user) {
        cacheUser(response.user);
    }
    return response;
}

/**
 * Login user (student or admin)
 */
async function login(email, password, rememberMe = false) {
    const response = await api.login({ email, password });
    if (response.success && response.user) {
        cacheUser(response.user);
        // Note: rememberMe could be used to extend token lifetime if we had refresh tokens
        // With current HTTP-only cookie, it's ignored but kept for API compatibility
    }
    return response;
}

/**
 * Logout user
 */
async function logout() {
    try {
        await api.logout();
    } finally {
        clearUserCache();
    }
    return { success: true, message: 'Logged out' };
}

/**
 * Get current user (from cache or server)
 */
async function getCurrentUser(forceRefresh = false) {
    if (!forceRefresh) {
        const cached = getCachedUser();
        if (cached) {
            return cached;
        }
    }
    return await checkAuth();
}

/**
 * Listen for auth changes (polls localStorage)
 * Note: For cross-tab sync, we could use storage events
 */
function onAuthChange(callback) {
    // Provide immediate cached value
    callback(getCachedUser());

    // Listen for storage changes (from other tabs)
    window.addEventListener('storage', (e) => {
        if (e.key === USER_CACHE_KEY) {
            const user = e.newValue ? JSON.parse(e.newValue) : null;
            callback(user);
        }
    });

    // Return unsubscribe function
    return () => {
        window.removeEventListener('storage', callback);
    };
}

/**
 * Check if user has a specific role
 */
function hasRole(user, role) {
    return user && user.role === role;
}

/**
 * Check if user is admin
 */
function isAdmin(user) {
    return hasRole(user, 'admin');
}

/**
 * Check if user is student
 */
function isStudent(user) {
    return hasRole(user, 'student');
}

// Export if in module environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        checkAuth,
        register,
        login,
        logout,
        getCurrentUser,
        onAuthChange,
        hasRole,
        isAdmin,
        isStudent,
        getCachedUser,
        clearUserCache
    };
}