import { test } from '@japa/runner'
import EmailVerificationService from '#services/email_verification_service'
import MailService from '#services/mail_service'
import type { Logger } from '@adonisjs/core/logger'
import User from '#models/user'
import { UserFactory } from '#database/factories/user_factory'
import { DateTime } from 'luxon'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'

test.group('Email Verification Service', (group) => {
  let emailVerificationService: EmailVerificationService

  type MockMailService = {
    sendVerificationEmail(user: User, code: string): Promise<void>
  }

  const mockMailService: MockMailService = {
    sendVerificationEmail: async (_user: User, _code: string) => {
      return Promise.resolve()
    },
  }

  // Mock logger
  const mockLogger: Partial<Logger> = {
    info: (_: string, ..._args: unknown[]) => {},
    error: (_: string, ..._args: unknown[]) => {},
    debug: (_: string, ..._args: unknown[]) => {},
    warn: (_: string, ..._args: unknown[]) => {},
    trace: (_: string, ..._args: unknown[]) => {},
    fatal: (_: string, ..._args: unknown[]) => {},
  }

  group.each.setup(() => {
    emailVerificationService = new EmailVerificationService(
      mockMailService as MailService,
      mockLogger as Logger
    )
    mail.fake()
    return testUtils.db().withGlobalTransaction()
  })

  group.each.teardown(() => {
    mail.restore()
  })

  test('generateVerificationCode creates a numeric code for the user', async ({ assert }) => {
    const user = await UserFactory.create()

    const code = await emailVerificationService.generateVerificationCode(user)

    await user.refresh()
    assert.isString(code)
    assert.match(code, /^\d{6}$/) // 6-digit numeric code
    assert.equal(user.verificationToken, code)

    // Verify token expiration is set to the future (15 minutes from now)
    const now = DateTime.now()
    assert.isTrue(user.verificationTokenExpiresAt !== null)
    assert.isTrue(typeof user.verificationTokenExpiresAt?.toISO === 'function')
    assert.isTrue(user.verificationTokenExpiresAt! > now)
    assert.isTrue(user.verificationTokenExpiresAt! < now.plus({ minutes: 20 }))
  })

  test('sendVerificationEmail sends email with verification code', async ({ assert }) => {
    let calledWithUser: any = null
    let calledWithCode: string = ''

    const originalMethod = mockMailService.sendVerificationEmail
    mockMailService.sendVerificationEmail = async (user: any, code: string) => {
      calledWithUser = user
      calledWithCode = code
      return Promise.resolve()
    }

    const user = await UserFactory.create()
    await emailVerificationService.sendVerificationEmail(user)

    mockMailService.sendVerificationEmail = originalMethod

    assert.equal(calledWithUser?.id, user.id)
    assert.isString(calledWithCode)
    assert.match(calledWithCode, /^\d{6}$/)

    await user.refresh()
    assert.isNotNull(user.verificationToken)
    assert.match(user.verificationToken!, /^\d{6}$/)
  })

  test('verifyEmail successfully verifies user with valid code', async ({ assert }) => {
    const user = await UserFactory.merge({
      isVerified: false,
      verificationToken: '123456',
      verificationTokenExpiresAt: DateTime.now().plus({ minutes: 10 }),
    }).create()

    const verifiedUser = await emailVerificationService.verifyEmail(user.email, '123456')

    assert.isNotNull(verifiedUser)
    assert.equal(verifiedUser!.id, user.id)

    await user.refresh()
    assert.equal(user.isVerified, 1)
    assert.isNull(user.verificationToken)
    assert.isNull(user.verificationTokenExpiresAt)
  })

  test('verifyEmail returns null for invalid code', async ({ assert }) => {
    // Create a user with a different code
    const user = await UserFactory.merge({
      email: 'test@example.com',
      isVerified: false,
      verificationToken: '123456',
      verificationTokenExpiresAt: DateTime.now().plus({ minutes: 10 }),
    }).create()

    const result = await emailVerificationService.verifyEmail(user.email, '654321')
    assert.isNull(result)
  })

  test('verifyEmail returns null for expired code', async ({ assert }) => {
    // Create user with expired code
    const user = await UserFactory.merge({
      isVerified: false,
      verificationToken: '123456',
      verificationTokenExpiresAt: DateTime.now().minus({ minutes: 5 }),
    }).create()

    const result = await emailVerificationService.verifyEmail(user.email, '123456')

    // Verify null is returned for expired token
    assert.isNull(result)

    // Verify user remains unverified
    await user.refresh()
    assert.equal(user.isVerified, 0)
    assert.isNotNull(user.verificationToken)
  })

  test('resendVerificationEmail generates new code for unverified user', async ({ assert }) => {
    let emailSentToUser: any = null

    const originalMethod = mockMailService.sendVerificationEmail
    mockMailService.sendVerificationEmail = async (user: any, _: string) => {
      emailSentToUser = user
      return Promise.resolve()
    }

    const user = await UserFactory.merge({
      isVerified: false,
      verificationToken: '111111',
      verificationTokenExpiresAt: DateTime.now().minus({ hours: 1 }),
    }).create()

    const oldCode = user.verificationToken
    const result = await emailVerificationService.resendVerificationEmail(user.email)

    mockMailService.sendVerificationEmail = originalMethod

    assert.isTrue(result)
    assert.equal(emailSentToUser?.id, user.id)

    await user.refresh()
    assert.isNotNull(user.verificationToken)
    assert.notEqual(user.verificationToken, oldCode)
    assert.match(user.verificationToken!, /^\d{6}$/)
    assert.isTrue(user.verificationTokenExpiresAt! > DateTime.now())
  })

  test('resendVerificationEmail returns false for non-existent user', async ({ assert }) => {
    const result = await emailVerificationService.resendVerificationEmail('nonexistent@example.com')
    assert.isFalse(result)
  })

  test('resendVerificationEmail returns false for already verified user', async ({ assert }) => {
    const user = await UserFactory.merge({
      isVerified: true,
    }).create()

    const result = await emailVerificationService.resendVerificationEmail(user.email)
    assert.isFalse(result)
  })
})
