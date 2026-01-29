import type { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext';
import Invite from 'App/Models/Invite';
import Channel from 'App/Models/Channel';
import User from 'App/Models/User';
import ChannelMember from 'App/Models/ChannelMember';
import BanVote from 'App/Models/BanVote';

export default class WsChannelsController {
  public async onConnect({ socket, auth }: WsContextContract) {
    const room = `user:${auth.user!.id}`;
    socket.join(room);

    const channels = await ChannelMember.query().where('user_id', auth.user!.id).select('channel_id');

    socket.join(channels.map((x) => `channel:${x.channelId}`));
  }

  public async onDisconnect({ socket, auth }: WsContextContract) {
    const room = `user:${auth.user!.id}`;
    socket.leave(room);

    const channels = await ChannelMember.query().where('user_id', auth.user!.id).select('channel_id');

    channels.forEach((x) => {
      socket.leave(`channel:${x.channelId}`);
    });
  }

  public async onChannelJoin({ socket, auth }: WsContextContract, channelName: string, isPublic: boolean, createOnly: boolean) {
    try {
      const channel = await Channel.query().where('name', channelName).first();

      if (channel) {
        if (createOnly) {
          return socket.emit('result:failed', `Channel with name ${channelName} already exists`);
        }

        if (channel.isPublic) {
          const adminMember = await ChannelMember.query().where('channel_id', channel.id).andWhere('is_admin', true).firstOrFail();

          const banVotes = await BanVote.query().where('for_user_id', auth.user!.id).andWhere('channel_id', channel.id);

          if (banVotes.length >= 3 || banVotes.some((x) => x.byUserId === adminMember.userId)) {
            return socket.emit('result:failed', 'You have permanent ban for this channel');
          }

          await Invite.query().where('for_user_id', auth.user!.id).andWhere('channel_id', channel.id).delete();

          await ChannelMember.create({
            userId: auth.user!.id,
            channelId: channel.id,
            isAdmin: false,
          });

          await channel.load('messages', (query) => {
            query.orderBy('sent_at', 'desc').limit(1);
          });

          const user = await User.query().where('id', auth.user!.id).preload('settings').firstOrFail();

          socket.join(`channel:${channel.id}`);

          socket.emit('join:added', channel);
          socket.nsp.to(`channel:${channel.id}`).emit('user:joined', channel.id, user);

          socket.emit('result:success', 'Channel joined successfully');
        } else {
          socket.emit('result:failed', `Channel ${channelName} already exists and is private`);
        }
      } else {
        const channel = await Channel.create({ name: channelName, isPublic });

        await ChannelMember.create({
          userId: auth.user!.id,
          channelId: channel.id,
          isAdmin: true,
        });

        socket.join(`channel:${channel.id}`);

        socket.emit('join:added', channel);
        socket.emit('result:success', 'Channel joined successfully');
      }
    } catch (error) {
      if (error.code === '23505') {
        return socket.emit('result:failed', 'You are already in the channel');
      }

      socket.emit('result:failed', error.message);
    }
  }

  public async onChannelInvite({ socket, auth }: WsContextContract, channelId: string, forUserName: string) {
    try {
      const { id: forUserId } = await User.query().select('id').where('nickname', forUserName).firstOrFail();

      if (forUserId === auth.user!.id) {
        return socket.emit('result:failed', 'You cannot invite yourself');
      }

      const channel = await Channel.query().where('id', channelId).firstOrFail();

      const channelMember = await ChannelMember.query().where('user_id', forUserId).andWhere('channel_id', channelId).first();

      if (channelMember) {
        return socket.emit('result:failed', 'User is already member of the channel');
      }

      const adminMember = await ChannelMember.query().where('channel_id', channel.id).andWhere('is_admin', true).firstOrFail();

      if (!channel.isPublic) {
        if (adminMember.userId !== auth.user!.id) {
          return socket.emit('result:failed', 'You are not admin of the channel');
        }
      } else {
        if (adminMember.userId !== auth.user!.id) {
          const banVotes = await BanVote.query().where('for_user_id', forUserId).andWhere('channel_id', channel.id);

          if (banVotes.length >= 3 || banVotes.some((x) => x.byUserId === adminMember.userId)) {
            return socket.emit('result:failed', 'User has permanent ban for this channel');
          }
        } else {
          await BanVote.query().where('for_user_id', forUserId).andWhere('channel_id', channel.id).delete();
        }
      }

      const invite = await Invite.create({
        channelId,
        forUserId,
        byUserId: auth.user!.id,
      });

      await channel.load('invites', (query) => {
        query.where('id', invite.id);
      });

      const room = `user:${forUserId}`;
      socket.nsp.in(room).emit('invite:received', channel);

      socket.emit('result:success', 'Invite sent successfully');
    } catch (error) {
      if (error.code === '23505') {
        return socket.emit('result:failed', 'You have already invited user to the channel');
      }
      if (error.code === 'E_ROW_NOT_FOUND') {
        return socket.emit('result:failed', 'User or channel does not exist');
      }

      socket.emit('result:failed', error.message);
    }
  }

  public async onChannelRevoke({ socket, auth }: WsContextContract, channelId: string, forUserName: string) {
    try {
      const { id: forUserId } = await User.query().select('id').where('nickname', forUserName).firstOrFail();

      const channel = await Channel.query().where('id', channelId).firstOrFail();

      const adminMember = await ChannelMember.query().where('channel_id', channelId).andWhere('is_admin', true).firstOrFail();

      if (adminMember.userId !== auth.user!.id) {
        return socket.emit('result:failed', 'You are not admin of the channel');
      }

      if (channel.isPublic) {
        return socket.emit('result:failed', 'You can revoke users only in private channel');
      }

      const member = await ChannelMember.query().where('user_id', forUserId).andWhere('channel_id', channelId).first();

      if (!member) {
        return socket.emit('result:failed', 'User is not member of the channel');
      }

      await member.delete();

      const room = `user:${forUserId}`;

      socket.nsp.in(room).socketsLeave(`channel:${channelId}`);
      socket.nsp.in(room).emit('channel:removed', channel.id);

      socket.nsp.in(`channel:${channelId}`).emit('user:removed', channelId, forUserId);

      socket.emit('result:success', 'User was revoked successfully');
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return socket.emit('result:failed', 'User or channel does not exist');
      }

      socket.emit('result:failed', error.message);
    }
  }

  public async onChannelKick({ socket, auth }: WsContextContract, channelId: string, forUserName: string) {
    try {
      const { id: forUserId } = await User.query().select('id').where('nickname', forUserName).firstOrFail();

      const channel = await Channel.query().where('id', channelId).firstOrFail();

      if (!channel.isPublic) {
        return socket.emit('result:failed', 'You can kick users only in public channel');
      }

      const member = await ChannelMember.query().where('channel_id', channelId).andWhere('user_id', forUserId).first();

      if (!member) {
        return socket.emit('result:failed', 'User is not member of the channel');
      }

      const adminMember = await ChannelMember.query().where('channel_id', channelId).andWhere('is_admin', true).firstOrFail();

      await BanVote.create({
        channelId,
        forUserId,
        byUserId: auth.user!.id,
      });

      if (adminMember.userId === auth.user!.id) {
        await member.delete();

        const room = `user:${forUserId}`;

        socket.nsp.in(room).socketsLeave(`channel:${channel.id}`);
        socket.nsp.in(room).emit('channel:removed', channelId);

        socket.nsp.in(`channel:${channelId}`).emit('user:removed', channelId, forUserId);
      } else {
        const banVotes = await BanVote.query().where('for_user_id', forUserId).andWhere('channel_id', channelId);

        if (banVotes.length >= 3) {
          await member.delete();

          const room = `user:${forUserId}`;

          socket.nsp.in(room).socketsLeave(`channel:${channel.id}`);
          socket.nsp.in(room).emit('channel:removed', channelId);

          socket.nsp.in(`channel:${channelId}`).emit('user:removed', channelId, forUserId);
        }
      }

      socket.emit('result:success', 'User was kicked successfully');
    } catch (error) {
      if (error.code === '23505') {
        return socket.emit('result:failed', 'You have already kicked the user in this channel');
      }
      if (error.code === 'E_ROW_NOT_FOUND') {
        return socket.emit('result:failed', 'User or channel does not exist');
      }

      socket.emit('result:failed', error.message);
    }
  }

  public async onChannelQuit({ socket, auth }: WsContextContract, channelId: string) {
    try {
      const channel = await Channel.query().where('id', channelId).firstOrFail();

      const adminMember = await ChannelMember.query().where('channel_id', channelId).andWhere('is_admin', true).firstOrFail();

      if (adminMember.userId !== auth.user!.id) {
        return socket.emit('result:failed', 'Channel can be quit only by admin member');
      }

      const members = await ChannelMember.query().where('channel_id', channelId);

      await channel.delete();

      socket.nsp.in(`channel:${channelId}`).emit('channel:removed', channelId);

      members.forEach((x) => {
        const room = `user:${x.userId}`;
        socket.nsp.in(room).socketsLeave(`channel:${channelId}`);
      });

      socket.emit('result:success', 'Channel was quit successfully');
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return socket.emit('result:failed', 'Channel does not exist');
      }

      socket.emit('result:failed', error.message);
    }
  }

  public async onChannelCancel({ socket, auth }: WsContextContract, channelId: string) {
    try {
      const channel = await Channel.query().where('id', channelId).firstOrFail();

      const member = await ChannelMember.query().where('user_id', auth.user!.id).andWhere('channel_id', channelId).first();

      if (!member) {
        return socket.emit('result:failed', 'User is not member of this channel');
      }

      if (member.isAdmin) {
        const members = await ChannelMember.query().where('channel_id', channelId);

        await channel.delete();

        socket.nsp.in(`channel:${channelId}`).emit('channel:removed', channelId);

        members.forEach((x) => {
          const room = `user:${x.userId}`;
          socket.nsp.in(room).socketsLeave(`channel:${channelId}`);
        });
      } else {
        await member.delete();

        const room = `user:${auth.user!.id}`;

        socket.nsp.in(room).socketsLeave(`channel:${channel.id}`);
        socket.nsp.in(room).emit('channel:removed', channelId);

        socket.nsp.in(`channel:${channelId}`).emit('user:removed', channelId, auth.user!.id);
      }

      socket.emit('result:success', 'Channel was cancelled successfully');
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return socket.emit('result:failed', 'Channel does not exist');
      }

      socket.emit('result:failed', error.message);
    }
  }

  public async onInviteAccept({ socket, auth }: WsContextContract, inviteId: number) {
    try {
      const invite = await Invite.query().where('id', inviteId).firstOrFail();

      const channel = await Channel.query().where('id', invite.channelId).firstOrFail();

      await Invite.query().where('for_user_id', auth.user!.id).andWhere('channel_id', channel.id).delete();

      await ChannelMember.create({
        userId: auth.user!.id,
        channelId: channel.id,
        isAdmin: false,
      });

      await channel.load('messages', (query) => {
        query.orderBy('sent_at', 'desc').limit(1);
      });

      const user = await User.query().where('id', auth.user!.id).preload('settings').firstOrFail();

      socket.join(`channel:${channel.id}`);

      socket.emit('invite:accepted', channel);
      socket.nsp.to(`channel:${channel.id}`).emit('user:joined', channel.id, user);

      socket.emit('result:success', 'Invite was accepted successfully');
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return socket.emit('result:failed', 'Invite not found');
      }

      socket.emit('result:failed', error.message);
    }
  }

  public async onInviteReject({ socket, auth }: WsContextContract, inviteId: number) {
    try {
      const invite = await Invite.query().where('id', inviteId).firstOrFail();

      const channel = await Channel.query().where('id', invite.channelId).firstOrFail();

      await Invite.query().where('for_user_id', auth.user!.id).andWhere('channel_id', channel.id).delete();

      socket.emit('invite:rejected', channel);
      socket.emit('result:success', 'Invite was rejected successfully');
    } catch (error) {
      if (error.code === 'E_ROW_NOT_FOUND') {
        return socket.emit('result:failed', 'Invite not found');
      }

      socket.emit('result:failed', error.message);
    }
  }
}
