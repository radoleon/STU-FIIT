import { defineBoot } from '#q-app/wrappers';
import axios, { type AxiosError } from 'axios';
import { useAuthStore } from 'stores/auth';
import { logout } from 'src/services/authService';

export const api = axios.create({
  baseURL: 'http://localhost:3333',
});

api.interceptors.request.use(
  (config) => {
    const authStore = useAuthStore();

    if (authStore.currentToken !== null) {
      config.headers.Authorization = `Bearer ${authStore.currentToken}`;
    }

    return config;
  },
  (error) => {
    return Promise.reject(error as AxiosError);
  },
);

api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    if (error.response?.status === 401) {
      const authStore = useAuthStore();

      const response = await logout();

      if (response.success) {
        await authStore.onLogout();
      }
    }

    return Promise.reject(error as AxiosError);
  },
);

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli-vite/boot-files
export default defineBoot(({ app }) => {
  app.config.globalProperties.$axios = axios;
  app.config.globalProperties.$api = api;
});
