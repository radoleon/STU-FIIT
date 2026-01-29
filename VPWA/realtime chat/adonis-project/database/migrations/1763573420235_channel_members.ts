import BaseSchema from '@ioc:Adonis/Lucid/Schema'

export default class extends BaseSchema {
  protected tableName = 'channel_members'

  public async up() {
    this.schema.createTable(this.tableName, (table) => {
      table.increments('id').primary()
      table
        .integer('user_id')
        .unsigned()
        .notNullable()
        .references('id')
        .inTable('users')
        .onDelete('CASCADE')
      table
        .uuid('channel_id')
        .notNullable()
        .references('id')
        .inTable('channels')
        .onDelete('CASCADE')
      table.boolean('is_admin').notNullable().defaultTo(false)
      table.timestamp('joined_at', { useTz: true }).notNullable().defaultTo(this.now())

      table.unique(['user_id', 'channel_id']);
    })
  }

  public async down() {
    this.schema.dropTable(this.tableName)
  }
}
