import axios from 'axios';

const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const normalizedBaseUrl = baseApiUrl.endsWith('/api')
  ? baseApiUrl
  : `${baseApiUrl.replace(/\/$/, '')}/api`;

const baseUrlWithTrailingSlash = normalizedBaseUrl.endsWith('/')
  ? normalizedBaseUrl
  : `${normalizedBaseUrl}/`;

const api = axios.create({
  baseURL: baseUrlWithTrailingSlash,
});

api.interceptors.request.use((config) => {
  if (typeof config.url === 'string' && config.url.startsWith('/')) {
    config.url = config.url.slice(1);
  }
  return config;
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;
