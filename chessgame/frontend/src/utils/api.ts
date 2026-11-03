import axios, { AxiosError } from 'axios';
import toast from 'react-hot-toast';

/**
 * Dynamically resolves the API base URL.
 * - Prioritizes VITE_API_URL environment variable if provided.
 * - Ensures `/api` is cleanly appended if missing (e.g. if user sets base host).
 * - In cloud production (e.g. Vercel), if VITE_API_URL is omitted or set to '/api',
 *   requests stay same-origin via Vercel rewrites to proxy to Render (masking Render API URL & eliminating CORS).
 * - In local development / LAN, dynamically targets port 5000 on the current host.
 */
export function getApiBaseUrl(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && typeof envUrl === 'string' && envUrl.trim().length > 0) {
    const clean = envUrl.trim().replace(/\/+$/, '');
    if (clean === '/api' || clean.endsWith('/api')) {
      return clean;
    }
    return `${clean}/api`;
  }

  if (typeof window !== 'undefined' && window.location) {
    const { protocol, hostname } = window.location;
    // Local development or private LAN network
    if (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname)
    ) {
      return `${protocol}//${hostname}:5000/api`;
    }
    // Production default: same-origin /api (masked via Vercel rewrites)
    return '/api';
  }

  return 'http://localhost:5000/api';
}

/**
 * Dynamically resolves the Socket.IO base URL.
 * Strips any trailing `/api` from the API URL.
 */
export function getSocketBaseUrl(): string {
  const envSocket = import.meta.env.VITE_SOCKET_URL;
  if (envSocket && typeof envSocket === 'string' && envSocket.trim().length > 0) {
    return envSocket.trim().replace(/\/+$/, '');
  }

  const envApi = import.meta.env.VITE_API_URL;
  if (envApi && typeof envApi === 'string' && envApi.trim().length > 0 && envApi !== '/api') {
    return envApi.trim().replace(/\/api\/?$/, '').replace(/\/+$/, '');
  }

  const apiUrl = getApiBaseUrl();
  if (apiUrl.startsWith('/')) {
    // Relative API URL on Vercel: fallback to live Render backend
    return 'https://chess-tournament-hoste.onrender.com';
  }

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
