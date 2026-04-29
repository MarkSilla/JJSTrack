import axios from 'axios';

const API_BASE_URL = 'http://localhost:4000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const bookingApi = {
  // Create booking
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Error creating booking:', error);
      throw error;
    }
  },

  // Get all bookings
  getAllBookings: async () => {
    try {
      const response = await api.get('/bookings');
      return response.data;
    } catch (error) {
      console.error('Error fetching bookings:', error);
      throw error;
    }
  },

  // Get booking by ID
  getBookingById: async (id) => {
    try {
      const response = await api.get(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching booking:', error);
      throw error;
    }
  },

  // Update booking status
  updateBookingStatus: async (id, status) => {
    try {
      const response = await api.put(`/bookings/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Error updating booking:', error);
      throw error;
    }
  },

  // Update booking (generic - can update steps, status, notes, etc)
  updateBooking: async (id, data) => {
    try {
      const response = await api.put(`/bookings/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Error updating booking:', error?.response?.data || error);
      throw error;
    }
  },

  // Convert booking to order
  convertToOrder: async (id) => {
    try {
      const response = await api.post(`/bookings/${id}/convert`, {});
      return response.data;
    } catch (error) {
      console.error('Error converting booking to order:', error);
      throw error;
    }
  },

  // Cancel booking
  cancelBooking: async (id) => {
    try {
      const response = await api.put(`/bookings/${id}/cancel`);
      return response.data;
    } catch (error) {
      console.error('Error cancelling booking:', error);
      throw error;
    }
  },

  // Check available slots for a date
  getAvailableSlots: async (date) => {
    try {
      const response = await api.get(`/bookings/slots/available/${date}`);
      return response.data;
    } catch (error) {
      console.error('Error checking available slots:', error);
      throw error;
    }
  },

  // Get QR code for booking
  getBookingQR: async (id) => {
    try {
      const response = await api.get(`/bookings/${id}/qr`);
      return response.data;
    } catch (error) {
      console.error('Error fetching QR code:', error);
      throw error;
    }
  },

  // Mark booking as picked up by scanning QR
  markAsPickedUp: async (bookingId, releaseProofImage, releaseNotes) => {
    try {
      const response = await api.post('/bookings/qr/pickup', { bookingId, releaseProofImage, releaseNotes });
      return response.data;
    } catch (error) {
      console.error('Error marking booking as picked up:', error);
      throw error;
    }
  },

  // Generate QR codes for all bookings (admin only)
  generateMissingQRCodes: async () => {
    try {
      const response = await api.post('/bookings/admin/generate-qr');
      return response.data;
    } catch (error) {
      console.error('Error generating QR codes:', error);
      throw error;
    }
  },

  // Archive booking
  archiveBooking: async (bookingId) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/archive`);
      return response.data;
    } catch (error) {
      console.error('Error archiving booking:', error);
      throw error;
    }
  },

  // Unarchive booking
  unarchiveBooking: async (bookingId) => {
    try {
      const response = await api.post(`/bookings/${bookingId}/unarchive`);
      return response.data;
    } catch (error) {
      console.error('Error unarchiving booking:', error);
      throw error;
    }
  },
};

export default api;
