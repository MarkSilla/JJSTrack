import axios from 'axios';
import { API_BASE_URL } from '../utils/apiBaseUrl';
import { clearStoredStaffSession, getStoredStaffToken } from '../utils/staffSession';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = getStoredStaffToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401 && getStoredStaffToken()) {
      clearStoredStaffSession();
      window.dispatchEvent(new Event('staff-auth-changed'));
    }
    return Promise.reject(error);
  }
);

export const bookingApi = {
  getAllBookings: async () => {
    const response = await api.get('/bookings');
    return response.data;
  },

  getBookingById: async (id) => {
    const response = await api.get(`/bookings/${id}`);
    return response.data;
  },

  getBookingForQRScan: async (id) => {
    const response = await api.get(`/bookings/qr/${encodeURIComponent(id)}`);
    return response.data;
  },

  markAsPickedUp: async (bookingId, releaseProofImage, releaseNotes, releasedBy) => {
    const response = await api.post('/bookings/qr/pickup', { bookingId, releaseProofImage, releaseNotes, releasedBy });
    return response.data;
  },

  updateBooking: async (id, data) => {
    const response = await api.put(`/bookings/${id}`, data);
    return response.data;
  },

  updateBookingStatus: async (id, status) => {
    const response = await api.patch(`/bookings/${id}/status`, { status });
    return response.data;
  },

  updateBookingStep: async (id, stepIndex, stepData) => {
    const response = await api.patch(`/bookings/${id}/step/${stepIndex}`, stepData);
    return response.data;
  },
};

export default bookingApi;
