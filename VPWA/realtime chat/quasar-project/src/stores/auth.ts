import { LocalStorage } from 'quasar';
import { defineStore } from 'pinia';
import { type User } from 'src/models/User';
import { useSocketStore } from 'stores/socket';

interface AuthState {
  user: User | null;
  token: string | null;
}

let cleanup: () => void;

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    token: null,
    user: null,
  }),
  getters: {
    currentToken: (state: AuthState) => state.token,
    currentUser: (state: AuthState) => state.user,
    isLoggedIn: (state: AuthState) => state.token !== null,
  },
  actions: {
    onInit(token: string, user: User) {
      this.token = token;
      this.user = user;

      const socketStore = useSocketStore();
      socketStore.connect(token);

      cleanup = () => socketStore.disconnect();

      window.addEventListener('beforeunload', cleanup);
    },
    async onLogin(token: string, user: User) {
      LocalStorage.setItem('auth_token', token);

      this.token = token;
      this.user = user;

      const socketStore = useSocketStore();
      socketStore.connect(token);

      cleanup = () => socketStore.disconnect();

      window.addEventListener('beforeunload', cleanup);

      await this.router.push('/');
    },
    async onLogout() {
      await this.router.push('/');

      LocalStorage.removeItem('auth_token');

      this.token = null;
      this.user = null;

      const socketStore = useSocketStore();
      socketStore.disconnect();

      window.removeEventListener('beforeunload', cleanup);

      await this.router.push('/auth/login');
    },
  },
});

export type AuthStoreType = ReturnType<typeof useAuthStore>;
