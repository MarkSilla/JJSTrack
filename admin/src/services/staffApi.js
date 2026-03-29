import axios from "axios";

const API_BASE_URL = "http://localhost:4000/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("adminToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const staffApi = {
  getAllStaff: async () => {
    const response = await api.get("/staff");
    return response.data;
  },

  createStaff: async (data) => {
    const response = await api.post("/staff", data);
    return response.data;
  },

  updateStaff: async (id, data) => {
    const response = await api.put(`/staff/${id}`, data);
    return response.data;
  },

  deactivateStaff: async (id) => {
    const response = await api.patch(`/staff/${id}/deactivate`);
    return response.data;
  },

  getMyStaff: async () => {
    const response = await api.get("/staff/my-staff");
    return response.data;
  },
};

export default staffApi;
