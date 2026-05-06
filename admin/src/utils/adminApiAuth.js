import { clearStoredAdminSession, getStoredAdminToken } from './adminSession';

let sessionInvalidated = false;

export const getAdminAuthToken = () => getStoredAdminToken();

export const handleAdminUnauthorized = () => {
  const hadToken = Boolean(getStoredAdminToken());
  clearStoredAdminSession();

  if (typeof window === 'undefined' || !hadToken || sessionInvalidated) {
    return;
  }

  sessionInvalidated = true;
  window.dispatchEvent(new Event('admin-auth-changed'));
};

export const attachAdminAuthInterceptors = (api) => {
  api.interceptors.request.use((config) => {
    const token = getAdminAuthToken();

    if (token) {
      sessionInvalidated = false;
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });

  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error?.response?.status === 401) {
        handleAdminUnauthorized();
      }

      return Promise.reject(error);
    }
  );

  return api;
};
