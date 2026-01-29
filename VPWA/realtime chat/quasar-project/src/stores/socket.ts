import { defineStore } from 'pinia';
import { io, type Socket } from 'socket.io-client';
import { notify } from 'src/misc/helpers';
import { type ChannelsStoreType, useChannelsStore } from 'stores/channels';
import type { Channel } from 'src/models/Channel';
import { useAuthStore } from 'stores/auth';
import type { Message } from 'src/models/Message';
import { AppVisibility } from 'quasar';
import type { Setting } from 'src/models/User';

interface EventMap {
  [event: string]: (...args: any[]) => void | Promise<void>;
}

interface SocketState {
  connected: boolean;
  ws: Socket | null;
  channelsStore: ChannelsStoreType;
  listeners: EventMap;
  authStore: ReturnType<typeof useAuthStore>;
}

export const useSocketStore = defineStore('socket', {
  state: (): SocketState => ({
    connected: false,
    ws: null,
    channelsStore: useChannelsStore(),
    listeners: {},
    authStore: useAuthStore(),
  }),
  actions: {
    connect(token: string, statusId?: number) {
      if (this.connected) {
        return;
      }

      this.ws = io('http://localhost:3333/ws', {
        transports: ['websocket'],
        auth: {
          token: token,
        },
      });

      this.ws.on('connect', () => {
        console.log('Websocket Connected');
        this.connected = true;
      });

      this.initializeAlerts();
      this.initializeListeners();

      this.subscribe();

      this.ws.emit('status:new', statusId ?? 1);
    },
    disconnect() {
      if (!this.connected) {
        return;
      }

      this.connected = false;

      this.ws?.emit('status:new', 2);

      if (this.authStore.currentUser?.settings) {
        this.authStore.currentUser.settings.statusId = 2;
      }

      this.unsubscribe();

      this.ws?.disconnect();
      this.ws = null;
    },
    initializeAlerts() {
      this.listeners['result:success'] = (message: string) => {
        notify(message, false);
      };

      this.listeners['result:failed'] = (message: string) => {
        notify(message, true);
      };
    },
    initializeListeners() {
      this.listeners['join:added'] = async (channel: Channel) => {
        this.channelsStore.addOrUpdateChannel(channel);

        await this.router.push(`/channels/${channel.id}`);
      };

      this.listeners['invite:received'] = (channel: Channel) => {
        this.channelsStore.addOrUpdateChannel(channel);
      };

      this.listeners['channel:removed'] = async (channelId: string) => {
        const currentChannelId = this.router.currentRoute.value.params.id;

        if (currentChannelId === channelId) {
          await this.router.push('/');
        }
        this.channelsStore.removeChannel(channelId);
      };

      this.listeners['message:new'] = (message: Message) => {
        const user = this.authStore.currentUser;

        if (!AppVisibility.appVisible && !(message.userId === user?.id)) {
          if (
            user?.settings?.statusId === 1 &&
            (!user?.settings?.onlyAddressed || message.mentions.some((x) => x.userId === user?.id))
          ) {
            new Notification(`New Message from: ${message.user.nickname}`, {
              body: message.content.slice(0, 60) + (message.content.length > 60 ? '…' : ''),
              icon: '/icons/favicon.svg',
            });
          }
        }

        this.channelsStore.updateChannelActivity(message);
      };

      this.listeners['status:changed'] = (userId: number, settings: Setting) => {
        if (userId === this.authStore.currentUser?.id) {
          this.authStore.currentUser.settings = settings;
        }
      };
    },
    subscribe() {
      Object.keys(this.listeners).forEach((event) => {
        this.ws?.on(event, this.listeners[event]!);
      });
    },
    unsubscribe() {
      Object.keys(this.listeners).forEach((event) => {
        this.ws?.off(event, this.listeners[event]!);
      });
    },
  },
});

export type SocketStoreType = ReturnType<typeof useSocketStore>;
