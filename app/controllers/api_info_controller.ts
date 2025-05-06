import type { HttpContext } from '@adonisjs/core/http'

export default class ApiInfoController {
  /**
   * Display API information and version details
   */
  async handle({ response }: HttpContext) {
    return response.status(200).json({
      name: 'warden',
      description: 'Authentication microservice for the Sleeved ecosystem',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
      status: 'WIP',
    })
  }
}
