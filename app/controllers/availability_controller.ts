import type { HttpContext } from '@adonisjs/core/http'
import { inject } from '@adonisjs/core'
import AvailabilityService from '#services/availability_service'

@inject()
export default class AvailabilityController {
  constructor(protected availabilityService: AvailabilityService) {}

  /**
   * Check availability of email and/or username
   * Query parameters:
   * - email: string (optional)
   * - username: string (optional)
   *
   * At least one parameter must be provided.
   */
  async check({ request, response }: HttpContext) {
    const { email, username } = request.qs()
    const result: { email?: { available: boolean }; username?: { available: boolean } } = {}

    if (email === undefined && username === undefined) {
      return response
        .status(400)
        .json({ error: 'At least one parameter (email or username) is required' })
    }

    if (email) {
      const available = await this.availabilityService.isEmailAvailable(email)
      result.email = { available }
    }

    if (username) {
      const available = await this.availabilityService.isUsernameAvailable(username)
      result.username = { available }
    }

    return response.ok(result)
  }
}
