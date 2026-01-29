<template>
  <div class="fixed-top-right q-pa-md gt-xs" style="z-index: 100">
    <q-btn
      flat
      round
      :icon="$q.dark.isActive ? 'light_mode' : 'dark_mode'"
      @click="toggleDarkMode"
    />
  </div>
  <q-layout view="lHh Lpr lFf">
    <q-page-container>
      <q-page class="flex flex-center q-my-xl">
        <q-card class="q-pa-md shadow-1 rounded-xl" style="min-width: min(400px, 95%)">
          <div class="flex flex-center q-my-lg">
            <img
              style="max-width: 15rem"
              alt="Threadly Logo"
              :src="$q.dark.isActive ? '/logo-dark.svg' : '/logo-light.svg'"
            />
          </div>
          <q-tabs>
            <q-route-tab to="/auth/login" label="Login" exact />
            <q-route-tab to="/auth/signup" label="Signup" exact />
          </q-tabs>
          <q-separator />
          <router-view />
        </q-card>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { useQuasar } from 'quasar';

export default defineComponent({
  data() {
    return {
      $q: useQuasar(),
    };
  },
  methods: {
    toggleDarkMode() {
      this.$q.dark.toggle();
    },
  },
});
</script>
