import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import TokenService from '#services/token_service'
import { refreshTokenValidator } from '#validators/refresh_token'

@inject()
export default class TokenController {
  constructor(protected tokenService: TokenService) {}

  /**
   * Refresh an access token using a refresh token
   */
  async refresh({ request, response }: HttpContext) {
    const { refreshToken } = await request.validateUsing(refreshTokenValidator)
    const result = await this.tokenService.refreshToken(refreshToken)
    return response.ok(result)
  }
}
