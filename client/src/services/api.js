const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

    updateClaimStatus: async (id, status) => {
        const response = await fetch(`${API_URL}/claims/${id}/status`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status }),
        });
        if (!response.ok) throw new Error('Failed to update claim');
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
    updateMatrix: async (data) => {
        const response = await fetch(`${API_URL}/matrix`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
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
    }
};
