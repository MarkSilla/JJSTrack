import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_BACKEND_URL || "http://localhost:4000/api",
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

  adjustStock: async (id, type, amount) => {
    const response = await api.patch(`/inventory/${id}/adjust`, {
      type,
      amount,
    });
    return response.data;
  },
};

export default inventoryApi;
