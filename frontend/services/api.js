import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:4000/api",
  timeout: 30000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || sessionStorage.getItem("token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    console.log('API Request:', config.method.toUpperCase(), config.url);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => {
    console.log('API Response:', response.config.url, response.status);
    
    return response; 
  },
  (error) => {
    const status = error.response?.status;
    const url = error.config?.url;

    console.error('❌ API Error:', status, url, error.response?.data);

    if (status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.removeItem("token");
      sessionStorage.removeItem("user");

      window.dispatchEvent(
        new CustomEvent("auth-error", {
          detail: { status, url, error: error.response?.data },
        })
      );
    }

    if (!error.response) {
      console.error('Network error - no response received');
    }

    return Promise.reject(error);
  }
);

export default api;