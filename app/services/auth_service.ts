import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import TokenService from '#services/token_service'
import EmailVerificationService from '#services/email_verification_service'
import { RegisterData, LoginData, TokenResponse, RegisterResponse, UserPayload } from '#types/auth'
import DuplicateEmailException from '#exceptions/duplicate_email_exception'
import InvalidCredentialsException from '#exceptions/invalid_credentials_exception'
import ServerErrorException from '#exceptions/server_error_exception'
import EmailNotVerifiedException from '#exceptions/email_not_verified_exception'
import { inject } from '@adonisjs/core'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class AuthService {
  constructor(
    protected tokenService: TokenService,
    protected emailVerificationService: EmailVerificationService
  ) {}

  /**
   * Format user model data for API responses
   */
  public formatUserForResponse(user: User): UserPayload {
    return {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isVerified: user.isVerified,
      role: user.role,
    }
  }

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<RegisterResponse> {
    try {
      // Begin a database transaction to ensure atomicity of the registration process
      // If any operation within this transaction fails, all changes will be rolled back
      const result = await db.transaction(async (trx) => {
        const user = await User.create(
          {
            email: data.email,
            password: data.password,
            fullName: data.fullName,
            isVerified: false,
          },
          { client: trx }
        )

        // Send verification email
        await this.emailVerificationService.sendVerificationEmail(user, trx)

        // Return registration success
        return {
          user: this.formatUserForResponse(user),
          requiresVerification: true,
          message: 'Registration successful. Please check your email to verify your account.',
        }
      })

      return result
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === 'P2002') {
        throw new DuplicateEmailException(data.email)
      }

      throw new ServerErrorException(`Unable to create account: ${error.message}`, {
        cause: error,
      })
    }
  }

  /**
   * Authenticate user with email verification and password validation
   */
  async login(data: LoginData): Promise<TokenResponse> {
    const user = await User.findBy('email', data.email)
    if (!user) {
      throw new InvalidCredentialsException()
    }

    const passwordValid = await hash.verify(user.password, data.password)
    if (!passwordValid) {
      throw new InvalidCredentialsException()
    }

    // Reject login if email is not verified
    if (!user.isVerified) {
      throw new EmailNotVerifiedException()
    }

    return this.#generateTokenResponse(user)
  }

  /**
   * Generate token and format response
   * @private
   */
  async #generateTokenResponse(user: User): Promise<TokenResponse> {
    const token = await this.tokenService.generateAuthToken(user)

    return {
      user: this.formatUserForResponse(user),
      token: token,
      type: 'bearer',
    }
  }
}
