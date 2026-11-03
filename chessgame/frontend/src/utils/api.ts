import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

/**
 * Dynamically resolves the API base URL.
 * - Prioritizes VITE_API_URL environment variable if provided.
 * - Otherwise resolves dynamically based on the current browser host (e.g. 192.168.x.x on LAN or localhost).
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    return envUrl.trim().replace(/\/+$/, '');
  }

  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname } = window.location;
    // Connect to port 5000 on the same host
    return `${protocol}//${hostname}:5000/api`;
  }

  return 'http://localhost:5000/api';
}

/**
 * Dynamically resolves the Socket.IO base URL.
 * Strips any trailing `/api` from the API URL.
 */
export function getSocketBaseUrl(): string {
  const apiUrl = getApiBaseUrl();
  return apiUrl.replace(/\/api\/?$/, '');
}

const api = axios.create({
  baseURL: getApiBaseUrl(),
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('chess_admin_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isNotifyingAuthExpiry = false;

api.interceptors.response.use(
  (res) => res,
  (err: AxiosError<any>) => {
    const status = err.response?.status;
    const errorData = err.response?.data;
    const errorMsg = errorData?.error || errorData?.message || err.message;

    // 401 Unauthorized / Expired Session
    if (status === 401) {
      if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin') {
        localStorage.removeItem('chess_admin_token');
        if (!isNotifyingAuthExpiry) {
          isNotifyingAuthExpiry = true;
          toast.error('Session expired. Please log in again.');
          setTimeout(() => {
            window.location.href = '/admin';
          }, 800);
        }
      }
    }
    // 403 Forbidden / Access Denied
    else if (status === 403) {
      toast.error(errorMsg || 'Access denied. Administrator privileges required.');
    }
    // 429 Rate Limit Exceeded
    else if (status === 429) {
      toast.error('Too many requests. Please wait a moment before trying again.');
    }
    // 500 Server Error
    else if (status && status >= 500) {
      // Don't show toast on background polling / health checks
      if (!err.config?.url?.includes('/system') && !err.config?.url?.includes('/health')) {
        toast.error('Server error encountered. Please try again.');
      }
    }

    return Promise.reject(err);
  }
);

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem('chess_admin_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    localStorage.removeItem('chess_admin_token');
    delete api.defaults.headers.common['Authorization'];
  }
};

export default api;
