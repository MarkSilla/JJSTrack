import axios from 'axios';
import { API_BASE_URL } from '../utils/apiBaseUrl';
import { attachAdminAuthInterceptors } from '../utils/adminApiAuth';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

attachAdminAuthInterceptors(api);

export const bookingApi = {
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  getAllBookings: async () => {
    try {
      const response = await api.get('/bookings');
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  getBookingById: async (id) => {
    try {
      const response = await api.get(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  },

  updateBookingStatus: async (id, status) => {
    try {
      const response = await api.put(`/bookings/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },

  updateBooking: async (id, data) => {
    try {
      const response = await api.put(`/bookings/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating booking:', error?.response?.data || error);
      throw error;
    }
  },

  convertToOrder: async (id) => {
    try {
      const response = await api.post(`/bookings/${id}/convert`, {});
      return response.data;
    } catch (error) {
      console.error('Error converting booking to order:', error);
      throw error;
    }
  },

  cancelBooking: async (id, data = {}) => {
    try {
      const response = await api.put(`/bookings/${id}/cancel`, data);
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

  getAvailableSlots: async (date) => {
    try {
      const response = await api.get(`/bookings/slots/available/${date}`);
      return response.data;
    } catch (error) {
      console.error('Error checking available slots:', error);
      throw error;
    }
  },

  getBookingQR: async (id) => {
    try {
      const response = await api.get(`/bookings/${id}/qr`);
      return response.data;
    } catch (error) {
      console.error('Error fetching QR code:', error);
      throw error;
    }
  },

  markAsPickedUp: async (bookingId, releaseProofImage, releaseNotes, releasedBy) => {
    try {
      const response = await api.post('/bookings/qr/pickup', { bookingId, releaseProofImage, releaseNotes, releasedBy });
      return response.data;
    } catch (error) {
      console.error('Error marking booking as picked up:', error);
      throw error;
    }
  },

  generateMissingQRCodes: async () => {
    try {
      const response = await api.post('/bookings/admin/generate-qr');
      return response.data;
    } catch (error) {
      console.error('Error generating QR codes:', error);
      throw error;
    }
  },

  archiveBooking: async (bookingId) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/archive`);
      return response.data;
    } catch (error) {
      console.error('Error archiving booking:', error);
      throw error;
    }
  },

  unarchiveBooking: async (bookingId) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/unarchive`);
      return response.data;
    } catch (error) {
      console.error('Error unarchiving booking:', error);
      throw error;
    }
  },

  getSlotSummary: async (from, to) => {
    try {
      const response = await api.get('/bookings/slots/summary', {
        params: { from, to },
      });
      return response.data;
    } catch (error) {
      console.error('Get Slot Summary Error:', error);
      throw error;
    }
  },

  getDateStatuses: async (from, to) => {
    try {
      const response = await api.get('/bookings/date-status', {
        params: { from, to },
      });
      return response.data;
    } catch (error) {
      console.error('Get Date Statuses Error:', error);
      throw error;
    }
  },

  saveDateStatus: async (date, data) => {
    try {
      const response = await api.put(`/bookings/date-status/${date}`, data);
      return response.data;
    } catch (error) {
      console.error('Save Date Status Error:', error);
      throw error;
    }
  },

  saveManualCounts: async (date, data) => {
    try {
      const response = await api.put(`/bookings/date-status/${date}/counts`, data);
      return response.data;
    } catch (error) {
      console.error('Save Manual Counts Error:', error);
      throw error;
    }
  },

  clearDateStatus: async (date) => {
    try {
      const response = await api.delete(`/bookings/date-status/${date}`);
      return response.data;
    } catch (error) {
      console.error('Clear Date Status Error:', error);
      throw error;
    }
  },
};

export default api;
