import {HttpContextContract} from "@ioc:Adonis/Core/HttpContext";
import RegisterPayloadValidator from "App/Validators/RegisterPayloadValidator";
import User from "App/Models/User";
import Setting from "App/Models/Setting";

export default class AuthController {
  public async register({ request, auth, response }: HttpContextContract) {
    const payload = await request.validate(RegisterPayloadValidator)

    const user = await User.create(payload)

    await Setting.create({
      userId: user.id,
      onlyAddressed: false,
      statusId: 1,
    })

    await user.load('settings')

    const token = await auth.use('api').login(user)

    return response.ok({ user, token: token.token })
  }

  public async login({ request, auth, response }: HttpContextContract) {
    const { email, password } = request.only(['email', 'password'])

    await auth.use('api').attempt(email, password)

    const user = await User.query()
      .where('id', auth.user!.id)
      .preload('settings')
      .firstOrFail()

    const token = await auth.use('api').generate(user)

    return response.ok({ user, token: token.token })
  }

  public async logout({ auth, response }: HttpContextContract) {
    try {
      await auth.use('api').revoke()
    }
    catch { }

    return response.ok(null)
  }

  public async me({ auth, response }: HttpContextContract) {
    await auth.use('api').authenticate()

    const user = await User.query()
      .where('id', auth.user!.id)
      .preload('settings')
      .firstOrFail()

    return response.ok(user)
  }
}
