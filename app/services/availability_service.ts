import User from '#models/user'
import { inject } from '@adonisjs/core'

@inject()
export default class AvailabilityService {
  async isEmailAvailable(email: string): Promise<boolean> {
    const existingEmail = await User.query().where('email', email).first()
    return !existingEmail
  }

  async isUsernameAvailable(username: string): Promise<boolean> {
    const existingUsername = await User.query().where('username', username).first()
    return !existingUsername
  }
}
