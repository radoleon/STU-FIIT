import { DateTime } from 'luxon'
import {BaseModel, BelongsTo, belongsTo, column} from '@ioc:Adonis/Lucid/Orm'
import User from "App/Models/User";
import Channel from "App/Models/Channel";

export default class ChannelMember extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'user_id' })
  public userId: number

  @column({ columnName: 'channel_id' })
  public channelId: string

  @column.dateTime({ autoCreate: true, columnName: 'joined_at' })
  public joinedAt: DateTime

  @column({ columnName: 'is_admin' })
  public isAdmin: boolean

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  public user: BelongsTo<typeof User>

  @belongsTo(() => Channel, {
    foreignKey: 'channelId',
  })
  public channel: BelongsTo<typeof Channel>
}
