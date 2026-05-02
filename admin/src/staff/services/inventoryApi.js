import axios from "axios";
import { API_BASE_URL } from "../utils/apiBaseUrl";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("staffToken");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const inventoryApi = {
  getAllInventory: async () => {
    const response = await api.get("/inventory");
    return response.data;
  },

  adjustStock: async (id, type, amount, extra = {}) => {
    const response = await api.patch(`/inventory/${id}/adjust`, {
      type,
      amount,
      ...extra,
    });
    return response.data;
  },

  getInventoryActivity: async (limit = 100, options = {}) => {
    const params = new URLSearchParams();
    params.set("limit", String(limit));
    if (options.scope) params.set("scope", options.scope);

    const response = await api.get(`/inventory/activity?${params.toString()}`);
    return response.data;
  },
};

export default inventoryApi;
