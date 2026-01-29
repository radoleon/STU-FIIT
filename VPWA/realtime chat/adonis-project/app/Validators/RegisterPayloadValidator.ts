import {schema, CustomMessages, rules} from '@ioc:Adonis/Core/Validator'
import type { HttpContextContract } from '@ioc:Adonis/Core/HttpContext'

export default class RegisterPayloadValidator {
  constructor(protected ctx: HttpContextContract) {}

  /*
   * Define schema to validate the "shape", "type", "formatting" and "integrity" of data.
   *
   * For example:
   * 1. The username must be of data type string. But then also, it should
   *    not contain special characters or numbers.
   *    ```
   *     schema.string([ rules.alpha() ])
   *    ```
   *
   * 2. The email must be of data type string, formatted as a valid
   *    email. But also, not used by any other user.
   *    ```
   *     schema.string([
   *       rules.email(),
   *       rules.unique({ table: 'users', column: 'email' }),
   *     ])
   *    ```
   */
  public schema = schema.create({
    firstName: schema.string({}, [
      rules.minLength(1),
      rules.regex(/^[A-Z][a-zA-Z]*$/),
    ]),
    lastName: schema.string({}, [
      rules.minLength(1),
      rules.regex(/^[A-Z][a-zA-Z]*$/),
    ]),
    email: schema.string({}, [
      rules.email(),
      rules.unique({ table: 'users', column: 'email' }),
    ]),
    nickname: schema.string({}, [
      rules.minLength(1),
      rules.unique({ table: 'users', column: 'nickname' }),
    ]),
    password: schema.string({}, [
      rules.minLength(8),
    ]),
  })

  /**
   * Custom messages for validation failures. You can make use of dot notation `(.)`
   * for targeting nested fields and array expressions `(*)` for targeting all
   * children of an array. For example:
   *
   * {
   *   'profile.username.required': 'Username is required',
   *   'scores.*.number': 'Define scores as valid numbers'
   * }
   *
   */
  public messages: CustomMessages = {
    'firstName.required': 'First name is required',
    'firstName.regex': 'First name must start with a capital letter and contain only letters',
    'lastName.required': 'Last name is required',
    'lastName.regex': 'Last name must start with a capital letter and contain only letters',
    'email.required': 'Email is required',
    'email.email': 'Invalid email format',
    'email.unique': 'Email is already in use',
    'nickname.required': 'Nickname is required',
    'nickname.unique': 'Nickname is already in use',
    'password.required': 'Password is required',
    'password.minLength': 'Password must be at least 8 characters long',
  }
}
