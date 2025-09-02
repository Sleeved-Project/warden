import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'
import testUtils from '@adonisjs/core/services/test_utils'

test.group('Availability Controller', (group) => {
  group.each.setup(() => {
    return testUtils.db().withGlobalTransaction()
  })

  test('returns available=true for unused username', async ({ client }) => {
    const response = await client.get('/api/v1/availability').qs({ username: 'newuser123' })

    response.assertStatus(200)
    response.assertBodyContains({
      username: { available: true },
    })
  })

  test('returns available=false for existing username', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.get('/api/v1/availability').qs({ username: user.username })

    response.assertStatus(200)
    response.assertBodyContains({
      username: { available: false },
    })
  })

  test('returns available=true for unused email', async ({ client }) => {
    const response = await client.get('/api/v1/availability').qs({ email: 'unused@example.com' })

    response.assertStatus(200)
    response.assertBodyContains({
      email: { available: true },
    })
  })

  test('returns available=false for existing email', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.get('/api/v1/availability').qs({ email: user.email })

    response.assertStatus(200)
    response.assertBodyContains({
      email: { available: false },
    })
  })

  test('can check both email and username simultaneously', async ({ client }) => {
    const user = await UserFactory.create()

    const response = await client.get('/api/v1/availability').qs({
      email: 'new@example.com',
      username: user.username,
    })

    response.assertStatus(200)
    response.assertBodyContains({
      email: { available: true },
      username: { available: false },
    })
  })

  test('returns 400 when no parameters are provided', async ({ client }) => {
    const response = await client.get('/api/v1/availability')

    response.assertStatus(400)
    response.assertBodyContains({
      error: 'At least one parameter (email or username) is required',
    })
  })
})
