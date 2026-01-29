import { DateTime } from 'luxon'
import {BaseModel, beforeCreate, column, HasMany, hasMany, ManyToMany, manyToMany} from '@ioc:Adonis/Lucid/Orm'
import {randomUUID} from "node:crypto";
import Message from "App/Models/Message";
import Invite from "App/Models/Invite";
import BanVote from "App/Models/BanVote";
import MessageDraft from "App/Models/MessageDraft";
import User from "App/Models/User";

export default class Channel extends BaseModel {
  @column({ isPrimary: true })
  public id: string

  @column()
  public name: string

  @column({ columnName: 'is_public' })
  public isPublic: boolean

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  public createdAt: DateTime

  @beforeCreate()
  public static assignUuid (channel: Channel) {
    channel.id = randomUUID()
  }

  @manyToMany(() => User, {
    pivotTable: 'channel_members',
    localKey: 'id',
    pivotForeignKey: 'channel_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'user_id',
    pivotColumns: ['is_admin', 'joined_at'],
  })
  public users: ManyToMany<typeof User>

  @hasMany(() => Message, {
    foreignKey: 'channelId',
  })
  public messages: HasMany<typeof Message>

  @hasMany(() => MessageDraft, {
    foreignKey: 'channelId',
  })
  public messageDrafts: HasMany<typeof MessageDraft>

  @hasMany(() => Invite, {
    foreignKey: 'channelId',
  })
  public invites: HasMany<typeof Invite>

  @hasMany(() => BanVote, {
    foreignKey: 'channelId',
  })
  public banVotes: HasMany<typeof BanVote>
}
