import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class InvalidVerificationCodeException extends Exception {
  static status = 400
  static code = 'E_INVALID_VERIFICATION_CODE'

  constructor(message = 'Invalid or expired verification code') {
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
