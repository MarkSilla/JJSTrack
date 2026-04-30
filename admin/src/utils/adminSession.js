const ADMIN_TOKEN_KEY = 'adminToken';
const ADMIN_USER_KEY = 'adminUser';

export const getStoredAdminToken = () => {
    if (typeof window === 'undefined') return '';
    return window.localStorage.getItem(ADMIN_TOKEN_KEY) || '';
};

export const getStoredAdminUser = () => {
    if (typeof window === 'undefined') return null;

    try {
        const rawUser = window.localStorage.getItem(ADMIN_USER_KEY) || '';
        return rawUser ? JSON.parse(rawUser) : null;
    } catch {
        return null;
    }
};

export const persistStoredAdminUser = (adminUser) => {
    if (typeof window === 'undefined' || !adminUser) return;
    window.localStorage.setItem(ADMIN_USER_KEY, JSON.stringify(adminUser));
};

export const clearStoredAdminSession = () => {
    if (typeof window === 'undefined') return;
    window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    window.localStorage.removeItem(ADMIN_USER_KEY);
};
