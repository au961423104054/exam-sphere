import axios from 'axios';

/**
 * Configured Axios instance for ExamSphere API requests.
 * Uses VITE_API_BASE_URL from environment variables without hardcoded fallbacks.
 */
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor: Attach JWT authentication token from storage if present
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token') || localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor: Global handling for 401 Unauthorized or API errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('Unauthorized access: token may be expired or missing.');
    }
    return Promise.reject(error);
  }
);

export default api;
