import api from './api.js';

const clearAuthData = () => { 
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
}

const handleApiError = (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
};

export const userApi = {

    register: async (userData) => {
        try {
            const response = await api.post('/users/register', userData);
            if (response.data.success) {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            handleApiError(error, 'register');
        }
    },

    login: async (credentials) => {
        try {
            const response = await api.post('/users/login', credentials);
            if (response.data.success) {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            handleApiError(error, 'login');
        }
    },

    googleAuth: async (userData) => {
        try {
            const response = await api.post('/users/google-auth', userData);
            if (response.data.success) {
                localStorage.setItem("token", response.data.token);
                localStorage.setItem("user", JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            handleApiError(error, 'googleAuth');
        }
    },

    logout: async () => {
        try {
            const response = await api.post('/users/logout');
            clearAuthData();
            return response.data;
        } catch (error) {
            clearAuthData(); // Clear data even if request fails
            handleApiError(error, 'logout');
        }
    },

    getUserProfile: async () => {
        try {
            const response = await api.get('/users/profile');
            return response.data;
        } catch (error) {
            handleApiError(error, 'getUserProfile');
        }
    },

    updateUserProfile: async (userData) => {
        try {
            const response = await api.put('/users/profile', userData);
            if (response.data.success) {
                localStorage.setItem("user", JSON.stringify(response.data.user));
            }
            return response.data;
        } catch (error) {
            handleApiError(error, 'updateUserProfile');
        }
    },

    clearAuthData,
};