import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import EmailVerificationService from '#services/email_verification_service'
import TokenService from '#services/token_service'

@inject()
export default class EmailVerificationController {
  constructor(
    protected emailVerificationService: EmailVerificationService,
    protected tokenService: TokenService
  ) {}

  /**
   * Verify a user's email using code
   */
  async verify({ request, response }: HttpContext) {
    const { email, code } = request.only(['email', 'code'])

    if (!email || !code) {
      return response.status(422).json({
        status: false,
        message: 'Email and verification code are required',
      })
    }

    const user = await this.emailVerificationService.verifyEmail(email, code)

    if (!user) {
      return response.status(400).json({
        status: false,
        message: 'Invalid or expired verification code',
      })
    }

    // Generate auth token for the user
    const token = await this.tokenService.generateAuthToken(user)

    return response.json({
      status: true,
      message: 'Email verified successfully',
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        isVerified: true,
      },
      token,
      type: 'bearer',
    })
  }

  /**
   * Resend verification email with code
   */
  async resend({ request, response }: HttpContext) {
    const { email } = request.only(['email'])

    if (!email) {
      return response.status(422).json({
        status: false,
        message: 'Email address is required',
      })
    }

    const result = await this.emailVerificationService.resendVerificationEmail(email)

    if (!result) {
      return response.status(400).json({
        status: false,
        message: 'Unable to send verification email. User may not exist or is already verified.',
      })
    }

    return response.json({
      status: true,
      message: 'Verification code sent successfully',
    })
  }
}
