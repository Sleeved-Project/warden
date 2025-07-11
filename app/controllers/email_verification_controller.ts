import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import EmailVerificationService from '#services/email_verification_service'
import TokenService from '#services/token_service'
import AuthService from '#services/auth_service'
import InvalidVerificationCodeException from '#exceptions/invalid_verification_code_exception'
import VerificationEmailException from '#exceptions/verification_email_exception'
import { verifyEmailValidator, resendVerificationValidator } from '#validators/auth'

@inject()
export default class EmailVerificationController {
  constructor(
    protected emailVerificationService: EmailVerificationService,
    protected tokenService: TokenService,
    protected authService: AuthService
  ) {}

  /**
   * Verify a user's email using code
   */
  async verify({ request, response }: HttpContext) {
    const { email, code } = await request.validateUsing(verifyEmailValidator)

    const user = await this.emailVerificationService.verifyEmail(email, code)

    if (!user) {
      throw new InvalidVerificationCodeException()
    }

    // Generate auth token for the user
    const token = await this.tokenService.generateAuthToken(user)

    return response.json({
      status: true,
      message: 'Email verified successfully',
      user: this.authService.formatUserForResponse(user),
      token,
      type: 'bearer',
    })
  }

  /**
   * Resend verification email with code
   */
  async resend({ request, response }: HttpContext) {
    const { email } = await request.validateUsing(resendVerificationValidator)

    const result = await this.emailVerificationService.resendVerificationEmail(email)

    if (!result) {
      throw new VerificationEmailException(
        'Unable to send verification email. User may not exist or is already verified.'
      )
    }

    return response.json({
      status: true,
      message: 'Verification code sent successfully',
    })
  }
}
