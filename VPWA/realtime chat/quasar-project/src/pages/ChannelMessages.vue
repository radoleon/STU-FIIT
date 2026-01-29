<template>
  <q-page v-if="channel && initialLoad" class="flex column full-height no-wrap">
    <div class="row items-center bg-secondary q-pa-sm">
      <div class="col text-subtitle text-weight-medium text-white flex items-center">
        {{ channel.name }}
        <q-badge v-if="isAdmin" class="q-ml-sm gt-xs" outline color="warning" label="Admin" />
      </div>
      <div class="col text-center">
        <q-chip v-if="channel.isPublic" icon="lock_open" :clickable="false" :ripple="false">
          Pu<span class="gt-xs">blic</span>
        </q-chip>
        <q-chip v-else icon="lock" :clickable="false" :ripple="false">
          Pr<span class="gt-xs">ivate</span>
        </q-chip>
      </div>
      <div class="col text-right">
        <q-btn
          v-if="!isInvite"
          flat
          round
          size="12px"
          icon="person_search"
          color="white"
          aria-label="Leave channel"
          @click="usersDialogOpen = !usersDialogOpen"
        >
          <q-tooltip class="gt-xs" anchor="top left">List users</q-tooltip>
        </q-btn>
        <q-btn
          v-if="!isAdmin && !isInvite"
          :disable="!socketStore.connected"
          flat
          round
          size="12px"
          icon="exit_to_app"
          color="white"
          aria-label="Leave channel"
          @click="leaveChannelDialogOpen = !leaveChannelDialogOpen"
        >
          <q-tooltip class="gt-xs" anchor="top left">Leave channel</q-tooltip>
        </q-btn>
        <q-btn
          v-if="isAdmin"
          :disable="!socketStore.connected"
          flat
          round
          size="12px"
          icon="more_vert"
          color="white"
          aria-label="Channel settings"
          @click="adminOptionsDialogOpen = !adminOptionsDialogOpen"
        >
          <q-tooltip class="gt-xs" anchor="top left">Channel settings</q-tooltip>
        </q-btn>
      </div>
    </div>

    <q-dialog v-model="adminOptionsDialogOpen" persistent>
      <q-card class="shadow-1 rounded-xl" style="min-width: min(400px, 95%)">
        <q-card-section class="text-h6 text-secondary">Channel Settings</q-card-section>
        <q-card-section>
          <div class="row items-start no-wrap">
            <q-input
              class="col-9 q-mr-sm"
              v-model="userToAdd"
              label="New User"
              filled
              dense
              lazy-rules
              :rules="[(val) => (val && val.length > 0) || 'This field is required']"
            >
              <template v-slot:prepend>
                <q-icon size="xs" name="person" />
              </template>
            </q-input>
            <q-btn
              class="col-3"
              flat
              label="Add"
              color="primary"
              size="16px"
              :disable="!userToAdd"
              @click="addUserToChannel"
            />
          </div>
          <q-btn
            class="full-width q-mt-md"
            unelevated
            label="Delete Channel"
            color="negative"
            @click="deleteChannel"
          />
        </q-card-section>
        <q-separator />
        <q-card-actions align="right">
          <q-btn flat label="Close" color="secondary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-dialog v-model="leaveChannelDialogOpen" persistent>
      <q-card class="shadow-1 rounded-xl" style="min-width: min(400px, 95%)">
        <q-card-section class="text-h6 text-weight-regular"
          >Are you sure you want to leave this channel?</q-card-section
        >
        <q-separator />

        <q-card-actions align="right">
          <q-btn unelevated class="q-mr-xs" label="Leave" color="primary" @click="leaveChannel" />
          <q-btn flat label="Cancel" color="secondary" v-close-popup />
        </q-card-actions>
      </q-card>
    </q-dialog>

    <q-scroll-area
      v-if="!isInvite"
      ref="scrollArea"
      style="flex: 1 1 0; overflow-x: hidden"
      class="q-px-sm"
    >
      <q-infinite-scroll reverse :offset="200" @load="loadMoreMessages">
        <div
          v-for="msg in messages"
          :key="msg.id"
          class="q-mb-sm"
          style="overflow-wrap: break-word"
        >
          <q-chat-message
            class="q-pr-sm"
            :sent="isOwn(msg)"
            :name="isOwn(msg) ? 'you' : msg.user.nickname"
            :stamp="calculateTimeAgo(msg.sentAt)"
            :bg-color="
              msg.mentions.some((x) => x.userId === authStore.currentUser?.id)
                ? 'warning'
                : undefined
            "
          >
            <template v-slot:avatar v-if="!isOwn(msg)">
              <q-avatar color="secondary" class="q-mr-md" size="lg" text-color="white">
                {{ msg.user.nickname[0] }}
                <q-badge :color="getStatusColor(msg)" rounded floating />
              </q-avatar>
            </template>
            <div>
              <span
                v-for="(token, i) in tokenizeMessage(msg)"
                :key="i"
                :class="{
                  'text-weight-bold bg-warning': token.type === 'mention',
                }"
              >
                {{ token.value }}
              </span>
            </div>
          </q-chat-message>
        </div>

        <template #loading>
          <div class="row justify-center q-my-md">
            <q-spinner-dots color="primary" size="40px" />
          </div>
        </template>
      </q-infinite-scroll>
    </q-scroll-area>

    <div v-else class="flex column justify-center items-center col q-ma-sm" style="flex: 1">
      <q-icon name="groups" size="64px" color="primary" />
      <div class="text-h4 q-my-md text-weight-medium">
        You have been invited to <span class="text-primary">{{ channel.name }}</span>
      </div>
      <div class="text-subtitle">Accept or decline the invite bellow.</div>
      <div class="flex q-mt-md">
        <q-btn
          :disable="!socketStore.connected"
          outline
          color="positive"
          label="Accept"
          class="q-mr-sm"
          @click="acceptInvite"
        />
        <q-btn
          :disable="!socketStore.connected"
          outline
          color="negative"
          label="Decline"
          @click="rejectInvite"
        />
      </div>
    </div>
    <div class="q-pa-sm" v-if="Object.keys(typingUsers).length">
      <div v-for="(draft, userId) in typingUsers" :key="userId">
        <p v-if="!displayDraft[userId]" class="q-ma-none flex bi-align-center q-gutter-x-xs">
          <span class="text-weight-bold">{{ getNickname(userId) }}</span>
          <span class="text-secondary">is typing:</span>
          <q-btn
            @click="displayDraft[userId] = true"
            round
            unelevated
            color="dark"
            size="xs"
            icon="visibility"
          />
        </p>
        <p
          v-if="draft !== '' && displayDraft[userId]"
          class="q-ma-none flex bi-align-center q-gutter-x-xs"
        >
          <span class="text-weight-bold">{{ getNickname(userId) }}</span>
          <span class="text-secondary">is typing:</span>
          <q-btn
            @click="displayDraft[userId] = false"
            round
            unelevated
            color="dark"
            size="xs"
            icon="visibility_off"
          />
          <span class="text-secondary">{{ draft }}</span>
        </p>
      </div>
    </div>
    <MessageField v-model:usersDialogOpen="usersDialogOpen" :channel="channel" />
  </q-page>
