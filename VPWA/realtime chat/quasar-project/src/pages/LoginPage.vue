<template>
  <q-form @submit.prevent="login" class="q-gutter-sm q-my-lg q-pt-md text-center">
    <q-input
      v-model="form.email"
      filled
      dense
      label="Email"
      type="email"
      lazy-rules
      :rules="[
        (val) => (val && val.length > 0) || 'This field is required',
        (val) => /^\S+@\S+\.\S+$/.test(val) || 'Invalid email format',
      ]"
    >
      <template v-slot:prepend>
        <q-icon size="xs" name="email" />
      </template>
    </q-input>
    <q-input
      v-model="form.password"
      filled
      dense
      label="Password"
      type="password"
      lazy-rules
      :rules="[(val) => (val && val.length > 0) || 'This field is required']"
    >
      <template v-slot:prepend>
        <q-icon size="xs" name="key" />
      </template>
    </q-input>
    <q-btn
      class="q-mt-md"
      type="submit"
      color="primary"
      label="Submit"
      :disabled="!isFormValid()"
    />
  </q-form>
</template>

<script lang="ts">
import { notify } from 'src/misc/helpers';
import { defineComponent } from 'vue';
import { type LoginPayload } from 'src/models/Auth';
import { login } from 'src/services/authService';
import { type AuthStoreType, useAuthStore } from 'stores/auth';

interface LoginPageData {
  form: LoginPayload;
  authStore: AuthStoreType;
}

export default defineComponent({
  data(): LoginPageData {
    return {
      form: {
        email: '',
        password: '',
      },
      authStore: useAuthStore(),
    };
  },
  methods: {
    async login() {
      const response = await login(this.form);

      if (response.success) {
        await this.authStore.onLogin(response.data!.token, response.data!.user);
      } else {
        notify(response.message!, true);
      }
    },
    isFormValid(): boolean {
      const pattern = /^\S+@\S+\.\S+$/;
      return (
        this.form.email.length > 0 && this.form.password.length > 0 && pattern.test(this.form.email)
      );
    },
  },
});
</script>
