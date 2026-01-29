import {BaseModel, beforeCreate, BelongsTo, belongsTo, column, HasMany, hasMany} from '@ioc:Adonis/Lucid/Orm'
import {randomUUID} from "node:crypto";
import Channel from "App/Models/Channel";
import {DateTime} from "luxon";
import User from "App/Models/User";
import Mention from "App/Models/Mention";

export default class Message extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column({ columnName: 'channel_id' })
  public channelId: string

  @column()
  public content: string

  @column({ columnName: 'user_id' })
  public userId: number

  @column.dateTime({ autoCreate: true, columnName: 'sent_at' })
  public sentAt: DateTime

  @beforeCreate()
  public static assignUuid (message: Message) {
    message.id = randomUUID()
  }

  @belongsTo(() => Channel, {
    foreignKey: 'channelId',
  })
  public channel: BelongsTo<typeof Channel>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  public user: BelongsTo<typeof User>

  @hasMany(() => Mention, {
    foreignKey: 'messageId',
  })
  public mentions: HasMany<typeof Mention>
}
