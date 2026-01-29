import { type ResponseWrapper } from 'src/misc/ResponseWrapper';
import { type Setting } from 'src/models/User';
import { api } from 'boot/axios';
import { getErrorMessage } from 'src/misc/helpers';

export async function toggleNotificationsSetting(): Promise<ResponseWrapper<Setting>> {
  try {
    const { data } = await api.patch<Setting>('/settings');
    return { success: true, data };
  } catch (error: unknown) {
    return { success: false, message: getErrorMessage(error) };
  }
}
