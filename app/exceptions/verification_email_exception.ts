import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class VerificationEmailException extends Exception {
  static status = 400
  static code = 'E_VERIFICATION_EMAIL_ERROR'

  constructor(message = 'Unable to send verification email') {
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
