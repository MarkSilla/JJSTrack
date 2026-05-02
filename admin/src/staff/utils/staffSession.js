const STAFF_TOKEN_KEY = 'staffToken';
const STAFF_USER_KEY = 'staffUser';

const getWebStorage = (type) => {
    if (typeof window === 'undefined') return null;
    return type === 'session' ? window.sessionStorage : window.localStorage;
};

const getTokenStorage = () => {
    const local = getWebStorage('local');
    if (local?.getItem(STAFF_TOKEN_KEY)) return local;

    const session = getWebStorage('session');
    if (session?.getItem(STAFF_TOKEN_KEY)) return session;

    return local || session || null;
};

export const getStoredStaffToken = () => {
    const storage = getTokenStorage();
    return storage?.getItem(STAFF_TOKEN_KEY) || '';
};

export const getStoredStaffUser = () => {
    try {
        const preferredStorage = getTokenStorage();
        const local = getWebStorage('local');
        const session = getWebStorage('session');
        const rawUser =
            preferredStorage?.getItem(STAFF_USER_KEY) ||
            local?.getItem(STAFF_USER_KEY) ||
            session?.getItem(STAFF_USER_KEY) ||
            '';

        return rawUser ? JSON.parse(rawUser) : null;
    } catch {
        return null;
    }
};

export const persistStoredStaffUser = (staffUser) => {
    const storage = getTokenStorage();
    const otherStorage = storage === getWebStorage('local')
        ? getWebStorage('session')
        : getWebStorage('local');

    if (!storage) return;

    storage.setItem(STAFF_USER_KEY, JSON.stringify(staffUser));
    otherStorage?.removeItem(STAFF_USER_KEY);
};

export const clearStoredStaffSession = () => {
    getWebStorage('local')?.removeItem(STAFF_TOKEN_KEY);
    getWebStorage('session')?.removeItem(STAFF_TOKEN_KEY);
    getWebStorage('local')?.removeItem(STAFF_USER_KEY);
    getWebStorage('session')?.removeItem(STAFF_USER_KEY);
};
