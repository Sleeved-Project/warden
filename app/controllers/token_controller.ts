import type { HttpContext } from '@adonisjs/core/http'
import TokenService from '#services/token_service'
import { inject } from '@adonisjs/core'

@inject()
export default class TokenController {
  constructor(protected tokenService: TokenService) {}

  async refreshToken({ request, response }: HttpContext) {
    const validator = vine.compile(
      vine.object({
        refreshToken: vine.string(),
      })
    )

    const { refreshToken } = await request.validateUsing(validator)

    try {
      const result = await this.tokenService.refreshToken(refreshToken)
      return response.ok(result)
    } catch (error) {
      throw error
    }
  }
}
