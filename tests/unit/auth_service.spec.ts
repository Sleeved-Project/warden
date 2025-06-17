import { test } from '@japa/runner'
import type { Logger } from '@adonisjs/core/logger'
import AuthService from '#services/auth_service'
import TokenService from '#services/token_service'
import EmailVerificationService from '#services/email_verification_service'
import MailService from '#services/mail_service'
import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import testUtils from '@adonisjs/core/services/test_utils'
import DuplicateEmailException from '#exceptions/duplicate_email_exception'
import InvalidCredentialsException from '#exceptions/invalid_credentials_exception'
import EmailNotVerifiedException from '#exceptions/email_not_verified_exception'
import { UserFactory } from '#database/factories/user_factory'
import mail from '@adonisjs/mail/services/main'

test.group('Auth Service', (group) => {
  let authService: AuthService
  let mailService: MailService
  let fakeMail: any

  group.each.setup(() => {
    // Configuration des services
    const tokenService = new TokenService()
    mailService = new MailService()

    // Mock logger pour les tests
    const mockLogger: Partial<Logger> = {
      info: (_: string, ..._args: unknown[]) => {},
      error: (_: string, ..._args: unknown[]) => {},
      debug: (_: string, ..._args: unknown[]) => {},
      warn: (_: string, ..._args: unknown[]) => {},
      trace: (_: string, ..._args: unknown[]) => {},
      fatal: (_: string, ..._args: unknown[]) => {},
    }

    const emailVerificationService = new EmailVerificationService(mailService, mockLogger as Logger)
    authService = new AuthService(tokenService, emailVerificationService)

    // Configurer le fake mailer une seule fois
    fakeMail = mail.fake()

    return testUtils.db().withGlobalTransaction()
  })

  group.each.teardown(() => {
    mail.restore()
  })

  test('register creates a new user and returns token response', async ({ assert }) => {
    const userData = {
      email: 'test@example.com',
      password: 'password123',
      fullName: 'Test User',
    }

    const result = await authService.register(userData)

    assert.exists(result.message)
    assert.isTrue(result.requiresVerification)
    assert.equal(result.user.email, userData.email)
    assert.equal(result.user.fullName, userData.fullName)
    assert.isFalse(result.user.isVerified)

    const user = await User.findBy('email', userData.email)
    assert.exists(user)
    assert.equal(user!.isVerified, 0)

    const sentMails = fakeMail.messages.sent()
    assert.isAbove(sentMails.length, 0)

    const sentMail = sentMails.find((sent: any) => sent.hasTo(userData.email))
    assert.exists(sentMail)
    assert.isTrue(sentMail.hasTo(userData.email))
    assert.isTrue(sentMail.hasSubject('Sleeved - Your verification code'))

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

  test('login authenticates verified user and returns token response', async ({ assert }) => {
    const user = await UserFactory.merge({
      isVerified: true,
    }).create()

    const result = await authService.login({
      email: user.email,
      password: 'password123',
    })

    assert.exists(result.token)
    assert.equal(result.type, 'bearer')
    assert.equal(result.user.email, user.email)
    assert.equal(result.user.fullName, user.fullName)
    assert.equal(user!.isVerified, 1)
  })

  test('login throws EmailNotVerifiedException for unverified users', async ({ assert }) => {
    const user = await UserFactory.merge({
      isVerified: false,
    }).create()

    try {
      await authService.login({
        email: user.email,
        password: 'password123',
      })
      assert.fail('Should have thrown EmailNotVerifiedException')
    } catch (error) {
      assert.instanceOf(error, EmailNotVerifiedException)
    }
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
    const user = await UserFactory.merge({
      isVerified: true,
    }).create()

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
