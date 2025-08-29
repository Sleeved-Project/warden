import { inject } from '@adonisjs/core'
import { Secret } from '@adonisjs/core/helpers'
import User from '#models/user'
import { TokenRefreshResponse } from '#types/auth'
import db from '@adonisjs/lucid/services/db'
import InvalidRefreshTokenException from '#exceptions/invalid_refresh_token_exception'

@inject()
export default class TokenService {
  /**
   * Generate an access token. If refreshTokenId is provided, link via parent_id
   */
  async generateAuthToken(user: User, refreshTokenId?: number): Promise<string> {
    const token = await User.accessTokens.create(user, ['*'], {
      name: 'api_token',
      expiresIn: '15mins',
    })

    if (refreshTokenId) {
      await db
        .query()
        .from('auth_access_tokens')
        .where('id', Number(token.identifier))
        .update({ parent_id: refreshTokenId })
    }

    return token.value!.release()
  }

  /**
   * Generate a refresh token and return both the public value
   */
  async generateRefreshToken(user: User): Promise<{ token: string; id: number }> {
    const token = await User.accessTokens.create(user, ['refresh'], {
      name: 'refresh_token',
      expiresIn: '30days',
    })

    return { token: token.value!.release(), id: Number(token.identifier) }
  }

  /**
   * Exchange a refresh token for a new access token
   */
  async refreshToken(
    refreshToken: string
  ): Promise<TokenRefreshResponse & { refreshToken?: string }> {
    const tokenSecret = new Secret(refreshToken)
    const token = await User.accessTokens.verify(tokenSecret)

    if (!token || !token.allows?.('refresh')) {
      throw new InvalidRefreshTokenException()
    }

    const user = await User.findOrFail(token.tokenableId)

    // issue a new refresh token (rotation)
    const newRefresh = await this.generateRefreshToken(user)

    // issue a new access token linked to the new refresh token
    const accessToken = await this.generateAuthToken(user, Number(newRefresh.id))

    // revoke the used refresh token to prevent reuse
    await db
      .query()
      .from('auth_access_tokens')
      .where('parent_id', Number(token.identifier))
      .delete()
    await db.query().from('auth_access_tokens').where('id', Number(token.identifier)).delete()

    return {
      token: accessToken,
      refreshToken: newRefresh.token,
      type: 'bearer',
    }
  }
}
