import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class EmailSendingException extends Exception {
  static status = 500
  static code = 'E_EMAIL_SENDING_FAILED'

  constructor(message = 'Failed to send email. Please try again later.') {
    super(message)
  }

  async handle(error: this, { response }: HttpContext) {
    response.status(error.status).json({
      code: error.code,
      message: error.message,
      status: false,
    })
  }

  async report(error: this, { logger }: HttpContext) {
    logger.error({ err: error }, 'Email sending error: %s', error.message)
  }
}
