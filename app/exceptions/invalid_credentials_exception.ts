import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class InvalidCredentialsException extends Exception {
  static status = 401
  static code = 'E_INVALID_CREDENTIALS'

  async handle(error: this, { response }: HttpContext) {
    response.status(error.status).send({
      code: error.code,
      message: 'Invalid credentials',
      status: error.status,
    })
  }
}
