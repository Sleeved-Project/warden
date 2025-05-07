import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class DuplicateEmailException extends Exception {
  static status = 409
  static code = 'E_DUPLICATE_EMAIL'

  constructor(public email: string) {
    super()
  }

  async handle(error: this, { response }: HttpContext) {
    response.status(error.status).send({
      code: error.code,
      message: `Email address "${this.email}" is already registered`,
      status: error.status,
    })
  }

  async report(error: this, { logger }: HttpContext) {
    logger.warn({ email: error.email }, 'Registration attempt with existing email')
  }
}
