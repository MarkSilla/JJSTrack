import axios from 'axios';

const LOCAL_API_BASE_URL = import.meta.env.DEV ? "http://localhost:4000/api" : "";
const PRODUCTION_API_BASE_URL = "https://jjstrack.onrender.com/api";

const configuredApiBaseUrl = import.meta.env.VITE_BACKEND_URL;

const isLocalApiBaseUrl = (value = "") =>
  /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?\/api\/?$/.test(String(value).trim());

export const API_BASE_URL =
  import.meta.env.PROD && isLocalApiBaseUrl(configuredApiBaseUrl)
    ? PRODUCTION_API_BASE_URL
    : configuredApiBaseUrl ||
      (import.meta.env.PROD ? PRODUCTION_API_BASE_URL : LOCAL_API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
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
