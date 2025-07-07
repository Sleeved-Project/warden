import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class InvalidRefreshTokenException extends Exception {
  static status = 401
  static code = 'E_INVALID_REFRESH_TOKEN'

  constructor(message = 'Invalid or expired refresh token') {
    super(message)
  }

  async handle(error: this, { response }: HttpContext) {
    response.status(error.status).json({
      code: error.code,
      message: error.message,
      status: false,
    })
  }
}
