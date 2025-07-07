import { inject } from '@adonisjs/core'
import User from '#models/user'
import { TokenRefreshResponse } from '#types/auth'
import InvalidRefreshTokenException from '#exceptions/invalid_refresh_token_exception'
import db from '@adonisjs/lucid/services/db'

@inject()
export default class TokenService {
  /**
   * Generate an authentication token for a user
   */
  async generateAuthToken(user: User, refreshTokenId?: number): Promise<string> {
    const token = await User.accessTokens.create(user, ['*'], {
      name: 'api_token',
      expiresIn: '15m', // Short expiration for security
      metadata: {
        isRefreshToken: false,
        parentId: refreshTokenId || null,
      },
    })

    return token.value!.release()
  }

  /**
   * Generate a refresh token for a user with long expiration
   */
  async generateRefreshToken(user: User): Promise<string> {
    const token = await User.accessTokens.create(user, ['refresh'], {
      name: 'refresh_token',
      expiresIn: '30days', // Long expiration
      metadata: { isRefreshToken: true },
    })

    return token.value!.release()
  }

  /**
   * Use a refresh token to get a new access token
   */
  async refreshToken(refreshToken: string): Promise<TokenRefreshResponse> {
    return await db.transaction(async (trx) => {
      // Verify and retrieve the refresh token
      try {
        const token = await User.accessTokens.verify(refreshToken, ['refresh'])

        if (!token.metadata?.isRefreshToken) {
          throw new InvalidRefreshTokenException()
        }

        const user = await User.findOrFail(token.tokenableId)
        const accessToken = await this.generateAuthToken(user, token.identifier)

        return {
          token: accessToken,
          type: 'bearer',
          expiresIn: 900, // 15 minutes in seconds
        }
      } catch (error) {
        if (error.name === 'E_INVALID_ACCESS_TOKEN') {
          throw new InvalidRefreshTokenException()
        }
        throw error
      }
    })
  }
}
