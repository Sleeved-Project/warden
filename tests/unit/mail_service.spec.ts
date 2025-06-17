import { test } from '@japa/runner'
import MailService from '#services/mail_service'
import { UserFactory } from '#database/factories/user_factory'
import testUtils from '@adonisjs/core/services/test_utils'
import mail from '@adonisjs/mail/services/main'

test.group('Mail Service', (group) => {
  let mailService: MailService
  let messages: any

  group.each.setup(() => {
    mailService = new MailService()
    // Store the messages collection from the fake mailer
    const fakeMail = mail.fake()
    messages = fakeMail.messages

    return testUtils.db().withGlobalTransaction()
  })

  group.each.teardown(() => {
    mail.restore()
  })

  test('sendVerificationEmail sends email with correct subject and recipient', async ({
    assert,
  }) => {
    const user = await UserFactory.create()
    const verificationCode = '123456'

    // Send the email
    await mailService.sendVerificationEmail(user, verificationCode)

    // Check that an email was sent
    messages.assertSent({ to: user.email })

    // Get all sent messages
    const sentMessages = messages.sent()
    assert.isAbove(sentMessages.length, 0)

    // Find the message sent to our user
    const message = sentMessages.find((msg: any) => msg.hasTo(user.email))
    assert.exists(message)

    // Assert on message properties
    assert.isTrue(message.hasSubject('Sleeved - Your verification code'))

    // For HTML content
    message.assertHtmlIncludes(verificationCode)
  })

  test('sendVerificationEmail handles user without fullName', async ({ assert }) => {
    const userWithoutName = await UserFactory.merge({
      fullName: null,
    }).create()

    await mailService.sendVerificationEmail(userWithoutName, '123456')

    messages.assertSent({ to: userWithoutName.email })

    const sentMessages = messages.sent()
    const message = sentMessages.find((msg: any) => msg.hasTo(userWithoutName.email))
    assert.exists(message)
  })

  test('email contains proper verification code', async ({ assert }) => {
    const user = await UserFactory.create()
    const verificationCode = '987654'

    await mailService.sendVerificationEmail(user, verificationCode)

    messages.assertSent({ to: user.email })

    const message = messages.sent().find((msg: any) => msg.hasTo(user.email))
    assert.exists(message)

    // Assert HTML content contains the verification code
    message.assertHtmlIncludes(verificationCode)
    message.assertHtmlIncludes('<div class="code-box">')
  })
})
