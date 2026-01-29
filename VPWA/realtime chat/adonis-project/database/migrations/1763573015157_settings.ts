import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'settings'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .unique()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table.boolean('only_addressed').notNullable().defaultTo(false)
      table
        .integer('status_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('statuses')
        .onDelete('NO ACTION')
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
