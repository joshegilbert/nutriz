import { defineStore } from "pinia";
import { ref } from "vue";
import { apiClient } from "@/services/httpClient";

const TOKEN_KEY = "nutriz_token";
const USER_KEY = "nutriz_user";

export const useAuthStore = defineStore("auth", () => {
  const token = ref(localStorage.getItem(TOKEN_KEY) || "");
  const user = ref(null);
  const loading = ref(false);
  const error = ref("");

  if (!user.value) {
    try {
      const storedUser = localStorage.getItem(USER_KEY);
      if (storedUser) {
        user.value = JSON.parse(storedUser);
      }
    } catch (err) {
      console.error("Failed to parse stored user", err);
      localStorage.removeItem(USER_KEY);
    }
  }

  function setSession(sessionToken, profile) {
    token.value = sessionToken;
    user.value = profile;
    localStorage.setItem(TOKEN_KEY, sessionToken);
    localStorage.setItem(USER_KEY, JSON.stringify(profile));
  }

  function clearSession() {
    token.value = "";
    user.value = null;
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
  }

  async function login(credentials) {
    loading.value = true;
    error.value = "";
    try {
      const response = await apiClient.post("/auth/login", credentials);
      setSession(response.data.token, response.data.user);
      return response.data;
    } catch (err) {
      error.value = err.response?.data?.message || "Unable to login";
      throw err;
    } finally {
      loading.value = false;
    }
  }

  async function fetchProfile() {
    if (!token.value) return null;
    try {
      const response = await apiClient.get("/auth/me");
      user.value = response.data;
      localStorage.setItem(USER_KEY, JSON.stringify(response.data));
      return response.data;
    } catch (err) {
      handleUnauthorized();
      throw err;
    }
  }

  function logout() {
    clearSession();
  }

  function handleUnauthorized() {
    clearSession();
  }

  return {
    token,
    user,
    loading,
    error,
    login,
    fetchProfile,
    logout,
    handleUnauthorized,
    get isAuthenticated() {
      return Boolean(token.value);
    },
  };
});
