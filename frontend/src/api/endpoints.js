import axiosClient from './axiosClient';

// --- Auth --------------------------------------------------------------
export const authApi = {
  login: (payload) => axiosClient.post('/auth/login', payload),
  logout: () => axiosClient.post('/auth/logout'),
  me: () => axiosClient.get('/auth/me'),
  changePassword: (payload) => axiosClient.post('/auth/change-password', payload),
  forgotPassword: (payload) => axiosClient.post('/auth/forgot-password', payload),
  resetPassword: (payload) => axiosClient.post('/auth/reset-password', payload)
};

// --- Books ---------------------------------------------------------------
export const booksApi = {
  list: (params) => axiosClient.get('/books', { params }),
  get: (id) => axiosClient.get(`/books/${id}`),
  create: (formData) => axiosClient.post('/books', formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, formData) => axiosClient.put(`/books/${id}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } }),
  archive: (id) => axiosClient.delete(`/books/${id}`),
  bulkCreate: (payload) => axiosClient.post('/books/bulk', payload)
};

// --- Lookup entities (generic CRUD shape) --------------------------------
function buildLookupApi(resource) {
  return {
    list: (params) => axiosClient.get(`/${resource}`, { params }),
    get: (id) => axiosClient.get(`/${resource}/${id}`),
    create: (payload) => axiosClient.post(`/${resource}`, payload),
    update: (id, payload) => axiosClient.put(`/${resource}/${id}`, payload),
    remove: (id) => axiosClient.delete(`/${resource}/${id}`)
  };
}
export const authorsApi = buildLookupApi('authors');
export const publishersApi = buildLookupApi('publishers');
export const categoriesApi = buildLookupApi('categories');
export const shelvesApi = buildLookupApi('shelves');
export const departmentsApi = buildLookupApi('departments');

// --- Users / Members -------------------------------------------------------
export const usersApi = {
  list: (params) => axiosClient.get('/users', { params }),
  get: (id) => axiosClient.get(`/users/${id}`),
  create: (payload) => axiosClient.post('/users', payload),
  update: (id, payload) => axiosClient.put(`/users/${id}`, payload),
  resetPassword: (id, payload) => axiosClient.post(`/users/${id}/reset-password`, payload),
  remove: (id) => axiosClient.delete(`/users/${id}`)
};

// --- Borrow / Return -------------------------------------------------------
export const borrowApi = {
  list: (params) => axiosClient.get('/borrow-records', { params }),
  issue: (payload) => axiosClient.post('/borrow-records/issue', payload),
  returnBook: (id) => axiosClient.post(`/borrow-records/${id}/return`),
  renew: (id) => axiosClient.post(`/borrow-records/${id}/renew`),
  markLost: (id) => axiosClient.post(`/borrow-records/${id}/lost`)
};

// --- Reservations ------------------------------------------------------------
export const reservationsApi = {
  list: (params) => axiosClient.get('/reservations', { params }),
  create: (payload) => axiosClient.post('/reservations', payload),
  cancel: (id) => axiosClient.post(`/reservations/${id}/cancel`),
  fulfill: (id) => axiosClient.post(`/reservations/${id}/fulfill`)
};

// --- Dashboard ---------------------------------------------------------------
export const dashboardApi = {
  summary: () => axiosClient.get('/dashboard/summary')
};

// --- Reports -------------------------------------------------------------------
export const reportsApi = {
  listTypes: () => axiosClient.get('/reports'),
  download: (type, format, params) =>
    axiosClient.get(`/reports/${type}/${format}`, { params, responseType: 'blob' })
};

// --- Audit logs -----------------------------------------------------------------
export const auditLogsApi = {
  list: (params) => axiosClient.get('/audit-logs', { params })
};

// --- Settings --------------------------------------------------------------------
export const settingsApi = {
  list: () => axiosClient.get('/settings'),
  update: (key, value) => axiosClient.put(`/settings/${key}`, { value })
};

// --- QR ---------------------------------------------------------------------------
export const qrApi = {
  lookupBook: (id) => axiosClient.get(`/qr/book/${id}`)
};

// --- Notifications -----------------------------------------------------------------
export const notificationsApi = {
  list: () => axiosClient.get('/notifications'),
  broadcast: (payload) => axiosClient.post('/notifications/broadcast', payload),
  dismiss: (payload) => axiosClient.post('/notifications/dismiss', payload)
};
