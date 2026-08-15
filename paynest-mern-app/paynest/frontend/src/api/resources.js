import api from "./axios";

// ---- Auth ----
export const authApi = {
  register: (data) => api.post("/auth/register", data),
  login: (data) => api.post("/auth/login", data),
  me: () => api.get("/auth/me"),
};

// ---- Users ----
export const userApi = {
  updateProfile: (data) => api.put("/users/me", data),
  changePassword: (data) => api.put("/users/me/password", data),
  setUpiPin: (data) => api.put("/users/me/upi-pin", data),
  updateSettings: (data) => api.put("/users/me/settings", data),
};

// ---- Bank accounts ----
export const accountApi = {
  list: () => api.get("/accounts"),
  create: (data) => api.post("/accounts", data),
  setPrimary: (id) => api.put(`/accounts/${id}/primary`),
  remove: (id) => api.delete(`/accounts/${id}`),
};

// ---- Cards ----
export const cardApi = {
  list: () => api.get("/cards"),
  create: (data) => api.post("/cards", data),
  toggleFreeze: (id) => api.put(`/cards/${id}/freeze`),
  updateLimit: (id, data) => api.put(`/cards/${id}/limit`, data),
  remove: (id) => api.delete(`/cards/${id}`),
};

// ---- Recipients ----
export const recipientApi = {
  list: () => api.get("/recipients"),
  create: (data) => api.post("/recipients", data),
  toggleFavorite: (id) => api.put(`/recipients/${id}/favorite`),
  remove: (id) => api.delete(`/recipients/${id}`),
};

// ---- Transactions ----
export const transactionApi = {
  list: (params) => api.get("/transactions", { params }),
  get: (id) => api.get(`/transactions/${id}`),
  send: (data) => api.post("/transactions/send", data),
  addMoney: (data) => api.post("/transactions/add-money", data),
};

// ---- Notifications ----
export const notificationApi = {
  list: () => api.get("/notifications"),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put("/notifications/read-all"),
};

// ---- Biometric / Fingerprint ----
export const biometricApi = {
  registerOptions: () => api.post("/biometric/register-options"),
  registerVerify: (data) => api.post("/biometric/register-verify", data),
  assertionOptions: () => api.post("/biometric/assertion-options"),
  assertionVerify: (data) => api.post("/biometric/assertion-verify", data),
  remove: () => api.delete("/biometric/credentials"),
};
