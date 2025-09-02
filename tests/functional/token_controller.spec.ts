import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'
import testUtils from '@adonisjs/core/services/test_utils'
import TokenService from '#services/token_service'
import db from '@adonisjs/lucid/services/db'

test.group('Token Controller (functional)', (group) => {
  let tokenService: TokenService

  group.each.setup(() => {
    tokenService = new TokenService()
    return testUtils.db().withGlobalTransaction()
  })

  test('refresh endpoint returns new access token for valid refresh token', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.merge({ isVerified: true }).create()
    const { token: refreshToken } = await tokenService.generateRefreshToken(user)

    const response = await client.post('/api/v1/refresh-token').json({ refreshToken })

    response.assertStatus(200)
    const body = response.body()
    assert.exists(body.token)
    assert.equal(body.type, 'bearer')
  })

  test('refresh endpoint returns 401 / invalid token response for bad token', async ({
    client,
  }) => {
    const response = await client
      .post('/api/v1/refresh-token')
      .json({ refreshToken: 'invalid_value' })

    response.assertStatus(401)
    response.assertBodyContains({
      code: 'E_INVALID_REFRESH_TOKEN',
    })
  })
  test('POST /token/refresh rotates refresh token and invalidates old one', async ({
    client,
    assert,
  }) => {
    const user = await UserFactory.merge({ isVerified: true }).create()
    const { token: refreshToken, id: refreshId } = await tokenService.generateRefreshToken(user)
    await tokenService.generateAuthToken(user, refreshId)

    const response = await client.post('/api/v1/refresh-token').json({ refreshToken })
    response.assertStatus(200)
    const body = response.body()
    assert.exists(body.refreshToken)
    assert.exists(body.token)

    const old = await db.query().from('auth_access_tokens').where('id', refreshId).first()
    assert.isNull(old)
  })
})
