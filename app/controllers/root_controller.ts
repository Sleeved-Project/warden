import type { HttpContext } from '@adonisjs/core/http'

export default class RootController {
  /**
   * Display the root information
   */
  async handle({ response }: HttpContext) {
    return response.status(200).json({
      name: 'warden',
      description: 'Authentication microservice for Sleeved',
      versions: [
        { version: 'v1', url: '/api/v1', status: 'current' },
        // Future versions can be added here
      ],
      status: 'WIP',
      documentation: 'https://sleeved.atlassian.net/wiki/x/A4BP',
    })
  }
}
