import { defineStore } from 'pinia';
import { type Channel } from 'src/models/Channel';
import { type Message } from 'src/models/Message';

interface ChannelsState {
  channels: Channel[];
}

export const useChannelsStore = defineStore('channels', {
  state: (): ChannelsState => ({
    channels: [],
  }),
  actions: {
    addOrUpdateChannel(channel: Channel) {
      const idx = this.channels.findIndex((x) => x.id === channel.id);
      if (idx !== -1) {
        this.channels[idx] = channel;
      } else {
        this.channels.push(channel);
      }
    },
    removeChannel(channelId: string) {
      this.channels = this.channels.filter((x) => x.id !== channelId);
    },
    setChannels(channels: Channel[]) {
      this.channels = channels;
    },
    updateChannelActivity(message: Message) {
      const channel = this.channels.find((x) => x.id === message.channelId);

      if (channel) {
        channel.messages = [message];
      }
    },
  },
});

export type ChannelsStoreType = ReturnType<typeof useChannelsStore>;
