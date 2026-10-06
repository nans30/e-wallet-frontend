import axios, { AxiosError } from 'axios';

export const api = axios.create({
  baseURL: 'http://localhost:8000/api',
  withCredentials: true,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
  },
});

// Interceptor untuk menyematkan Bearer Token dari localStorage jika ada
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor Global Response & Error Handling
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ message?: string; status?: string }>) => {
    if (error.response) {
      const status = error.response.status;
      const message = error.response.data?.message || 'Terjadi kesalahan pada sistem.';

      if (status === 401) {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('auth_user');
        // Jangan reload otomatis jika sedang berada di flow login/register
      } else if (status === 429) {
        console.warn('Rate limit exceeded:', message);
      }
    }
    return Promise.reject(error);
  }
);
