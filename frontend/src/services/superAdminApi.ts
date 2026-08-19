import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333/api';
const SUPER_ADMIN_TOKEN_STORAGE_KEY = 'rt-helpdesk:super-admin-token';

export const superAdminApi = axios.create({
  baseURL: API_URL,
});

superAdminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem(SUPER_ADMIN_TOKEN_STORAGE_KEY);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

superAdminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(SUPER_ADMIN_TOKEN_STORAGE_KEY);
      if (window.location.pathname !== '/super-admin/login') {
        window.location.href = '/super-admin/login';
      }
    }
    return Promise.reject(error);
  },
);

export { SUPER_ADMIN_TOKEN_STORAGE_KEY };
