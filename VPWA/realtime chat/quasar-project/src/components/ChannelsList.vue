<template>
  <q-list>
    <q-item
      bordered
      v-for="channel in channelsSorted"
      :key="channel.id"
      clickable
      @click="openChannel(channel.id)"
      class="q-px-sm"
    >
      <q-item-section>
        <q-item-label lines="1" :class="isInvite(channel) ? 'text-weight-medium' : null">
          {{ channel.name }}
        </q-item-label>
        <q-item-label caption lines="1">
          <q-badge v-if="isInvite(channel)" color="negative" label="Invite" />
          <q-badge v-else-if="isNew(channel)" color="black" label="New" />
          <span v-else>{{ lastMessage(channel) }}</span>
        </q-item-label>
      </q-item-section>

      <q-item-section side>
        {{ calculateTimeAgo(lastActivity(channel)) }}
      </q-item-section>
    </q-item>
  </q-list>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { calculateTimeAgo, notify } from 'src/misc/helpers';
import { type Channel } from 'src/models/Channel';
import { useChannelsStore } from 'stores/channels';
import { getChannels } from 'src/services/channelService';
import { useSocketStore } from 'stores/socket';

export default defineComponent({
  data() {
    return {
      channelsStore: useChannelsStore(),
      socketStore: useSocketStore(),
    };
  },
  methods: {
    async openChannel(channelId: string) {
      const encoded = encodeURIComponent(channelId);
      await this.$router.push({ path: `/channels/${encoded}` });
    },
    isNew(channel: Channel) {
      return !channel.messages?.length;
    },
    isInvite(channel: Channel) {
      return channel.invites?.length;
    },
    lastActivity(channel: Channel) {
      return this.isInvite(channel)
        ? channel.invites?.[0]?.invitedAt
        : this.isNew(channel)
          ? channel.createdAt
          : channel.messages?.[0]?.sentAt;
    },
    lastMessage(channel: Channel) {
      return channel.messages?.[0]?.content;
    },
    calculateTimeAgo(date?: string) {
      return calculateTimeAgo(new Date(date ?? 0));
    },
    async loadChannels() {
      const response = await getChannels();

      if (response.success) {
        this.channelsStore.setChannels(response.data!);
      } else {
        notify(response.message!, true);
      }
    },
  },
  computed: {
    channelsSorted(): Channel[] {
      return [...this.channelsStore.channels].sort((a, b) => {
        if (this.isInvite(a) && !this.isInvite(b)) {
          return -1;
        }
        if (!this.isInvite(a) && this.isInvite(b)) {
          return 1;
        }

        return (
          new Date(this.lastActivity(b) ?? 0).getTime() -
          new Date(this.lastActivity(a) ?? 0).getTime()
        );
      });
    },
  },
  watch: {
    'socketStore.connected': {
      async handler(newVal, oldVal) {
        if (newVal && !oldVal) {
          await this.loadChannels();
        }
      },
      immediate: false,
    },
  },
  async created() {
    await this.loadChannels();
  },
});
</script>
