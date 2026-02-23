import api from './api.js';

export const appointmentApi = {
  // Create a new appointment
  createAppointment: async (appointmentData) => {
    try {
      const response = await api.post('/appointments', appointmentData);
      return response.data;
    } catch (error) {
      console.error('Create Appointment Error:', error);
      throw error;
    }
  },

  // Get all appointments
  getAppointments: async (params = {}) => {
    try {
      const response = await api.get('/appointments', { params });
      return response.data;
    } catch (error) {
      console.error('Get Appointments Error:', error);
      throw error;
    }
  },

  // Get appointment statistics
  getAppointmentStats: async () => {
    try {
      const response = await api.get('/appointments/stats');
      return response.data;
    } catch (error) {
      console.error('Get Appointment Stats Error:', error);
      throw error;
    }
  },

  // Get available slots for a date
  getAvailableSlots: async (date) => {
    try {
      const response = await api.get('/appointments/slots', { params: { date } });
      return response.data;
    } catch (error) {
      console.error('Get Available Slots Error:', error);
      throw error;
    }
  },

  // Get single appointment by ID
  getAppointmentById: async (id) => {
    try {
      const response = await api.get(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Get Appointment By ID Error:', error);
      throw error;
    }
  },

  // Update appointment
  updateAppointment: async (id, data) => {
    try {
      const response = await api.put(`/appointments/${id}`, data);
      return response.data;
    } catch (error) {
      console.error('Update Appointment Error:', error);
      throw error;
    }
  },

  // Update appointment status
  updateAppointmentStatus: async (id, status) => {
    try {
      const response = await api.put(`/appointments/${id}/status`, { status });
      return response.data;
    } catch (error) {
      console.error('Update Appointment Status Error:', error);
      throw error;
    }
  },

  // Delete appointment (admin only)
  deleteAppointment: async (id) => {
    try {
      const response = await api.delete(`/appointments/${id}`);
      return response.data;
    } catch (error) {
      console.error('Delete Appointment Error:', error);
      throw error;
    }
  },
};
