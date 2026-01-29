import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Channel from 'App/Models/Channel';

export default class ChannelsController {
  public async getChannels({ auth, response }: HttpContextContract) {
    const channels = await Channel.query()
      .whereHas('users', (query) => {
        query.where('users.id', auth.user!.id);
      })
      .orWhereHas('invites', (query) => {
        query.where('for_user_id', auth.user!.id);
      })
      .preload('invites', (query) => {
        query.where('for_user_id', auth.user!.id);
      })
      .preload('messages', (query) => {
        query.orderBy('sent_at', 'desc');
      });

    return response.ok(channels);
  }

  public async getChannel({ auth, params, response }: HttpContextContract) {
    const channel = await Channel.query()
      .where('id', params.id)
      .preload('users', (query) => {
        query.orderBy('joined_at', 'desc');
        query.preload('settings');
      })
      .firstOrFail();

    if (!channel.users.some((x) => x.id === auth.user!.id)) {
      await channel.load('invites', (query) => {
        query.where('for_user_id', auth.user!.id).limit(1);
      });
    }

    return response.ok(channel);
  }
}
