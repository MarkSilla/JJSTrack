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
