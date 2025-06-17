import { BaseSchema } from '@adonisjs/lucid/schema'

export default class extends BaseSchema {
  protected tableName = 'users'

  async up() {
    this.schema.alterTable(this.tableName, (table) => {
      table.boolean('is_verified').defaultTo(false).notNullable()
      table.string('verification_token', 100).nullable().unique()
      table.timestamp('verification_token_expires_at').nullable()
    })
  }

  async down() {
    this.schema.alterTable(this.tableName, (table) => {
      table.dropColumn('is_verified')
      table.dropColumn('verification_token')
      table.dropColumn('verification_token_expires_at')
    })
  }
}
