import { test } from '@japa/runner'
import TokenService from '#services/token_service'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import db from '@adonisjs/lucid/services/db'
import InvalidRefreshTokenException from '#exceptions/invalid_refresh_token_exception'

test.group('Token Service', (group) => {
  let tokenService: TokenService
  let user: User

  group.setup(async () => {
    user = await UserFactory.create()
  })

  group.each.setup(() => {
    tokenService = new TokenService()
    return testUtils.db().withGlobalTransaction()
  })

  test('generateAuthToken returns a valid token', async ({ assert }) => {
    const token = await tokenService.generateAuthToken(user)

    assert.isString(token)
    assert.isNotEmpty(token)
    assert.notEqual(token, 'password123')
  })

  test('generates unique tokens for the same user', async ({ assert }) => {
    const token1 = await tokenService.generateAuthToken(user)
    const token2 = await tokenService.generateAuthToken(user)

    assert.notEqual(token1, token2)
  })

  test('different users get different tokens', async ({ assert }) => {
    const secondUser = await UserFactory.create()

    const token1 = await tokenService.generateAuthToken(user)
    const token2 = await tokenService.generateAuthToken(secondUser)

    assert.notEqual(token1, token2)
  })

  test('generateRefreshToken returns token and id', async ({ assert }) => {
    const { token, id } = await tokenService.generateRefreshToken(user)

    assert.isString(token)
    assert.isNumber(id)

    const row = await db.query().from('auth_access_tokens').where('id', id).first()
    assert.exists(row)
    assert.equal(row.name, 'refresh_token')
    assert.deepEqual(JSON.parse(row.abilities), ['refresh'])
  })

  test('generateAuthToken links parent_id when refresh id provided', async ({ assert }) => {
    const refresh = await tokenService.generateRefreshToken(user)
    await tokenService.generateAuthToken(user, refresh.id)

    const row = await db
      .query()
      .from('auth_access_tokens')
      .where('tokenable_id', user.id as unknown as number)
      .andWhere('name', 'api_token')
      .orderBy('created_at', 'desc')
      .first()

    assert.exists(row)
    assert.equal(row.parent_id, refresh.id)
  })

  test('refreshToken exchanges refresh token for new access token', async ({ assert }) => {
    const refresh = await tokenService.generateRefreshToken(user)
    const result = await tokenService.refreshToken(refresh.token)

    assert.exists(result)
    assert.isString(result.token)
    assert.exists(result.refreshToken)

    const newRefreshRow = await db
      .query()
      .from('auth_access_tokens')
      .where('name', 'refresh_token')
      .andWhereNot('id', refresh.id)
      .orderBy('created_at', 'desc')
      .first()

    assert.exists(newRefreshRow)

    const linkedRow = await db
      .query()
      .from('auth_access_tokens')
      .where('tokenable_id', user.id as unknown as number)
      .andWhere('parent_id', newRefreshRow.id)
      .first()

    assert.exists(linkedRow)

    const oldAfter = await db.query().from('auth_access_tokens').where('id', refresh.id).first()
    assert.isNull(oldAfter)
  })

  test('refreshToken throws InvalidRefreshTokenException for invalid token', async ({ assert }) => {
    try {
      await tokenService.refreshToken('invalid_token_value')
      assert.fail('Should have thrown InvalidRefreshTokenException')
    } catch (error) {
      assert.instanceOf(error, InvalidRefreshTokenException)
    }
  })

  test('using refresh token rotates and invalidates old refresh and its children', async ({
    assert,
  }) => {
    const original = await tokenService.generateRefreshToken(user)
    await tokenService.generateAuthToken(user, original.id)

    const originalRow = await db.query().from('auth_access_tokens').where('id', original.id).first()
    assert.exists(originalRow)

    const childRow = await db
      .query()
      .from('auth_access_tokens')
      .where('parent_id', original.id)
      .first()
    assert.exists(childRow)

    // call refresh -> rotation should issue a new refresh + access token and remove the old refresh (and its children if FK CASCADE)
    const result = await tokenService.refreshToken(original.token)
    assert.exists(result.refreshToken)
    assert.exists(result.token)

    // old refresh should be gone
    const oldAfter = await db.query().from('auth_access_tokens').where('id', original.id).first()
    assert.isNull(oldAfter)

    // children referencing old refresh should be gone (CASCADE) or at least not reference the old id
    const orphan = await db
      .query()
      .from('auth_access_tokens')
      .where('parent_id', original.id)
      .first()
    assert.isNull(orphan)

    const newRefreshRow = await db
      .query()
      .from('auth_access_tokens')
      .where('name', 'refresh_token')
      .andWhereNot('id', original.id)
      .orderBy('created_at', 'desc')
      .first()

    assert.exists(newRefreshRow)
    const linked = await db
      .query()
      .from('auth_access_tokens')
      .where('parent_id', newRefreshRow.id)
      .first()
    assert.exists(linked)
  })
})
