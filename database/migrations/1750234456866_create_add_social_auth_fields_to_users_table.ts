import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('password').nullable().alter()
      table.string('provider').nullable()
      table.string('provider_id').nullable()
      table.string('avatar_url').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.string('password').notNullable().alter()
      table.dropColumn('provider')
      table.dropColumn('provider_id')
      table.dropColumn('avatar_url')
    })
  }
}
