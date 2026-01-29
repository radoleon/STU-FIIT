import { api } from 'boot/axios';
import { type ResponseWrapper } from 'src/misc/ResponseWrapper';
import { type Message } from 'src/models/Message';
import { getErrorMessage } from 'src/misc/helpers';

export async function getMessages(
  channelId: string,
  page = 1,
): Promise<ResponseWrapper<Message[]>> {
  try {
    const res = await api.get(`/channels/${channelId}/messages?page=${page}`);
    return { success: true, data: res.data };
  } catch (e: any) {
    return { success: false, message: getErrorMessage(e) };
  }
}
