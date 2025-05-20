import { inject } from '@adonisjs/core'
import User from '#models/user'

@inject()
export default class TokenService {
  /**
   * Generate an authentication token for a user
   */
  async generateAuthToken(user: User): Promise<string> {
    const token = await User.accessTokens.create(user, ['*'], {
      name: 'api_token',
      expiresIn: '7days',
    })

    return token.value!.release()
  }
}
