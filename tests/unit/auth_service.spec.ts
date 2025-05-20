import { test } from '@japa/runner'
import AuthService from '#services/auth_service'
import TokenService from '#services/token_service'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import DuplicateEmailException from '#exceptions/duplicate_email_exception'
import InvalidCredentialsException from '#exceptions/invalid_credentials_exception'
import { UserFactory } from '#database/factories/user_factory'

test.group('Auth Service', (group) => {
  let authService: AuthService

  group.each.setup(() => {
    const tokenService = new TokenService()
    authService = new AuthService(tokenService)

    return testUtils.db().withGlobalTransaction()
  })

  test('register creates a new user and returns token response', async ({ assert }) => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
    }

    const result = await authService.register(userData)

    assert.exists(result.token)
    assert.equal(result.type, 'bearer')
    assert.equal(result.user.email, userData.email)
    assert.equal(result.user.fullName, userData.fullName)

    const user = await User.findBy('email', userData.email)
    assert.exists(user)

    assert.isTrue(await hash.verify(user!.password, userData.password))
  })

  test('register throws DuplicateEmailException for existing email', async ({ assert }) => {
    const existingUser = await UserFactory.create()

    try {
      await authService.register({
        email: existingUser.email,
        password: 'password123',
        fullName: 'Duplicate User',
      })
      assert.fail('Should have thrown DuplicateEmailException')
    } catch (error) {
      assert.instanceOf(error, DuplicateEmailException)
      assert.equal(error.email, existingUser.email)
    }
  })

  test('login authenticates user and returns token response', async ({ assert }) => {
    const user = await UserFactory.create()

    const result = await authService.login({
      email: user.email,
      password: 'password123',
    })

    assert.exists(result.token)
    assert.equal(result.type, 'bearer')
    assert.equal(result.user.email, user.email)
    assert.equal(result.user.fullName, user.fullName)
  })

  test('login throws InvalidCredentialsException for wrong email', async ({ assert }) => {
    try {
      await authService.login({
        email: 'nonexistent@example.com',
        password: 'password123',
      })
      assert.fail('Should have thrown InvalidCredentialsException')
    } catch (error) {
      assert.instanceOf(error, InvalidCredentialsException)
    }
  })

  test('login throws InvalidCredentialsException for wrong password', async ({ assert }) => {
    const user = await UserFactory.create()

    try {
      await authService.login({
        email: user.email,
        password: 'wrongpassword',
      })
      assert.fail('Should have thrown InvalidCredentialsException')
    } catch (error) {
      assert.instanceOf(error, InvalidCredentialsException)
    }
  })
})
