import type { WsContextContract } from '@ioc:Ruby184/Socket.IO/WsContext';
import ChannelMember from 'App/Models/ChannelMember';
import Setting from 'App/Models/Setting';

export default class WsSettingsController {
  public async onStatusChange({ socket, auth }: WsContextContract, statusId: number) {
    const setting = await Setting.query().where('user_id', auth.user!.id).firstOrFail();

    setting.statusId = statusId;
    await setting.save();

    const channels = await ChannelMember.query().where('user_id', auth.user!.id).select('channel_id');

    socket.nsp.to(channels.map((x) => `channel:${x.channelId}`)).emit('status:changed', auth.user!.id, setting);
  }
}
