// database/migrations/xxx_add_refresh_token_fields.ts
import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'auth_access_tokens'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.integer('parent_id').unsigned().nullable().references('id').inTable(this.tableName)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropForeign(['parent_id'])
      table.dropColumn('parent_id')
    })
  }
}
