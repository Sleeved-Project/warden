import User from '#models/user'
import hash from '@adonisjs/core/services/hash'
import TokenService from '#services/token_service'
import { RegisterData, LoginData, TokenResponse } from '#types/auth'
import DuplicateEmailException from '#exceptions/duplicate_email_exception'
import InvalidCredentialsException from '#exceptions/invalid_credentials_exception'
import ServerErrorException from '#exceptions/server_error_exception'
import { inject } from '@adonisjs/core'

@inject()
export default class AuthService {
  constructor(protected tokenService: TokenService) {}

  /**
   * Register a new user
   */
  async register(data: RegisterData): Promise<TokenResponse> {
    try {
      const user = await User.create({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
      })

      return this.#generateTokenResponse(user)
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

    return this.#generateTokenResponse(user)
  }

  /**
   * Generate token and format response
   * @private
   */
  async #generateTokenResponse(user: User): Promise<TokenResponse> {
    const token = await this.tokenService.generateAuthToken(user)

    return {
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      },
      token: token,
      type: 'bearer',
    }
  }
}