</template>

<script lang="ts">
import { defineComponent, nextTick } from 'vue';
import { calculateTimeAgo, getUserStatus, notify, tokenizeMessage } from 'src/misc/helpers';
import { type QScrollArea } from 'quasar';
import { type ChannelsStoreType, useChannelsStore } from 'stores/channels';
import { type SocketStoreType, useSocketStore } from 'stores/socket';
import { getChannel } from 'src/services/channelService';
import { type Channel } from 'src/models/Channel';
import { type AuthStoreType, useAuthStore } from 'stores/auth';
import MessageField from 'components/MessageField.vue';
import { getMessages } from 'src/services/messageService';
import { type Message } from 'src/models/Message';
import { type Setting, type User } from 'src/models/User';

interface EventMap {
  [event: string]: (...args: any[]) => void | Promise<void>;
}

interface ChannelMessagesState {
  channelsStore: ChannelsStoreType;
  authStore: AuthStoreType;
  socketStore: SocketStoreType;
  channel: Channel | null;
  leaveChannelDialogOpen: boolean;
  adminOptionsDialogOpen: boolean;
  userToAdd: string;
  listeners: EventMap;
  messages: Message[];
  hasMore: boolean;
  page: number;
  initialLoad: boolean;
  typingUsers: { [userId: number]: string };
  typingTimeouts: { [userId: number]: ReturnType<typeof setTimeout> };
  displayDraft: { [userId: number]: boolean };
  usersDialogOpen: boolean;
}

