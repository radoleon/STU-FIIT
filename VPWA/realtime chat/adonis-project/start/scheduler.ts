import Channel from 'App/Models/Channel';
import { DateTime } from 'luxon';
import Ws from '@ioc:Ruby184/Socket.IO/Ws';

async function cleanupChannels() {
  try {
    const threshold = DateTime.now().minus({ days: 30 });

    const channels = await Channel.query().preload('messages', (q) => {
      q.orderBy('sent_at', 'desc').limit(1);
    });

    let deleted = 0;

    for (const channel of channels) {
      const lastMessage = channel.messages[0];

      const lastActivity = lastMessage?.sentAt || channel.createdAt;

      if (lastActivity < threshold) {
        console.log(`Deleting inactive channel: ${channel.id}`);
        deleted += 1;
        try {
          Ws.io.in(`channel:${channel.id}`).emit('channel:removed', channel.id);
          await channel.delete();
        } catch (err) {
          console.error('Failed to delete channel:', err);
        }
      }
    }

    if (deleted > 0) {
      console.info(`Scheduler: deleted ${deleted} inactive channel(s).`);
    } else {
      console.info('Scheduler: no inactive channels found.');
    }
  } catch (err) {
    console.error('Scheduler failed:', err);
  }
}

function startScheduler(intervalMs = 24 * 60 * 60 * 1000) {
  cleanupChannels().catch((err) => console.error('Startup cleanup failed:', err));

  setInterval(() => cleanupChannels().catch((err) => console.error('Scheduled cleanup failed:', err)), intervalMs);
}

export { cleanupChannels, startScheduler };
