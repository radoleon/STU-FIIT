<template>
  <q-header v-if="authStore.isLoggedIn">
    <q-toolbar class="q-px-sm">
      <q-btn flat round dense icon="menu" class="q-mr-sm" @click="toggleSidebar()" />
      <img
        style="max-width: 7.5rem"
        alt="Threadly Logo"
        src="/logo-dark.svg"
        @click="toHomePage"
        :style="{ cursor: 'pointer' }"
      />
      <q-space></q-space>

      <div>
        <q-btn flat round>
          <q-avatar color="secondary" size="md" text-color="white">
            {{ initials }}
            <q-badge :color="status.value" rounded floating />
          </q-avatar>
          <q-menu>
            <div class="column no-wrap q-pa-md">
              <div class="column">
                <div class="text-h6 q-mb-md">Status</div>
              </div>
              <q-btn-toggle
                @update:model-value="(event) => changeUserStatus(event)"
                :model-value="status.value"
                :dense="$q.screen.lt.sm"
                spread
                :toggle-color="status.value"
                unelevated
                size="sm"
                :options="options"
                class="status-toggle column q-gutter-sm"
              />
            </div>
          </q-menu>
        </q-btn>
      </div>

      <span class="q-ml-sm text-weight-medium gt-xs">{{ nickname }}</span>
      <q-btn
        v-if="$q.screen.gt.sm || $q.screen.sm"
        icon="logout"
        size="12px"
        class="q-mx-md"
        @click="logout"
        outline
        label="Logout"
      />
      <q-btn
        v-if="$q.screen.lt.sm"
        icon="logout"
        size="12px"
        class="q-mx-xs lt-xs"
        @click="logout"
        flat
        round
      />
      <q-btn
        flat
        round
        size="12px"
        :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
        @click="toggleDarkMode"
      />
    </q-toolbar>
  </q-header>
</template>

<script lang="ts">
import { useQuasar } from 'quasar';
import { defineComponent } from 'vue';
import { useAuthStore } from 'stores/auth';
import { getUserStatus, notify } from 'src/misc/helpers';
import { logout } from 'src/services/authService';
import { useSocketStore } from 'stores/socket';

const options = [
  {
    label: 'Online',
    value: 'positive',
    icon: 'notifications_on',
  },
  {
    label: 'Offline',
    value: 'negative',
    icon: 'notifications_paused',
  },
  {
    label: 'DND',
    value: 'secondary',
    icon: 'notifications_off',
  },
];

export default defineComponent({
  data() {
    return {
      authStore: useAuthStore(),
      $q: useQuasar(),
      options,
      socketStore: useSocketStore(),
    };
  },
  props: {
    sidebarOpen: {
      type: Boolean,
      required: true,
    },
  },
  emits: ['update:sidebarOpen'],
  methods: {
    async logout() {
      const response = await logout();

      if (response.success) {
        await this.authStore.onLogout();
      } else {
        notify(response.message!, true);
      }
    },
    async toHomePage() {
      await this.$router.push('/');
    },
    toggleSidebar() {
      this.$emit('update:sidebarOpen', !this.sidebarOpen);
    },
    toggleDarkMode() {
      this.$q.dark.toggle();
    },
    changeUserStatus(event: string) {
      const statusId = this.options.findIndex((x) => x.value === event)! + 1;
      const currentStatusId = this.authStore.currentUser!.settings!.statusId;
      console.log({ statusId, currentStatusId });
      if (statusId === currentStatusId) {
        return;
      }

      if (statusId === 2) {
        this.socketStore.disconnect();
      } else if (currentStatusId === 2) {
        this.socketStore.connect(this.authStore.token!, statusId);
      } else {
        this.socketStore.ws?.emit('status:new', statusId);
      }
    },
  },
  computed: {
    status() {
      return getUserStatus(this.authStore.currentUser!.settings!.statusId);
    },
    initials() {
      return this.authStore.currentUser!.firstName[0]! + this.authStore.currentUser!.lastName[0]!;
    },
    nickname() {
      return this.authStore.currentUser!.nickname;
    },
  },
});
</script>

<style scoped>
::v-deep(.status-toggle .q-btn__content) {
  justify-content: flex-start !important;
}
</style>
