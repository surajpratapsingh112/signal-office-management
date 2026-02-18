import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  getMe: () => api.get('/auth/me'),
};

// Units APIs
export const unitsAPI = {
  getAll: () => api.get('/units'),
  getOne: (id) => api.get(`/units/${id}`),
  create: (data) => api.post('/units', data),
  update: (id, data) => api.put(`/units/${id}`, data),
  delete: (id) => api.delete(`/units/${id}`),
};

// Employees APIs
export const employeesAPI = {
  getAll: (params) => api.get('/employees', { params }),
  getOne: (id) => api.get(`/employees/${id}`),
  create: (data) => api.post('/employees', data),
  update: (id, data) => api.put(`/employees/${id}`, data),
  delete: (id) => api.delete(`/employees/${id}`),
};

// Leaves APIs
export const leavesAPI = {
  getAll: (params) => api.get('/leaves', { params }),
  getOne: (id) => api.get(`/leaves/${id}`),
  create: (data) => api.post('/leaves', data),
  update: (id, data) => api.put(`/leaves/${id}`, data),
  extendCL: (id, data) => api.put(`/leaves/${id}/extend`, data),
  addMedicalRest: (id, data) => api.put(`/leaves/${id}/add-medical`, data),
  extendMedical: (id, data) => api.put(`/leaves/${id}/extend-medical`, data),
  approveMedical: (id, data) => api.put(`/leaves/${id}/approve-medical`, data),
  markReturned: (id) => api.put(`/leaves/${id}/return`),
  delete: (id) => api.delete(`/leaves/${id}`),
  getBalance: (employeeId, year) => api.get(`/leaves/balance/${employeeId}`, { params: { year } }),
  getArrivals: () => api.get('/leaves/arrivals/upcoming'),
  getCurrentlyOnLeave: () => api.get('/leaves/status/on-leave'),
  getPendingApprovals: () => api.get('/leaves/approval/pending'),
  validatePermissions: (permissionDates) => api.post('/leaves/validate-permissions', { permissionDates }),
};

// Holidays APIs
export const holidaysAPI = {
  getAll: (params) => api.get('/holidays', { params }),
  getOne: (id) => api.get(`/holidays/${id}`),
  create: (data) => api.post('/holidays', data),
  bulkCreate: (holidays) => api.post('/holidays/bulk', { holidays }),
  update: (id, data) => api.put(`/holidays/${id}`, data),
  delete: (id) => api.delete(`/holidays/${id}`),
  getRange: (startDate, endDate) => api.post('/holidays/range', { startDate, endDate }),
};

// Leave Settings APIs
export const leaveSettingsAPI = {
  get: (year) => api.get(`/leave-settings/${year || ''}`),
  update: (year, data) => api.put(`/leave-settings/${year}`, data),
};

// Store APIs
export const storeAPI = {
  getAll: () => api.get('/store'),
  create: (data) => api.post('/store', data),
  update: (id, data) => api.put(`/store/${id}`, data),
  delete: (id) => api.delete(`/store/${id}`),
};

// Equipment APIs
export const equipmentAPI = {
  getAll: (params) => api.get('/equipment', { params }),
  createOrUpdate: (data) => api.post('/equipment', data),
  update: (id, data) => api.put(`/equipment/${id}`, data),
};

// Requisitions APIs
export const requisitionsAPI = {
  getAll: () => api.get('/requisitions'),
  create: (data) => api.post('/requisitions', data),
  update: (id, data) => api.put(`/requisitions/${id}`, data),
};

// Employee Field Settings API
export const employeeFieldSettingsAPI = {
  getAll: () => api.get('/employee-field-settings'),
  getEnabled: () => api.get('/employee-field-settings/enabled'),
  getOne: (id) => api.get(`/employee-field-settings/${id}`),
  create: (data) => api.post('/employee-field-settings', data),
  update: (id, data) => api.put(`/employee-field-settings/${id}`, data),
  delete: (id) => api.delete(`/employee-field-settings/${id}`),
  reorder: (fields) => api.put('/employee-field-settings/reorder/all', { fields })
};

export const gateDutyAPI = {
  // Setup yearly gate duty (1-31 dates with multiple slots)
  createSetup: (data) => api.post('/gate-duty/setup', data),
  
  // Update single slot for a date
  updateSlot: (dutyId, data) => api.put(`/gate-duty/setup/${dutyId}/slot`, data),
  
  // Get yearly setup
  getSetup: (year) => api.get(`/gate-duty/setup/${year}`),
  
  // Add monthly replacement
  addReplacement: (data) => api.post('/gate-duty/replacement', data),
  
  // Remove replacement
  removeReplacement: (date, month, year, slot) => 
    api.delete(`/gate-duty/replacement/${date}/${month}/${year}/${slot}`),
  
  // Get monthly roster (with replacements)
  getMonthlyRoster: (year, month) => 
    api.get(`/gate-duty/roster/${year}/${month}`),
  
  // Get report
  getReport: (startDate, endDate) => 
    api.get('/gate-duty/report', { params: { startDate, endDate } }),
  
  // Check employee availability
  checkAvailability: (employeeId, date) => 
    api.get(`/gate-duty/check-availability/${employeeId}/${date}`)
};

// Out Duty API
export const outDutyAPI = {
  // Get all out duties
  getAll: (params) => api.get('/out-duty', { params }),
  
  // Get single out duty
  getById: (id) => api.get(`/out-duty/${id}`),
  
  // Create new out duty
  create: (data) => api.post('/out-duty', data),
  
  // Update out duty
  update: (id, data) => api.put(`/out-duty/${id}`, data),
  
  // Mark employee return
  markReturn: (id, actualReturnDate) => api.put(`/out-duty/${id}/return`, { actualReturnDate }),
  
  // Cancel out duty
  cancel: (id) => api.put(`/out-duty/${id}/cancel`),
  
  // Delete out duty
  delete: (id) => api.delete(`/out-duty/${id}`),
  
  // Check employee availability
  checkAvailability: (employeeId, date) => api.get(`/out-duty/check-availability/${employeeId}/${date}`)
};

export default api;