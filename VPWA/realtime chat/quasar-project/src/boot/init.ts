import { defineBoot } from '#q-app/wrappers';
import { LocalStorage } from 'quasar';
import { me } from 'src/services/authService';
import { useAuthStore } from 'stores/auth';

// "async" is optional;
// more info on params: https://v2.quasar.dev/quasar-cli-vite/boot-files
export default defineBoot(async () => {
  const token: string | null = LocalStorage.getItem('auth_token');

  if (token) {
    const authStore = useAuthStore();

    const response = await me(token);

    if (response.success) {
      authStore.onInit(token, response.data!);
    } else {
      LocalStorage.removeItem('auth_token');
    }
  }

  if (Notification.permission !== 'granted') {
    await Notification.requestPermission();
  }
});
