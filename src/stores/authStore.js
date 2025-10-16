import { defineStore } from 'pinia';
import { computed, ref } from 'vue';
import api, { setAuthToken } from '@/services/api';

const TOKEN_KEY = 'nutriz_token';

export const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || '');
  const user = ref(null);
  const status = ref('idle');
  const error = ref('');

  if (token.value) {
    setAuthToken(token.value);
  }

  const isAuthenticated = computed(() => Boolean(token.value));

  const setSession = (payload) => {
    token.value = payload?.token || '';
    user.value = payload
      ? {
          id: payload._id,
          email: payload.email,
          role: payload.role,
        }
      : null;

    if (token.value) {
      localStorage.setItem(TOKEN_KEY, token.value);
      setAuthToken(token.value);
    } else {
      localStorage.removeItem(TOKEN_KEY);
      setAuthToken(null);
    }
  };

  const login = async ({ email, password }) => {
    status.value = 'loading';
    error.value = '';
    try {
      const { data } = await api.post('/auth/login', { email, password });
      setSession(data);
      status.value = 'authenticated';
      return data;
    } catch (err) {
      status.value = 'error';
      error.value = err.response?.data?.message || 'Unable to login. Please try again.';
      throw err;
    }
  };

  const register = async ({ email, password, role = 'nutritionist' }) => {
    status.value = 'loading';
    error.value = '';
    try {
      const { data } = await api.post('/auth/register', { email, password, role });
      setSession(data);
      status.value = 'authenticated';
      return data;
    } catch (err) {
      status.value = 'error';
      error.value = err.response?.data?.message || 'Unable to register. Please try again.';
      throw err;
    }
  };

  const fetchCurrentUser = async () => {
    if (!token.value) return null;
    try {
      const { data } = await api.get('/auth/me');
      user.value = {
        id: data._id,
        email: data.email,
        role: data.role,
      };
      status.value = 'authenticated';
      return user.value;
    } catch (err) {
      logout();
      throw err;
    }
  };

  const logout = () => {
    setSession(null);
    status.value = 'idle';
  };

  return {
    token,
    user,
    status,
    error,
    isAuthenticated,
    login,
    register,
    fetchCurrentUser,
    logout,
  };
});
