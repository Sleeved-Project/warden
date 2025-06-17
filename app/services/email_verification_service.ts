import User from '#models/user'
import { DateTime } from 'luxon'
import { inject } from '@adonisjs/core'
import { Logger } from '@adonisjs/core/logger'
import MailService from '#services/mail_service'

@inject()
export default class EmailVerificationService {
  constructor(
    protected mailService: MailService,
    private logger: Logger
  ) {}

  /**
   * Generate a numeric verification code for a user
   */
  async generateVerificationCode(user: User): Promise<string> {
    // Generate a 6-digit numeric code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    this.logger.debug(`Generated verification code for user ${user.id}`)

    user.verificationToken = code
    user.verificationTokenExpiresAt = DateTime.now().plus({ minutes: 15 })
    await user.save()

    return code
  }

  /**
   * Send a verification email with code to the user
   */
  async sendVerificationEmail(user: User): Promise<void> {
    if (!user.email) {
      this.logger.error(`Cannot send verification email: User ${user.id} has no email address`)
      throw new Error('User has no email address')
    }

    this.logger.info(`Initiating email verification for user ${user.id}`)
    const code = await this.generateVerificationCode(user)
    await this.mailService.sendVerificationEmail(user, code)
  }

  /**
   * Verify a user's email using the code
   */
  async verifyEmail(email: string, code: string): Promise<User | null> {
    this.logger.info(`Verifying email for: ${email}`)

    const user = await User.query()
      .where('email', email)
      .where('verification_token', code)
      .where('verification_token_expires_at', '>', DateTime.now().toSQL())
      .first()

    if (!user) {
      this.logger.info(`Failed verification attempt for: ${email}`)
      return null
    }

    user.isVerified = true
    user.verificationToken = null
    user.verificationTokenExpiresAt = null
    await user.save()

    this.logger.info(`Successfully verified email for user ${user.id}`)
    return user
  }

  /**
   * Resend verification email to a user
   */
  async resendVerificationEmail(email: string): Promise<boolean> {
    this.logger.info(`Resend verification requested for: ${email}`)

    const user = await User.findBy('email', email)

    if (!user) {
      this.logger.info(`Resend failed: No user found with email ${email}`)
      return false
    }

    if (user.isVerified) {
      this.logger.info(`Resend skipped: User ${user.id} is already verified`)
      return false
    }

    await this.sendVerificationEmail(user)
    this.logger.info(`Verification email resent to user ${user.id}`)
    return true
  }
}
