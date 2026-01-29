import { type ResponseWrapper } from 'src/misc/ResponseWrapper';
import { type Channel } from 'src/models/Channel';
import { api } from 'boot/axios';
import { getErrorMessage } from 'src/misc/helpers';

export async function getChannels(): Promise<ResponseWrapper<Channel[]>> {
  try {
    const { data } = await api.get<Channel[]>('/channels');
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, message: getErrorMessage(error) };
  }
}

export async function getChannel(channelId: string): Promise<ResponseWrapper<Channel>> {
  try {
    const { data } = await api.get<Channel>('/channels/' + channelId);
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, message: getErrorMessage(error) };
  }
}
