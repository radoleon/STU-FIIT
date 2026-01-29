import { DateTime } from 'luxon'
import {BaseModel, BelongsTo, belongsTo, column} from '@ioc:Adonis/Lucid/Orm'
import Channel from "App/Models/Channel";
import User from "App/Models/User";

export default class BanVote extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'channel_id' })
  public channelId: string

  @column({ columnName: 'by_user_id' })
  public byUserId: number

  @column({ columnName: 'for_user_id' })
  public forUserId: number

  @column.dateTime({ autoCreate: true, columnName: 'voted_at' })
  public votedAt: DateTime

  @belongsTo(() => Channel, {
    foreignKey: 'channelId',
  })
  public channel: BelongsTo<typeof Channel>

  @belongsTo(() => User, {
    foreignKey: 'byUserId',
  })
  public byUser: BelongsTo<typeof User>

  @belongsTo(() => User, {
    foreignKey: 'forUserId',
  })
  public forUser: BelongsTo<typeof User>
}
