import axios from "axios";
import { API_BASE_URL } from "../utils/apiBaseUrl";
import { attachAdminAuthInterceptors } from "../utils/adminApiAuth";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

attachAdminAuthInterceptors(api);

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

  reactivateStaff: async (id) => {
    const response = await api.patch(`/staff/${id}/reactivate`);
    return response.data;
  },

  suspendStaff: async (id, days) => {
    const response = await api.patch(`/staff/${id}/suspend`, { days });
    return response.data;
  },

  resetStaffPassword: async (id, newPassword) => {
    const response = await api.patch(`/staff/${id}/reset-password`, { newPassword });
    return response.data;
  },
};

export default staffApi;
