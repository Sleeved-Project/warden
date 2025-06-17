import type { HttpContext } from '@adonisjs/core/http'
import { loginValidator, registerValidator } from '#validators/auth'
import AuthService from '#services/auth_service'
import { inject } from '@adonisjs/core'

@inject()
export default class AuthController {
  constructor(protected authService: AuthService) {}

  /**
   * Register a new user
   */
  async register({ request, response }: HttpContext) {
    const data = await request.validateUsing(registerValidator)

    const result = await this.authService.register(data)

    return response.created(result)
  }

  /**
   * Login user
   */
  async login({ request, response }: HttpContext) {
    const data = await request.validateUsing(loginValidator)

    const result = await this.authService.login(data)

    return response.ok(result)
  }

  async me({ auth, response }: HttpContext) {
    const user = auth.user!
    return response.ok({
      id: user.id,
      email: user.email,
      fullName: user.fullName,
      isVerified: user.isVerified,
    })
  }
}
