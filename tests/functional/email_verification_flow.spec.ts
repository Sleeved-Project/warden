import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'
import User from '#models/user'

test.group('Email Verification Flow', (group) => {
  let fakeMail: any

  group.each.setup(() => {
    // Store the mailer instance for later assertions
    fakeMail = mail.fake()
    return testUtils.db().withGlobalTransaction()
  })

  group.each.teardown(() => {
    mail.restore()
  })

  test('complete user registration and verification flow', async ({ client, assert }) => {
    // 1. Register a new user
    const userData = {
      email: 'newuser@example.com',
      password: 'password123',
      fullName: 'New User',
    }

    const registerResponse = await client.post('/api/v1/register').json(userData)

    registerResponse.assertStatus(201)
    registerResponse.assertBodyContains({
      requiresVerification: true,
      user: {
        email: userData.email,
        isVerified: false,
      },
    })

    // Verify the email was sent
    fakeMail.messages.assertSent({ to: userData.email })

    // Find the message and verify its content
    const sentMessages = fakeMail.messages.sent()
    const sentEmail = sentMessages.find((msg: any) => msg.hasTo(userData.email))
    assert.exists(sentEmail)
    assert.isTrue(sentEmail.hasSubject('Sleeved - Your verification code'))

    // 2. Get the verification code from the database
    const user = await User.findBy('email', userData.email)
    assert.exists(user)
    assert.isNotNull(user!.verificationToken)

    // 3. Verify the email with the code
    const verifyResponse = await client.post('/api/v1/verify-email').json({
      email: userData.email,
      code: user!.verificationToken,
    })

    verifyResponse.assertStatus(200)
    verifyResponse.assertBodyContains({
      status: true,
      message: 'Email verified successfully',
      user: {
        email: userData.email,
        isVerified: true,
      },
      type: 'bearer',
    })

    // Verify token is returned
    assert.exists(verifyResponse.body().token)

    // 4. Check that the user is now verified
    await user!.refresh()
    assert.equal(user!.isVerified, 1)
    assert.isNull(user!.verificationToken)

    // 5. Verify the token works by accessing a protected route
    const meResponse = await client
      .get('/api/v1/me')
      .header('Authorization', `Bearer ${verifyResponse.body().token}`)

    meResponse.assertStatus(200)
    meResponse.assertBodyContains({
      email: userData.email,
      fullName: userData.fullName,
    })
  })

  test('cannot login with unverified account', async ({ client }) => {
    // Create an unverified user directly
    const user = await UserFactory.merge({
      email: 'unverified@example.com',
      password: 'password123',
      isVerified: false,
    }).create()

    // Try to login
    const loginResponse = await client.post('/api/v1/login').json({
      email: user.email,
      password: 'password123',
    })

    // Should fail with email not verified error
    loginResponse.assertStatus(403)
    loginResponse.assertBodyContains({
      code: 'E_EMAIL_NOT_VERIFIED',
    })
  })

  test('resending verification code works', async ({ client, assert }) => {
    // Create an unverified user
    const user = await UserFactory.merge({
      email: 'needsverification@example.com',
      isVerified: false,
      verificationToken: '123456',
      verificationTokenExpiresAt: DateTime.now().minus({ hours: 1 }),
    }).create()

    // Request to resend the verification code
    const resendResponse = await client
      .post('/api/v1/resend-verification')
      .json({ email: user.email })

    resendResponse.assertStatus(200)
    resendResponse.assertBodyContains({
      status: true,
      message: 'Verification code sent successfully',
    })

    // Check that an email was sent
    fakeMail.messages.assertSent({ to: user.email })

    // Verify code was updated
    await user.refresh()
    assert.notEqual(user.verificationToken, '123456')
    assert.isTrue(user.verificationTokenExpiresAt! > DateTime.now())
  })

  test('verify with incorrect code returns error', async ({ client }) => {
    // Create an unverified user
    const user = await UserFactory.merge({
      email: 'wrongcode@example.com',
      isVerified: false,
      verificationToken: '123456',
      verificationTokenExpiresAt: DateTime.now().plus({ minutes: 10 }),
    }).create()

    // Try to verify with incorrect code
    const verifyResponse = await client.post('/api/v1/verify-email').json({
      email: user.email,
      code: '654321',
    })

    verifyResponse.assertStatus(400)
    verifyResponse.assertBodyContains({
      status: false,
      message: 'Invalid or expired verification code',
    })
  })

  test('verify endpoint validates required fields', async ({ client }) => {
    // Test missing email
    const missingEmailResponse = await client.post('/api/v1/verify-email').json({
      code: '123456',
    })

    missingEmailResponse.assertStatus(422)

    // Test missing code
    const missingCodeResponse = await client.post('/api/v1/verify-email').json({
      email: 'test@example.com',
    })

    missingCodeResponse.assertStatus(422)
  })
})
