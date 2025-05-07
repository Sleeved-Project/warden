import { Exception } from '@adonisjs/core/exceptions'
import type { HttpContext } from '@adonisjs/core/http'

export default class ServerErrorException extends Exception {
  static status = 500
  static code = 'E_SERVER_ERROR'

  async handle(error: this, { response }: HttpContext) {
    response.status(error.status).send({
      code: error.code,
      message: error.message || 'Internal server error',
      status: error.status,
    })
  }

  async report(error: this, { logger }: HttpContext) {
    logger.error({ err: error, stack: error.stack }, 'Server error occurred: %s', error.message)
  }
}
