import { test } from '@japa/runner'
import User from '#models/user'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'

test.group('Authentication Controller', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('register endpoint creates a new user and returns token', async ({ client, assert }) => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
    }

    const response = await client.post('/api/v1/register').json(userData)

    response.assertStatus(201)
    response.assertBodyContains({
      user: {
        email: userData.email,
        fullName: userData.fullName,
      },
      type: 'bearer',
    })

    assert.exists(response.body().token)

    const user = await User.findBy('email', userData.email)
    assert.exists(user)
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

  test('login endpoint returns token for valid credentials', async ({ client, assert }) => {
    const user = await UserFactory.create()

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

  test('login endpoint returns 401 for invalid credentials', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.post('/api/v1/login').json({
      email: user.email,
      password: 'wrongpassword',
    })

    response.assertStatus(401)
    response.assertBodyContains({
      code: 'E_INVALID_CREDENTIALS',
    })
  })

  test('me endpoint returns user information when authenticated', async ({ client }) => {
    const user = await UserFactory.merge({
      email: 'me@example.com',
      fullName: 'Me User',
    }).create()

    const loginResponse = await client.post('/api/v1/login').json({
      email: user.email,
      password: 'password123',
    })

    const token = loginResponse.body().token

    const response = await client.get('/api/v1/me').header('Authorization', `Bearer ${token}`)

    response.assertStatus(200)
    response.assertBodyContains({
      email: user.email,
      fullName: user.fullName,
    })
  })

  test('me endpoint returns 401 when not authenticated', async ({ client }) => {
    const response = await client.get('/api/v1/me')

    response.assertStatus(401)
    response.assertBodyContains({
      code: 'E_UNAUTHORIZED',
    })
  })
})
