import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import mail from '@adonisjs/mail/services/main'
import { Message } from '@adonisjs/mail'

test.group('Authentication Controller', (group) => {
  let fakeMail: any

  group.each.setup(() => {
    fakeMail = mail.fake()
    return testUtils.db().withGlobalTransaction()
  })

  group.each.teardown(() => {
    mail.restore()
  })

  test('register endpoint creates a new unverified user without token', async ({
    client,
    assert,
  }) => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
    }

    const response = await client.post('/api/v1/register').json(userData)

    response.assertStatus(201)
    response.assertBodyContains({
      requiresVerification: true,
      user: {
        email: userData.email,
        fullName: userData.fullName,
        isVerified: false,
      },
    })

    assert.exists(response.body().message)
    assert.notExists(response.body().token)

    const user = await User.findBy('email', userData.email)
    assert.exists(user)
    assert.equal(user!.isVerified, 0)

    fakeMail.messages.assertSent((message: Message) => {
      return message.hasTo(userData.email) && message.hasSubject('Sleeved - Your verification code')
    })
  })

  test('register endpoint returns 409 for duplicate email', async ({ client }) => {
    const existingUser = await UserFactory.create()

    const response = await client.post('/api/v1/register').json({
      email: existingUser.email,
      password: 'password123',
      fullName: 'Duplicate User',
    })

    response.assertStatus(409)
    response.assertBodyContains({
      code: 'E_DUPLICATE_EMAIL',
    })
  })

  test('login endpoint returns token for verified users', async ({ client, assert }) => {
    const user = await UserFactory.merge({
      isVerified: true,
    }).create()

    const response = await client.post('/api/v1/login').json({
      email: user.email,
      password: 'password123',
    })

    response.assertStatus(200)
    response.assertBodyContains({
      user: {
        email: user.email,
        fullName: user.fullName,
      },
      type: 'bearer',
    })

    assert.exists(response.body().token)
  })

  test('login endpoint returns 403 for unverified users', async ({ client }) => {
    const user = await UserFactory.merge({
      isVerified: false,
    }).create()

    const response = await client.post('/api/v1/login').json({
      email: user.email,
      password: 'password123',
    })

    response.assertStatus(403)
    response.assertBodyContains({
      code: 'E_EMAIL_NOT_VERIFIED',
    })
  })

  test('login endpoint returns 401 for invalid credentials', async ({ client }) => {
    const user = await UserFactory.merge({
      isVerified: true,
    }).create()

    const response = await client.post('/api/v1/login').json({
      email: user.email,
      password: 'wrongpassword',
    })

    response.assertStatus(401)
    response.assertBodyContains({
      code: 'E_INVALID_CREDENTIALS',
    })
  })

  test('me endpoint returns user information when authenticated', async ({ client, assert }) => {
    const user = await UserFactory.merge({
      email: 'me@example.com',
      fullName: 'Me User',
      isVerified: true,
    }).create()

    const loginResponse = await client.post('/api/v1/login').json({
      email: user.email,
      password: 'password123',
    })

    const token = loginResponse.body().token

    const response = await client.get('/api/v1/me').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)

    const body = response.body()
    assert.equal(body.email, user.email)
    assert.equal(body.fullName, user.fullName)

    assert.exists(body.isVerified)
    assert.isTrue(!!body.isVerified)
    assert.equal(body.role, user.role)
  })

  test('me endpoint returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/v1/me')

    response.assertStatus(401)
    response.assertBodyContains({
      code: 'E_UNAUTHORIZED',
    })
  })
})
