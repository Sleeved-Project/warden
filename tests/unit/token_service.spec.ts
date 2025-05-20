import { test } from '@japa/runner'
import TokenService from '#services/token_service'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'

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
})
