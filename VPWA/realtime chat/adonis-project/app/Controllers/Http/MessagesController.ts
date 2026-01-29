import Message from 'App/Models/Message';
import ChannelMember from 'App/Models/ChannelMember';
import { HttpException } from '@adonisjs/http-server/build/src/Exceptions/HttpException';

export default class MessagesController {
  public async index({ params, auth, request }) {
    const page = request.input('page', 1);
    const limit = 10;

    const member = await ChannelMember.query().where('user_id', auth.user!.id).andWhere('channel_id', params.id).first();

    if (!member) {
      throw new HttpException('User is not member of this channel', 403);
    }

    const messages = await Message.query()
      .where('channel_id', params.id)
      .orderBy('sent_at', 'desc')
      .preload('mentions', (query) => {
        query.preload('user');
      })
      .preload('user', (query) => {
        query.preload('settings');
      })
      .offset((page - 1) * limit)
      .limit(limit);

    return messages;
  }
}
