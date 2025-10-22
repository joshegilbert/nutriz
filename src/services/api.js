import axios from 'axios';

const baseApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const normalizedBaseUrl = baseApiUrl.endsWith('/api')
  ? baseApiUrl
  : `${baseApiUrl.replace(/\/$/, '')}/api`;

const api = axios.create({
  baseURL: normalizedBaseUrl,
});

export const setAuthToken = (token) => {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
};

export default api;
