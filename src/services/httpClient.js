import axios from "axios";

const baseURL = import.meta.env.VITE_API_BASE_URL || "http://localhost:5000/api";

export const apiClient = axios.create({
  baseURL,
});

export function installInterceptors(authStore, router) {
  apiClient.interceptors.request.use((config) => {
    const token = authStore?.token;
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  });

  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      const status = error.response?.status;
      if (status === 401) {
        authStore?.handleUnauthorized();
        if (router && router.currentRoute.value.name !== "Login") {
          router.push({ name: "Login" });
        }
      }
      return Promise.reject(error);
    }
  );
}
