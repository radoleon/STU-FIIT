import { HttpContextContract } from '@ioc:Adonis/Core/HttpContext';
import Setting from 'App/Models/Setting';

export default class SettingsController {
  public async toggleNotificationsSetting({ auth, response }: HttpContextContract) {
    const setting = await Setting.query().where('user_id', auth.user!.id).firstOrFail();

    setting.onlyAddressed = !setting.onlyAddressed;
    await setting.save();

    return response.ok(setting);
  }
}
