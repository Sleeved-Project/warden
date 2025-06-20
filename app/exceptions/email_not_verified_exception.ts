import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class EmailNotVerifiedException extends Exception {
  static status = 403
  static code = 'E_EMAIL_NOT_VERIFIED'

  constructor() {
    super('Email not verified. Please verify your email before accessing this resource.')
  }

  async handle(error: this, { response }: HttpContext) {
    response.status(error.status).json({
      code: error.code,
      message: error.message,
      status: error.status,
    })
  }
}
