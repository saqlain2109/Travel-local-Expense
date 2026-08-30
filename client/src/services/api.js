// Auto-detect API URL:
// - If VITE_API_URL is set (Env Var), use it.
// - If running on localhost, assume Backend is on port 5000.
// - Otherwise (Production), use relative path '/api' (Backend serves Frontend).
const API_URL = import.meta.env.VITE_API_URL || (window.location.hostname === 'localhost' ? 'http://localhost:5000/api' : '/api');

export const api = {
    login: async (username, password) => {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error("API Error Response:", errorData);
            throw new Error(errorData.message || errorData.error || 'Login failed');
        }
        return response.json();
    },

    register: async (userData) => {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Registration failed');
        }
        return response.json();
    },

    forgotPassword: async (username) => {
        const response = await fetch(`${API_URL}/auth/forgot-password`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username }),
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.message || 'Failed to send reset email');
        }
        return response.json();
    },

    getClaims: async (userId, role) => {
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        if (role) params.append('role', role);

        const response = await fetch(`${API_URL}/claims?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch claims');
        return response.json();
    },

    createClaim: async (claimData, userId) => {
        const response = await fetch(`${API_URL}/claims`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...claimData, userId }),
        });
        if (!response.ok) throw new Error('Failed to create claim');
        return response.json();
    },

    updateClaimStatus: async (id, status, extraData = {}) => {
        const payload = typeof status === 'object' ? status : { status, ...extraData };
        const response = await fetch(`${API_URL}/claims/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to update claim status');
        }
        return response.json();
    },

    updateClaim: async (id, claimData) => {
        const response = await fetch(`${API_URL}/claims/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(claimData),
        });
        if (!response.ok) throw new Error('Failed to update claim details');
        return response.json();
    },

    deleteClaim: async (id) => {
        const response = await fetch(`${API_URL}/claims/${id}`, {
            method: 'DELETE',
        });
        if (!response.ok) throw new Error('Failed to delete claim');
        return response.json();
    },

    // User Management
    getUsers: async () => {
        const response = await fetch(`${API_URL}/users`);
        if (!response.ok) throw new Error('Failed to fetch users');
        return response.json();
    },

    createUser: async (userData) => {
        const response = await fetch(`${API_URL}/users`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
        });
        if (!response.ok) throw new Error('Failed to create user');
        return response.json();
    },

    updateUser: async (id, data) => {
        const response = await fetch(`${API_URL}/users/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) throw new Error('Failed to update user');
        return response.json();
    },

    deleteUser: async (id) => {
        const response = await fetch(`${API_URL}/users/${id}`, { method: 'DELETE' });
        return response.json();
    },

    // Matrix
    getMatrix: async () => {
        const response = await fetch(`${API_URL}/matrix`);
        return response.json();
    },
    createMatrix: async (data) => {
        const response = await fetch(`${API_URL}/matrix`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to create matrix rule');
        }
        return response.json();
    },
    updateMatrix: async (data) => {
        const response = await fetch(`${API_URL}/matrix`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || 'Failed to update matrix rule');
        }
        return response.json();
    },
    deleteMatrix: async (id) => {
        const response = await fetch(`${API_URL}/matrix/${id}`, { method: 'DELETE' });
        return response.json();
    },

    // Get Single Claim
    getClaim: async (id) => {
        const response = await fetch(`${API_URL}/claims/${id}`);
        if (!response.ok) throw new Error('Failed to fetch claim');
        return response.json();
    },

    // Department Master
    getDepartments: async () => {
        const response = await fetch(`${API_URL}/departments`);
        if (!response.ok) throw new Error('Failed to fetch departments');
        return response.json();
    },
    createDepartment: async (data) => {
        const response = await fetch(`${API_URL}/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to create department');
        }
        return response.json();
    },
    updateDepartment: async (id, data) => {
        const response = await fetch(`${API_URL}/departments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to update department');
        }
        return response.json();
    },
    deleteDepartment: async (id) => {
        const response = await fetch(`${API_URL}/departments/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete department');
        return response.json();
    },

    // Category Master & Limits
    getCategories: async () => {
        const response = await fetch(`${API_URL}/categories`);
        if (!response.ok) throw new Error('Failed to fetch categories');
        return response.json();
    },
    createCategory: async (data) => {
        const response = await fetch(`${API_URL}/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to create category');
        }
        return response.json();
    },
    updateCategory: async (id, data) => {
        const response = await fetch(`${API_URL}/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to update category');
        }
        return response.json();
    },
    deleteCategory: async (id) => {
        const response = await fetch(`${API_URL}/categories/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete category');
        return response.json();
    },

    // Clarification Workflow
    requestClarification: async (id, data) => {
        const response = await fetch(`${API_URL}/claims/${id}/clarify`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to request clarification');
        }
        return response.json();
    },
    respondClarification: async (id, data) => {
        const response = await fetch(`${API_URL}/claims/${id}/respond-clarification`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to submit response');
        }
        return response.json();
    },

    // Finance Disbursement & Payout
    disburseClaim: async (id, data) => {
        const response = await fetch(`${API_URL}/claims/${id}/disburse`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to disburse claim');
        }
        return response.json();
    },

    // Out-of-Office Delegation
    setDelegation: async (userId, data) => {
        const response = await fetch(`${API_URL}/users/${userId}/delegate`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.message || 'Failed to set delegation');
        }
        return response.json();
    },

    getDashboardStats: async (userId, role) => {
        const params = new URLSearchParams();
        if (userId) params.append('userId', userId);
        if (role) params.append('role', role);

        const response = await fetch(`${API_URL}/dashboard/summary?${params.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch dashboard stats');
        return response.json();
    }
};
