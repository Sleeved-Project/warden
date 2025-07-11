import { BaseSchema } from '@adonisjs/lucid/schema'
import { UserRole } from '#types/auth'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('role', 50).notNullable().defaultTo(UserRole.USER)
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('role')
    })
  }
}
