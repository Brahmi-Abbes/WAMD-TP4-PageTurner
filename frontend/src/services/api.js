/**
 * Centralized API Client for PageTurner Frontend
 * Built on Axios with automatic JWT Bearer token attachment and response error handling.
 */
import axios from 'axios';

const API_BASE_URL =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) ||
  (typeof process !== 'undefined' && process.env && process.env.VITE_API_BASE_URL) ||
  'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

// Request interceptor: attach token from localStorage
api.interceptors.request.use(
  (config) => {
    try {
      const token = localStorage.getItem('pageturner_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // In case localStorage is disabled or restricted
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor: handle 401 token expiration and formatting
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      const errorMsg = error.response.data?.error || '';
      if (
        errorMsg.toLowerCase().includes('expired') ||
        errorMsg.toLowerCase().includes('invalid token') ||
        errorMsg.toLowerCase().includes('access denied')
      ) {
        try {
          localStorage.removeItem('pageturner_token');
          localStorage.removeItem('pageturner_user');
        } catch {
          // ignore
        }
      }
    }
    return Promise.reject(error);
  }
);

// Helper function to extract user-friendly error messages from API responses
export const getErrorMessage = (error) => {
  if (error.response && error.response.data) {
    return error.response.data.error || error.response.data.message || 'An error occurred';
  }
  if (error.request) {
    return 'Unable to reach the backend server. Please verify the server is running on http://localhost:3000.';
  }
  return error.message || 'An unexpected network error occurred';
};

export default api;
