<template>
  <q-separator class="q-mx-sm" />
  <div v-if="commands.length" class="q-pt-sm q-pl-sm">
    <q-badge
      v-for="(command, i) in commands"
      :key="i"
      class="q-mr-sm"
      :color="!command.startsWith('/') && i == 0 ? 'red' : 'black'"
    >
      <q-icon
        v-if="!command.startsWith('/') && i == 0"
        name="warning"
        size="10px"
        class="q-mr-xs"
      />
      {{ command }}
    </q-badge>
  </div>

  <div v-if="mentions.length" class="q-pt-sm q-pl-sm">
    <q-badge v-for="(mention, i) in mentions" :key="i" color="warning" class="q-mr-sm">
      {{ mention }}
    </q-badge>
  </div>

  <div class="row items-center q-px-sm" style="padding-block: 11px">
    <q-input
      v-model="newMessage"
      placeholder="Type a message..."
      outlined
      dense
      class="col rounded-lg"
      autogrow
      :max-height="100"
      @keydown.enter.exact.prevent="addMessage"
      :disable="!socketStore.connected"
    />
    <q-btn
      icon="send"
      size="12px"
      flat
      round
      color="primary"
      class="q-ml-sm"
      @click="addMessage"
      :disable="disableButton || !socketStore.connected"
    />
  </div>

  <q-dialog
    v-if="channel"
    :model-value="usersDialogOpen"
    @update:model-value="(val) => $emit('update:usersDialogOpen', val)"
  >
    <q-card class="shadow-1 rounded-xl" style="min-width: min(300px, 95%)">
      <q-card-section class="text-h6 text-secondary">Users</q-card-section>

      <q-card-section>
        <div class="q-mb-sm" v-for="user of channel.users" :key="user.id">
          <q-avatar color="secondary" size="md" text-color="white">
            {{ user.nickname[0] }}
            <q-badge :color="getUserStatus(user.settings!.statusId).value" rounded floating />
          </q-avatar>
          <span class="q-ml-sm text-weight-medium gt-xs">{{ user.nickname }}</span>
          <q-badge
            v-if="user.isAdmin"
            class="q-ml-sm gt-xs"
            outline
            color="warning"
            label="Admin"
          />
          <q-badge
            v-if="user.id === authStore.currentUser?.id"
            class="q-ml-sm gt-xs"
            outline
            color="positive"
            label="You"
          />
        </div>
      </q-card-section>

      <q-separator />

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="secondary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script lang="ts">
import { defineComponent, type PropType } from 'vue';
import { useSocketStore } from 'stores/socket';
import type { Channel } from 'src/models/Channel';
import { useAuthStore } from 'stores/auth';
import { getUserStatus } from 'src/misc/helpers';

export default defineComponent({
  props: {
    channel: {
      type: Object as PropType<Channel | null>,
      required: false,
      default: null,
    },
    usersDialogOpen: {
      type: Boolean,
      required: false,
    },
  },

  emits: ['update:usersDialogOpen'],

  data() {
    return {
      socketStore: useSocketStore(),
      authStore: useAuthStore(),
      newMessage: '',
    };
  },

  methods: {
    getUserStatus,
    addMessage() {
      if (this.isMessageEmpty || (this.commands.length && !this.commands[0]!.startsWith('/'))) {
        return;
      }

      this.constructMessage();
      this.newMessage = '';
    },

    constructMessage() {
      const socket = this.socketStore.ws;

      if (!socket) return;

      if (this.commands.length) {
        switch (this.commands[0]) {
          case '/join':
            socket.emit('join:sent', this.commands[1]!, this.commands.length === 2, false);
            break;

          case '/invite':
            socket.emit('invite:sent', this.channel!.id, this.commands[1]!);
            break;

          case '/revoke':
            socket.emit('revoke:sent', this.channel!.id, this.commands[1]!);
            break;

          case '/kick':
            socket.emit('kick:sent', this.channel!.id, this.commands[1]!);
            break;

          case '/quit':
            socket.emit('quit:sent', this.channel!.id);
            break;

          case '/cancel':
            socket.emit('cancel:sent', this.channel!.id);
            break;

          case '/list':
            this.$emit('update:usersDialogOpen', true);
            break;

          default:
            break;
        }
      } else {
        socket.emit('message:send', {
          channelId: this.channel!.id,
          content: this.newMessage.trim(),
          mentions: this.mentions,
        });
      }
    },

    sendDraft() {
      const socket = this.socketStore.ws;
      if (!socket) return;
      socket.emit('message:typing', {
        channelId: this.channel!.id,
        draft: this.newMessage.trim(),
      });
    },
  },

  computed: {
    commands(): string[] {
      const text = this.newMessage.trim();
      if (!text.startsWith('/')) return [];

      const parts = text.split(/\s+/);
      const error = 'Invalid command, message will be sent as plain text';

      const command = parts[0];
      const args = parts.slice(1);

      switch (command) {
        case '/join':
          if (args.length === 1) return parts;
          if (args.length === 2 && args[1] === '[private]') return parts;
          return [error];

        case '/invite':
          if (!this.channel) return ['You need to open a channel to invite members'];
          if (!this.channel.isPublic && !this.isAdmin)
            return ['Only admin can invite users to private channel'];
          if (args.length === 1) return parts;
          return [error];

        case '/revoke':
          if (!this.channel) return ['You need to open a channel to revoke members'];
          if (this.channel.isPublic || !this.isAdmin)
            return ['Only admin of private channel can revoke users'];
          if (args.length === 1) return parts;
          return [error];

        case '/kick':
          if (!this.channel) return ['You need to open a channel to kick members'];
          if (!this.channel.isPublic) return ['You can kick users only in public channels'];
          if (args.length === 1) return parts;
          return [error];

        case '/quit':
          if (!this.channel) return ['You need to open a channel to quit it'];
          if (!this.isAdmin) return ['You have to be admin to quit a channel'];
          if (args.length === 0) return parts;
          return [error];

        case '/cancel':
          if (!this.channel) return ['You need to open a channel to cancel it'];
          if (args.length === 0) return parts;
          return [error];

        case '/list':
          if (!this.channel) return ['You need to open a channel to list members'];
          if (args.length === 0) return parts;
          return [error];

        default:
          return [error];
      }
    },

    mentions() {
      const text = this.newMessage.trim();
      if (text.startsWith('/') || !text.includes('@') || !this.channel || this.isInvite) return [];

      const parts = text.split(/\s+/);
      const mentions = parts.filter((x) => x.startsWith('@'));

      const users = this.channel?.users?.map((x) => '@' + x.nickname) ?? [];
      return mentions.filter((x) => users.includes(x));
    },

    isAdmin() {
      return this.channel?.users?.some((x) => x.isAdmin && x.id === this.authStore.currentUser!.id);
    },

    isInvite() {
      return this.channel?.invites?.length ?? false;
    },

    isMessageEmpty() {
      return this.newMessage.trim().length === 0;
    },

    disableButton() {
      return this.isMessageEmpty || (!this.channel && this.commands.length < 2);
    },
  },

  watch: {
    newMessage: {
      handler() {
        this.sendDraft();
      },
      immediate: false,
    },
  },
});
</script>
