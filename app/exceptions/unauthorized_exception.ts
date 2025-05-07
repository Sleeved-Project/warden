import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class UnauthorizedException extends Exception {
  static status = 401
  static code = 'E_UNAUTHORIZED'

  constructor(message = 'Unauthorized access') {
    super(message)
  }

  async handle(error: this, { response }: HttpContext) {
    response.status(error.status).send({
      code: error.code,
      message: error.message,
      status: error.status,
    })
  }
}
