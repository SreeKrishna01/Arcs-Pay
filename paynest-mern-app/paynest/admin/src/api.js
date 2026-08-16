import axios from "axios";

const api = axios.create({ baseURL: "https://arcs-pay.onrender.com/api" });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("admin_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("admin_token");
      localStorage.removeItem("admin_user");
      if (!window.location.pathname.startsWith("/login")) {
        window.location.href = "/login";
      }
    }
    return Promise.reject(error);
  }
);

export const adminApi = {
  login: (data) => api.post("/admin/login", data),
  me: () => api.get("/admin/me"),
  stats: () => api.get("/admin/stats"),
  users: (params) => api.get("/admin/users", { params }),
  user: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post("/admin/users", data),
  sendMoney: (id, data) => api.post(`/admin/users/${id}/send`, data),
  deductMoney: (id, data) => api.post(`/admin/users/${id}/deduct`, data),
  toggleBlock: (id) => api.post(`/admin/users/${id}/toggle-block`),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
};

export const getErrorMessage = (err) =>
  err?.response?.data?.message || err?.message || "Something went wrong. Please try again.";
