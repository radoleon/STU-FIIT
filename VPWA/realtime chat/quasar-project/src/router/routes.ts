import type { RouteRecordRaw } from 'vue-router';
import { useAuthStore } from 'stores/auth';

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: () => import('layouts/MainWindowLayout.vue'),
    beforeEnter: (to, from, next) => {
      const authStore = useAuthStore();
      if (!authStore.isLoggedIn) {
        next({ path: '/auth' });
      } else {
        next();
      }
    },
    children: [
      { path: '', component: () => import('pages/MainPage.vue') },
      {
        path: 'channels/:id',
        component: () => import('pages/ChannelMessages.vue'),
      },
    ],
  },
  {
    path: '/auth',
    component: () => import('layouts/AuthLayout.vue'),
    redirect: '/auth/login',
    beforeEnter: (to, from, next) => {
      const authStore = useAuthStore();
      if (authStore.isLoggedIn) {
        next({ path: '/' });
      } else {
        next();
      }
    },
    children: [
      { path: 'login', component: () => import('pages/LoginPage.vue') },
      { path: 'signup', component: () => import('pages/SignupPage.vue') },
    ],
  },
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
];

export default routes;
