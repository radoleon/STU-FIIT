<template>
  <q-page class="full-height flex column">
    <div class="flex column justify-center items-center q-ma-sm" style="flex: 1">
      <q-icon name="forum" size="64px" color="primary" />
      <div class="text-h4 q-my-md text-weight-medium">Select a channel to start chatting</div>
      <div class="text-subtitle">Choose one from the left sidebar or create a new channel.</div>
    </div>
    <MessageField />
  </q-page>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import MessageField from 'components/MessageField.vue';

export default defineComponent({
  name: 'MainPage',
  components: { MessageField },
});
</script>
