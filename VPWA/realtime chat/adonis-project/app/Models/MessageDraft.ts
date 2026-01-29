import { DateTime } from 'luxon'
import {BaseModel, beforeCreate, BelongsTo, belongsTo, column} from '@ioc:Adonis/Lucid/Orm'
import {randomUUID} from "node:crypto";
import Channel from "App/Models/Channel";
import User from "App/Models/User";

export default class MessageDraft extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column({ columnName: 'user_id' })
  public userId: number

  @column({ columnName: 'channel_id' })
  public channelId: string

  @column()
  public content: string

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  public createdAt: DateTime

  @beforeCreate()
  public static assignUuid (messageDraft: MessageDraft) {
    messageDraft.id = randomUUID()
  }

  @belongsTo(() => Channel, {
    foreignKey: 'channelId',
  })
  public channel: BelongsTo<typeof Channel>

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  public user: BelongsTo<typeof User>
}
