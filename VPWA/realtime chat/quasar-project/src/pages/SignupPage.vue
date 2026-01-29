<template>
  <q-form @submit.prevent="signup" class="q-gutter-sm q-my-lg q-pt-md text-center">
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
      v-model="form.firstName"
      filled
      dense
      label="First Name"
      type="text"
      lazy-rules
      :rules="[
        (val) => (val && val.length > 0) || 'This field is required',
        (val) => /^[A-Z][a-zA-Z]*$/.test(val) || 'Invalid name format',
      ]"
    >
      <template v-slot:prepend>
        <q-icon size="xs" name="person" />
      </template>
    </q-input>
    <q-input
      v-model="form.lastName"
      filled
      dense
      label="Last Name"
      type="text"
      lazy-rules
      :rules="[
        (val) => (val && val.length > 0) || 'This field is required',
        (val) => /^[A-Z][a-zA-Z]*$/.test(val) || 'Invalid name format',
      ]"
    >
      <template v-slot:prepend>
        <q-icon size="xs" name="person" />
      </template>
    </q-input>
    <q-input
      v-model="form.nickname"
      filled
      dense
      label="Nickname"
      type="text"
      lazy-rules
      :rules="[(val) => (val && val.length > 0) || 'This field is required']"
    >
      <template v-slot:prepend>
        <q-icon size="xs" name="label" />
      </template>
    </q-input>
    <q-input
      v-model="form.password"
      filled
      dense
      label="Password"
      type="password"
      lazy-rules
      :rules="[
        (val) => (val && val.length > 0) || 'This field is required',
        (val) => (val && val.length >= 8) || 'Minimum 8 characters',
      ]"
    >
      <template v-slot:prepend>
        <q-icon size="xs" name="key" />
      </template>
    </q-input>
    <q-input
      v-model="form.confirmPassword"
      filled
      dense
      label="Confirm Password"
      type="password"
      lazy-rules
      :rules="[
        (val) => (val && val.length > 0) || 'This field is required',
        (val) => (val && val === form.password) || 'Passwords do not match',
      ]"
    >
      <template v-slot:prepend>
        <q-icon size="xs" name="key" />
      </template>
    </q-input>
    <div class="text-left">
      <q-checkbox v-model="termsAccepted" label="I agree to the Terms and Conditions" />
    </div>
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
import type { RegisterPayload } from 'src/models/Auth';
import { type AuthStoreType, useAuthStore } from 'stores/auth';
import { register } from 'src/services/authService';

interface SignupPageData {
  form: RegisterPayload;
  termsAccepted: boolean;
  authStore: AuthStoreType;
}

export default defineComponent({
  data(): SignupPageData {
    return {
      form: {
        firstName: '',
        lastName: '',
        nickname: '',
        email: '',
        password: '',
        confirmPassword: '',
      },
      termsAccepted: false,
      authStore: useAuthStore(),
    };
  },
  methods: {
    async signup() {
      const response = await register(this.form);

      if (response.success) {
        await this.authStore.onLogin(response.data!.token, response.data!.user);
      } else {
        notify(response.message!, true);
      }
    },
    isFormValid(): boolean {
      const emailPattern = /^\S+@\S+\.\S+$/;
      const namePattern = /^[A-Z][a-zA-Z]*$/;

      const isFilled = [
        this.form.email,
        this.form.firstName,
        this.form.lastName,
        this.form.nickname,
        this.form.password,
        this.form.confirmPassword,
        this.termsAccepted,
      ].every((val) => val);

      const doPasswordsMatch =
        this.form.password === this.form.confirmPassword && this.form.password.length >= 8;

      const isFormatCorrect =
        emailPattern.test(this.form.email) &&
        namePattern.test(this.form.firstName) &&
        namePattern.test(this.form.lastName);

      return isFilled && doPasswordsMatch && isFormatCorrect;
    },
  },
});
</script>
