import api from './api.js';

export const bookingApi = {
  // Create a new booking
  createBooking: async (bookingData) => {
    try {
      const response = await api.post('/bookings', bookingData);
      return response.data;
    } catch (error) {
      console.error('Create Booking Error:', error);
      throw error;
    }
  },

  // Get all bookings
  getBookings: async (params = {}) => {
    try {
      const response = await api.get('/bookings', { params });
      return response.data;
    } catch (error) {
      console.error('Get Bookings Error:', error);
      throw error;
    }
  },

  // Get single booking by ID
  getBookingById: async (id) => {
    try {
      const response = await api.get(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Booking By ID Error:', error);
      throw error;
    }
  },

  // Update booking
  updateBooking: async (id, data) => {
    try {
      const response = await api.put(`/bookings/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update Booking Error:', error);
      throw error;
    }
  },

  // Update booking status
  updateBookingStatus: async (id, data) => {
    try {
      const response = await api.put(`/bookings/${id}/status`, data);
      return response.data;
    } catch (error) {
      console.error('Update Booking Status Error:', error);
      throw error;
    }
  },

  // Delete booking (admin only)
  deleteBooking: async (id) => {
    try {
      const response = await api.delete(`/bookings/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Booking Error:', error);
      throw error;
    }
  },

  // Convert booking to order (admin/staff only)
  convertToOrder: async (id, data) => {
    try {
      const response = await api.post(`/bookings/${id}/convert`, data);
      return response.data;
    } catch (error) {
      console.error('Convert To Order Error:', error);
      throw error;
    }
  },
};
