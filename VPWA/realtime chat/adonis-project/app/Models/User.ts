import { DateTime } from 'luxon';
import Hash from '@ioc:Adonis/Core/Hash';
import { column, beforeSave, BaseModel, hasOne, HasOne, hasMany, HasMany, manyToMany, ManyToMany, computed } from '@ioc:Adonis/Lucid/Orm';
import Setting from 'App/Models/Setting';
import Message from 'App/Models/Message';
import Invite from 'App/Models/Invite';
import BanVote from 'App/Models/BanVote';
import Mention from 'App/Models/Mention';
import MessageDraft from 'App/Models/MessageDraft';
import Channel from 'App/Models/Channel';

export default class User extends BaseModel {
  @column({ isPrimary: true })
  public id: number;

  @column()
  public email: string;

  @column({ serializeAs: null })
  public password: string;

  @column({ columnName: 'remember_me_token' })
  public rememberMeToken: string | null;

  @column({ columnName: 'first_name' })
  public firstName: string;

  @column({ columnName: 'last_name' })
  public lastName: string;

  @column()
  public nickname: string;

  @column.dateTime({ autoCreate: true, columnName: 'created_at' })
  public createdAt: DateTime;

  @beforeSave()
  public static async hashPassword(user: User) {
    if (user.$dirty.password) {
      user.password = await Hash.make(user.password);
    }
  }

  @hasOne(() => Setting, {
    foreignKey: 'userId',
  })
  public settings: HasOne<typeof Setting>;

  @manyToMany(() => Channel, {
    pivotTable: 'channel_members',
    localKey: 'id',
    pivotForeignKey: 'user_id',
    relatedKey: 'id',
    pivotRelatedForeignKey: 'channel_id',
    pivotColumns: ['is_admin', 'joined_at'],
  })
  public channels: ManyToMany<typeof Channel>;

  @hasMany(() => Message, {
    foreignKey: 'userId',
  })
  public messages: HasMany<typeof Message>;

  @hasMany(() => MessageDraft, {
    foreignKey: 'userId',
  })
  public messageDrafts: HasMany<typeof MessageDraft>;

  @hasMany(() => Invite, {
    localKey: 'id',
    foreignKey: 'byUserId',
  })
  public invitesSent: HasMany<typeof Invite>;

  @hasMany(() => Invite, {
    localKey: 'id',
    foreignKey: 'forUserId',
  })
  public invitesReceived: HasMany<typeof Invite>;

  @hasMany(() => BanVote, {
    localKey: 'id',
    foreignKey: 'byUserId',
  })
  public banVotesCast: HasMany<typeof BanVote>;

  @hasMany(() => BanVote, {
    localKey: 'id',
    foreignKey: 'forUserId',
  })
  public banVotesReceived: HasMany<typeof BanVote>;

  @hasMany(() => Mention, {
    foreignKey: 'userId',
  })
  public mentions: HasMany<typeof Mention>;

  @computed()
  public get isAdmin(): boolean | null {
    return this.$extras.pivot_is_admin ?? null;
  }
}
