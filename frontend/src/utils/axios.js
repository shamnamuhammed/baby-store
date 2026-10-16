import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ,
  timeout: 15000,
  withCredentials: true, // Required for httpOnly cookie-based JWT
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add CSRF token to unsafe requests
api.interceptors.request.use(
  (config) => {
    const csrfToken = document.cookie
      .split('; ')
      .find((row) => row.startsWith('csrftoken='))
      ?.split('=')[1];



    if (
      csrfToken &&
      ['post', 'put', 'patch', 'delete'].includes(
        config.method?.toLowerCase()
      )
    ) {
      config.headers['X-CSRFToken'] = decodeURIComponent(csrfToken);

    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Track if we're currently refreshing to prevent infinite loops
let isRefreshing = false;
let failedQueue = [];

const processQueue = (error) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve();
    }
  });
  failedQueue = [];
};

// Response interceptor: handle 401 with automatic token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

   const isPublicAuthEndpoint =
  originalRequest.url?.includes('/login/') ||
      originalRequest.url?.includes('/register/') ||
      originalRequest.url?.includes('/forgot-password/') ||
      originalRequest.url?.includes('/reset-password/') ||
      originalRequest.url?.includes('/me/');

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes('/token/refresh/') &&
      !isPublicAuthEndpoint
    ) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => api(originalRequest))
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        await api.post('/api/users/token/refresh/');
        processQueue(null);
        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError);
        // Redirect to login on failed refresh, but avoid infinite loops if already on auth pages
        if (
          typeof window !== 'undefined' &&
          window.location.pathname !== '/login' &&
          window.location.pathname !== '/register'
        ) {
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default api;
