import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_refresh_token').defaultTo(false).notNullable()
      table.integer('parent_id').unsigned().nullable().references('id').inTable(this.tableName)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['parent_id'])

      table.dropColumn('is_refresh_token')
      table.dropColumn('parent_id')
    })
  }
}
