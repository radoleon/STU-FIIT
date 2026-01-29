import {BaseModel, BelongsTo, belongsTo, column} from '@ioc:Adonis/Lucid/Orm'
import User from "App/Models/User";
import Status from "App/Models/Status";

export default class Setting extends BaseModel {
  @column({ isPrimary: true })
  public id: number

  @column({ columnName: 'user_id' })
  public userId: number

  @column({ columnName: 'only_addressed' })
  public onlyAddressed: boolean

  @column({ columnName: 'status_id' })
  public statusId: number

  @belongsTo(() => User, {
    foreignKey: 'userId',
  })
  public user: BelongsTo<typeof User>

  @belongsTo(() => Status, {
    foreignKey: 'statusId',
  })
  public status: BelongsTo<typeof Status>
}
