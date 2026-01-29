import type { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext';
import Message from 'App/Models/Message';
import Mention from 'App/Models/Mention';
import User from 'App/Models/User';
import ChannelMember from 'App/Models/ChannelMember';
import MessageDraft from 'App/Models/MessageDraft';
export default class MessagesController {
  public async onJoin({ socket }: WsContextContract, channelId: string) {
    socket.join(`channel:${channelId}`);
  }

  public async onSend({ socket, auth }: WsContextContract, payload) {
    const member = await ChannelMember.query().where('user_id', auth.user!.id).andWhere('channel_id', payload.channelId).first();

    if (!member) {
      return socket.emit('result:failed', 'User is not member of this channel');
    }

    const saved = await Message.create({
      channelId: payload.channelId,
      userId: auth.user!.id,
      content: payload.content,
    });

    if (payload.mentions?.length) {
      const nicknames = payload.mentions.map((m: string) => m.replace('@', ''));
      const users = await User.query().whereIn('nickname', nicknames);

      await Mention.createMany(
        users.map((user) => ({
          messageId: saved.id,
          userId: user.id,
        })),
      );
    }

    await saved.load('mentions', (query) => {
      query.preload('user');
    });
    await saved.load('user', (query) => {
      query.preload('settings');
    });

    socket.nsp.to(`channel:${payload.channelId}`).emit('message:new', saved);
  }

  public async onTyping({ socket, auth }: WsContextContract, payload) {
    const member = await ChannelMember.query().where('user_id', auth.user!.id).andWhere('channel_id', payload.channelId).first();

    if (!member) {
      return socket.emit('result:failed', 'User is not member of this channel');
    }
    await MessageDraft.create(
      {
        userId: auth.user!.id,
        channelId: payload.channelId,
        content: payload.draft || '', 

      }
    );
    socket.broadcast.to(`channel:${payload.channelId}`).emit('user:typing', {
      userId: auth.user!.id,
      draft: payload.draft || '',
      channelId: payload.channelId,
    });
  }
}
