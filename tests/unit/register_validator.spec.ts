import { test } from '@japa/runner'
import { registerValidator } from '#validators/auth'

test.group('Register Validator', () => {
  test('accepts a valid password', async ({ assert }) => {
    const data = {
      email: 'test@example.com',
      password: 'Valid1@Password',
      username: 'Test User',
    }

    const result = await registerValidator.validate(data)
    assert.equal(result.password, data.password)
  })

  test('rejects a password that does not meet complexity', async ({ assert }) => {
    const data = {
      email: 'test@example.com',
      password: 'simplepass',
      username: 'Test User',
    }

    try {
      await registerValidator.validate(data)
      assert.fail('Validation should have failed for weak password')
    } catch (error) {
      assert.exists(error)
      assert.match(error.messages[0].message, /The password field format is invalid/)
    }
  })
})
