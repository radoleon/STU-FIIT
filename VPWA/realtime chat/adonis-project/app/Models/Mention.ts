import {BaseModel, BelongsTo, belongsTo, column} from '@ioc:Adonis/Lucid/Orm'
import Message from "App/Models/Message";
import User from "App/Models/User";

export default class Mention extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'message_id' })
  public messageId: string

  @column({ columnName: 'user_id' })
  public userId: number

  @belongsTo(() => Message, {
    foreignKey: 'messageId',
  })
  public message: BelongsTo<typeof Message>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  public user: BelongsTo<typeof User>
}