export default defineComponent({
  components: { MessageField },
  data(): ChannelMessagesState {
    return {
      channelsStore: useChannelsStore(),
      authStore: useAuthStore(),
      socketStore: useSocketStore(),
      channel: null,
      leaveChannelDialogOpen: false,
      adminOptionsDialogOpen: false,
      userToAdd: '',
      listeners: {},
      messages: [],
      hasMore: true,
      page: 1,
      initialLoad: false,
      typingUsers: {},
      typingTimeouts: {},
      displayDraft: {},
      usersDialogOpen: false,
    };
  },
  methods: {
    async loadMoreMessages(index: number, done: () => void) {
      if (!this.hasMore) {
        done();
        return;
      }

      const nextPage = this.page + 1;
      const res = await getMessages(this.channel!.id, nextPage);

      if (!res.success || res.data!.length === 0) {
        this.hasMore = false;
        done();
        return;
      }

      const el = this.$refs.scrollArea as QScrollArea;
      const scrollEl = el.getScrollTarget() as HTMLElement;

      const newMessages = res.data!;

      const oldHeight = scrollEl.scrollHeight;

      this.messages = [...newMessages.reverse(), ...this.messages];
      this.page = nextPage;

      await nextTick();
      const newHeight = scrollEl.scrollHeight;
      scrollEl.scrollTop = newHeight - oldHeight;

      done();
    },
    async loadChannel(channelId: string) {
      const response = await getChannel(channelId);

      if (response.success) {
        this.channel = response.data!;
      } else {
        notify(response.message!, true);
        return;
      }

      if (!response.data!.invites?.length) {
        const msgs = await getMessages(channelId);

        if (msgs.success) {
          this.messages = msgs.data!.reverse();

          if (!this.initialLoad) {
            this.initialLoad = true;
          }

          await nextTick();
          this.scrollToBottom();

          this.socketStore.ws?.emit('message:join', channelId);
        } else {
          notify(response.message!, true);
        }
      } else {
        if (!this.initialLoad) {
          this.initialLoad = true;
        }
      }
    },
    leaveChannel() {
      this.socketStore.ws?.emit('cancel:sent', this.channel!.id);
    },
    deleteChannel() {
      this.socketStore.ws?.emit('quit:sent', this.channel!.id);
    },
    acceptInvite() {
      this.socketStore.ws?.emit('invite:accept', this.channel?.invites?.[0]?.id);
    },
    rejectInvite() {
      this.socketStore.ws?.emit('invite:reject', this.channel?.invites?.[0]?.id);
    },
    scrollToBottom() {
      const el = this.$refs.scrollArea as QScrollArea | undefined;
      if (!el) return;

      const scrollEl = el.getScrollTarget();
      if (scrollEl) {
        const max = scrollEl.scrollHeight;
        el.setScrollPercentage('vertical', max, 300);
      }
    },
    addUserToChannel() {
      if (!this.userToAdd) return;

      this.socketStore.ws?.emit('invite:sent', this.channel!.id, this.userToAdd);
      this.userToAdd = '';
    },
    getNickname(userId: number) {
      return this.channel?.users?.find((u) => u.id == userId)?.nickname ?? 'User';
    },
    initializeListeners() {
      this.listeners['invite:accepted'] = async (channel: Channel) => {
        this.channelsStore.addOrUpdateChannel(channel);
        this.initialLoad = false;
        await this.loadChannel(channel.id);
      };

      this.listeners['invite:rejected'] = async (channel: Channel) => {
        this.channelsStore.removeChannel(channel.id);
        await this.$router.push('/');
      };

      this.listeners['message:new'] = async (msg: Message) => {
        if (msg.channelId === this.channel?.id) {
          this.messages.push(msg);
          await nextTick();
          this.scrollToBottom();
        }
      };

      this.listeners['user:typing'] = (data) => {
        if (data.channelId !== this.channel?.id) return;
        this.typingUsers[data.userId] = data.draft;
        clearTimeout(this.typingTimeouts[data.userId]);
        this.typingTimeouts[data.userId] = setTimeout(() => {
          delete this.typingUsers[data.userId];
        }, 2000);
      };

      this.listeners['status:changed'] = (userId: number, settings: Setting) => {
        const user = this.channel?.users?.find((x) => x.id === userId);

        if (user) {
          user.settings = settings;
        }

        this.messages.forEach((x) => {
          if (x.user.id === userId) {
            x.user.settings = settings;
          }
        });
      };

      this.listeners['user:joined'] = (channelId: string, user: User) => {
        if (channelId === this.channel?.id && !this.channel?.users?.some((x) => x.id === user.id)) {
          this.channel!.users?.push(user);
        }
      };

      this.listeners['user:removed'] = (channelId: string, userId: number) => {
        if (channelId === this.channel?.id && this.channel.users) {
          this.channel.users = this.channel.users.filter((x) => x.id !== userId);
        }
      };
    },
    subscribe() {
      Object.keys(this.listeners).forEach((event) => {
        this.socketStore.ws?.on(event, this.listeners[event]!);
      });
    },
    unsubscribe() {
      Object.keys(this.listeners).forEach((event) => {
        this.socketStore.ws?.off(event, this.listeners[event]!);
      });
    },
    calculateTimeAgo(date?: string) {
      return calculateTimeAgo(new Date(date ?? 0));
    },
    isOwn(message: Message) {
      return message.userId === this.authStore.currentUser?.id;
    },
    getStatusColor(message: Message) {
      return getUserStatus(message.user.settings?.statusId ?? 2).value;
    },
    tokenizeMessage(message: Message) {
      return tokenizeMessage(message);
    },
    resetVariables() {
      this.channel = null;
      this.messages = [];
      this.hasMore = true;
      this.page = 1;

      this.initialLoad = false;

      this.typingUsers = {};
      this.typingTimeouts = {};
      this.displayDraft = {};
    },
  },
  watch: {
    '$route.params.id': {
      async handler(newId) {
        this.resetVariables();

        await this.loadChannel(newId);
      },
      immediate: false,
    },
    'socketStore.connected': {
      async handler(newVal, oldVal) {
        if (newVal && !oldVal) {
          this.resetVariables();

          const id = this.$route.params.id as string;
          await this.loadChannel(id);

          this.subscribe();
        } else if (!newVal && oldVal) {
          this.unsubscribe();
        }
      },
      immediate: false,
    },
    adminOptionsDialogOpen(newValue) {
      if (!newValue) {
        this.userToAdd = '';
      }
    },
  },
  computed: {
    isAdmin() {
      return this.channel?.users?.some((x) => x.isAdmin && x.id === this.authStore.currentUser!.id);
    },
    isInvite() {
      return this.channel?.invites?.length ?? false;
    },
  },
  async created() {
    const id = this.$route.params.id as string;
    await this.loadChannel(id);

    this.initializeListeners();

    if (this.socketStore.connected) {
      this.subscribe();
    }
  },
  beforeUnmount() {
    this.unsubscribe();
  },
});
</script>
