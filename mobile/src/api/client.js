import axios from 'axios';
import Constants from 'expo-constants';

const APP_CONFIG = Constants.expoConfig?.extra ?? Constants.manifest2?.extra ?? {};
const DEFAULT_BASE_URL = 'http://10.0.2.2:5000/api';
const BASE_URL = String(APP_CONFIG.apiBaseUrl || DEFAULT_BASE_URL).replace(/\/+$/, '');


const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export const authApi = {
  login: (payload) => api.post('/auth/login', payload),
  register: (payload) => api.post('/auth/register', payload),
  requestPasswordReset: (payload) => api.post('/auth/request-password-reset', payload),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
};

export const transactionApi = {
  list: () => api.get('/transactions?limit=20&page=1'),
  listExtended: (params = {}) => api.get('/transactions', { params }),
  create: (payload) => api.post('/transactions', payload),
  update: (id, payload) => api.patch(`/transactions/${id}`, payload),
  remove: (id) => api.delete(`/transactions/${id}`),
};

export const budgetApi = {
  list: () => api.get('/budgets'),
  getById: (id) => api.get(`/budgets/${id}`),
  create: (payload) => api.post('/budgets', payload),
  update: (id, payload) => api.patch(`/budgets/${id}`, payload),
  adjust: (id, payload) => api.post(`/budgets/${id}/adjustments`, payload),
  remove: (id) => api.delete(`/budgets/${id}`),
};

export const investmentApi = {
  list: () => api.get('/investments'),
  create: (payload) => api.post('/investments', payload),
  update: (id, payload) => api.patch(`/investments/${id}`, payload),
  remove: (id) => api.delete(`/investments/${id}`),
};

export const savingsApi = {
  list: () => api.get('/savings'),
  create: (payload) => api.post('/savings', payload),
  update: (id, payload) => api.patch(`/savings/${id}`, payload),
  remove: (id) => api.delete(`/savings/${id}`),
};

export const debtApi = {
  list: () => api.get('/debts'),
  getById: (id) => api.get(`/debts/${id}`),
  summary: () => api.get('/debts/summary/totals'),
  create: (payload) => api.post('/debts', payload),
  pay: (id, payload) => api.post(`/debts/${id}/payments`, payload),
};

export const accountApi = {
  list: () => api.get('/accounts'),
  summary: () => api.get('/accounts/summary/totals'),
  create: (payload) => api.post('/accounts', payload),
  update: (id, payload) => api.patch(`/accounts/${id}`, payload),
  adjust: (id, payload) => api.post(`/accounts/${id}/adjust`, payload),
  remove: (id) => api.delete(`/accounts/${id}`),
};

export default api;
